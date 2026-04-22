import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { anthropic, SAFETY_PREAMBLE } from "@/lib/anthropic"
import { getOrCreateUser, checkSubscriptionAccess, incrementUsage } from "@/lib/db/get-user"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const requestSchema = z.object({
  hoaDocuments: z.string().min(100, "Paste the HOA/condo document text.").max(500_000, "Document text is too long (max 500,000 characters)."),
})

const SYSTEM_PROMPT = `You are an expert real estate closing attorney reviewing HOA/condominium association documents.
Your job is to extract key financial and legal information that affects the closing and the buyer's decision.
Always respond with valid JSON matching the exact structure requested. Never include markdown code blocks.

${SAFETY_PREAMBLE}`

function buildPrompt(docs: string) {
  return `Analyze these HOA/condo documents and return a JSON object:

{
  "association": {
    "name": "HOA/condo association name or null",
    "managementCompany": "management company name or null",
    "contact": "contact info or null"
  },
  "financial": {
    "monthlyDues": "amount or null",
    "specialAssessments": "current or pending assessments, or 'None noted'",
    "reserves": "reserve fund status/percentage or null",
    "transferFee": "transfer/move-in fee amount or null",
    "delinquencies": "any unit delinquencies or collection actions noted"
  },
  "restrictions": [
    {
      "category": "Rental" or "Pets" or "Parking" or "Modifications" or "Commercial Use" or "Other",
      "detail": "plain-English explanation of the restriction",
      "flagged": true if unusually restrictive or could affect buyer
    }
  ],
  "litigation": {
    "pending": true or false,
    "details": "description of any pending or recent litigation, or 'None disclosed'"
  },
  "insurance": {
    "masterPolicy": "description of what's covered or null",
    "gaps": "any noted coverage gaps or requirements for unit owners"
  },
  "redFlags": [
    {
      "severity": "high" or "medium",
      "issue": "short title",
      "detail": "why this matters for the buyer/closing"
    }
  ],
  "summary": "3-5 sentence summary highlighting the most important findings for the buyer and closing attorney"
}

Rules:
- Extract all financial obligations the buyer will inherit
- Flag any pending litigation (always high severity)
- Flag special assessments (current or planned)
- Flag low reserve percentages (under 10% of annual budget is concerning)
- Flag restrictive rental policies (affects investors)
- Flag any right of first refusal
- Note insurance gaps that could require additional unit owner coverage
- Be specific with dollar amounts when found
- If information is not found in the documents, use null

HOA/Condo Documents:
${docs}`
}

const resultSchema = z.object({
  association: z.object({
    name: z.string().nullable(),
    managementCompany: z.string().nullable(),
    contact: z.string().nullable(),
  }),
  financial: z.object({
    monthlyDues: z.string().nullable(),
    specialAssessments: z.string().nullable(),
    reserves: z.string().nullable(),
    transferFee: z.string().nullable(),
    delinquencies: z.string().nullable(),
  }),
  restrictions: z.array(z.object({
    category: z.string(),
    detail: z.string(),
    flagged: z.boolean(),
  })),
  litigation: z.object({
    pending: z.boolean(),
    details: z.string(),
  }),
  insurance: z.object({
    masterPolicy: z.string().nullable(),
    gaps: z.string().nullable(),
  }),
  redFlags: z.array(z.object({
    severity: z.enum(["high", "medium"]),
    issue: z.string(),
    detail: z.string(),
  })),
  summary: z.string(),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { allowed } = await checkRateLimit(userId)
  if (!allowed) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }) }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 })

  const user = await getOrCreateUser(userId)
  const access = await checkSubscriptionAccess(user)
  if (!access.allowed) return NextResponse.json({ error: access.message }, { status: 403 })

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(parsed.data.hoaDocuments) }],
    })

    const textBlock = message.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") return NextResponse.json({ error: "No response." }, { status: 502 })

    let rawJson: unknown
    try { rawJson = JSON.parse(textBlock.text.trim()) } catch {
      logger.error("review-hoa", "JSON parse failed", { preview: textBlock.text.slice(0, 200) })
      return NextResponse.json({ error: "Failed to parse review." }, { status: 502 })
    }

    const validated = resultSchema.safeParse(rawJson)
    if (!validated.success) {
      logger.error("review-hoa", "Schema validation failed", { issues: validated.error.issues })
      return NextResponse.json({ error: "Unexpected format." }, { status: 502 })
    }

    try { await incrementUsage(user.id) } catch (err) { logger.error("review-hoa", "Failed to increment usage", { error: String(err) }) }
    return NextResponse.json({ review: validated.data })
  } catch (err) {
    logger.error("review-hoa", "API error", { error: String(err) })
    return NextResponse.json({ error: "Failed to review. Please try again." }, { status: 502 })
  }
}
