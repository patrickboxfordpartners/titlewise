import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { anthropic, SAFETY_PREAMBLE } from "@/lib/anthropic"
import { getOrCreateUser, checkSubscriptionAccess, incrementUsage } from "@/lib/db/get-user"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const requestSchema = z.object({
  closingDisclosure: z.string().min(100, "Paste the full Closing Disclosure text.").max(500_000, "Document text is too long (max 500,000 characters)."),
  contractTerms: z.string().min(50, "Provide the key contract terms for comparison.").max(500_000, "Document text is too long (max 500,000 characters)."),
})

const SYSTEM_PROMPT = `You are an expert real estate closing attorney reviewing a Closing Disclosure against the purchase/sale contract terms.
Your job is to identify discrepancies, errors, and items that need attention before closing.
Always respond with valid JSON matching the exact structure requested. Never include markdown code blocks.

${SAFETY_PREAMBLE}`

function buildPrompt(cd: string, contract: string) {
  return `Compare this Closing Disclosure against the contract terms and return a JSON object:

{
  "property": {
    "address": "property address from CD or null",
    "buyer": "buyer name(s) or null",
    "seller": "seller name(s) or null",
    "lender": "lender name or null"
  },
  "discrepancies": [
    {
      "field": "which field has the issue (e.g. Purchase Price, Closing Date, Seller Credits)",
      "cdValue": "what the CD says",
      "contractValue": "what the contract says",
      "severity": "high" or "medium" or "low",
      "recommendation": "what should be done to resolve"
    }
  ],
  "warnings": [
    {
      "issue": "short description",
      "detail": "plain-English explanation",
      "severity": "high" or "medium"
    }
  ],
  "verified": [
    "list of fields that match correctly between CD and contract"
  ],
  "summary": "3-5 sentence overall assessment. State whether the CD is ready for closing or needs corrections."
}

Rules:
- Compare: purchase price, closing date, earnest money, seller credits/concessions, loan amount, interest rate, property address, buyer/seller names, prorations
- Flag ANY mismatch, even minor ones (name spelling, date off by a day)
- High severity: wrong purchase price, wrong loan amount, missing credits, wrong parties
- Medium severity: date discrepancies, proration differences, minor fee variances
- Low severity: formatting differences, immaterial variances under $50
- If information is missing from either document, note it as a warning
- Be specific about what the discrepancy is and how to fix it

Closing Disclosure:
${cd}

Contract Terms:
${contract}`
}

const analysisSchema = z.object({
  property: z.object({
    address: z.string().nullable(),
    buyer: z.string().nullable(),
    seller: z.string().nullable(),
    lender: z.string().nullable(),
  }),
  discrepancies: z.array(z.object({
    field: z.string(),
    cdValue: z.string(),
    contractValue: z.string(),
    severity: z.enum(["high", "medium", "low"]),
    recommendation: z.string(),
  })),
  warnings: z.array(z.object({
    issue: z.string(),
    detail: z.string(),
    severity: z.enum(["high", "medium"]),
  })),
  verified: z.array(z.string()),
  summary: z.string(),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { allowed } = checkRateLimit(userId)
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 })
  }

  const user = await getOrCreateUser(userId)
  const access = await checkSubscriptionAccess(user)
  if (!access.allowed) {
    return NextResponse.json({ error: access.message }, { status: 403 })
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(parsed.data.closingDisclosure, parsed.data.contractTerms) }],
    })

    const textBlock = message.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response generated." }, { status: 502 })
    }

    let rawJson: unknown
    try { rawJson = JSON.parse(textBlock.text.trim()) } catch {
      logger.error("review-cd", "Failed to parse response", { preview: textBlock.text.slice(0, 200) })
      return NextResponse.json({ error: "Failed to parse review. Please try again." }, { status: 502 })
    }

    const validated = analysisSchema.safeParse(rawJson)
    if (!validated.success) {
      logger.error("review-cd", "Schema validation failed", { issues: validated.error.issues })
      return NextResponse.json({ error: "Unexpected review format. Please try again." }, { status: 502 })
    }

    try { await incrementUsage(user.id) } catch (err) { logger.error("review-cd", "Failed to increment usage", { error: String(err) }) }

    return NextResponse.json({ review: validated.data })
  } catch (err) {
    logger.error("review-cd", "API error", { error: String(err) })
    return NextResponse.json({ error: "Failed to review. Please try again." }, { status: 502 })
  }
}
