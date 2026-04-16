import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { anthropic, SAFETY_PREAMBLE } from "@/lib/anthropic"
import { getOrCreateUser, checkSubscriptionAccess, incrementUsage } from "@/lib/db/get-user"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const requestSchema = z.object({
  wireInstructions: z.string().min(20, "Paste the wire instructions.").max(500_000, "Document text is too long (max 500,000 characters)."),
  previousInstructions: z.string().optional().default(""),
  transactionContext: z.string().optional().default(""),
  recipientExpected: z.string().optional().default(""),
})

const SYSTEM_PROMPT = `You are a real estate closing attorney specializing in wire fraud prevention.
Your job is to analyze wire instructions for red flags and generate a verification communication.
Always respond with valid JSON matching the exact structure requested. Never include markdown code blocks.

${SAFETY_PREAMBLE}`

function buildPrompt(data: z.infer<typeof requestSchema>) {
  return `Analyze these wire instructions for potential fraud indicators and return a JSON object:

{
  "extracted": {
    "bankName": "receiving bank name or null",
    "routingNumber": "ABA routing number or null",
    "accountNumber": "account number (partially masked) or null",
    "beneficiary": "beneficiary name or null",
    "reference": "reference/memo or null"
  },
  "redFlags": [
    {
      "severity": "critical" or "high" or "medium",
      "issue": "short description",
      "detail": "why this is concerning"
    }
  ],
  "changes": [
    {
      "field": "which field changed",
      "previous": "old value",
      "current": "new value",
      "risk": "high" or "medium"
    }
  ],
  "verificationEmail": "A professional email to send to the counterparty to verbally verify wire instructions. Include: state you received wire instructions, ask them to call your office at [PHONE] to verbally confirm the details, warn not to reply by email with wire info, reference the property address if provided.",
  "riskLevel": "low" or "medium" or "high" or "critical",
  "summary": "2-3 sentence assessment of the wire instructions"
}

Rules:
- Flag if beneficiary name doesn't match expected party
- Flag international routing (non-US bank)
- Flag P.O. box addresses
- Flag if instructions were received by email only (common fraud vector)
- Flag if any details changed from previous instructions
- Flag unusual account types (personal accounts for business transactions)
- The verification email should be ready to send — professional and firm
- If no previous instructions provided, skip the changes array
- Partially mask account numbers in output (show last 4 digits only)

Wire Instructions:
${data.wireInstructions}

${data.previousInstructions ? `Previous Instructions (for comparison):\n${data.previousInstructions}` : ""}
${data.transactionContext ? `Transaction Context: ${data.transactionContext}` : ""}
${data.recipientExpected ? `Expected Recipient: ${data.recipientExpected}` : ""}`
}

const resultSchema = z.object({
  extracted: z.object({
    bankName: z.string().nullable(),
    routingNumber: z.string().nullable(),
    accountNumber: z.string().nullable(),
    beneficiary: z.string().nullable(),
    reference: z.string().nullable(),
  }),
  redFlags: z.array(z.object({
    severity: z.enum(["critical", "high", "medium"]),
    issue: z.string(),
    detail: z.string(),
  })),
  changes: z.array(z.object({
    field: z.string(),
    previous: z.string(),
    current: z.string(),
    risk: z.enum(["high", "medium"]),
  })),
  verificationEmail: z.string(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  summary: z.string(),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { allowed } = checkRateLimit(userId)
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
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(parsed.data) }],
    })

    const textBlock = message.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") return NextResponse.json({ error: "No response." }, { status: 502 })

    let rawJson: unknown
    try { rawJson = JSON.parse(textBlock.text.trim()) } catch {
      logger.error("verify-wire", "JSON parse failed", { preview: textBlock.text.slice(0, 200) })
      return NextResponse.json({ error: "Failed to parse analysis." }, { status: 502 })
    }

    const validated = resultSchema.safeParse(rawJson)
    if (!validated.success) {
      logger.error("verify-wire", "Schema validation failed", { issues: validated.error.issues })
      return NextResponse.json({ error: "Unexpected format." }, { status: 502 })
    }

    try { await incrementUsage(user.id) } catch (err) { logger.error("verify-wire", "Failed to increment usage", { error: String(err) }) }

    return NextResponse.json({ result: validated.data })
  } catch (err) {
    logger.error("verify-wire", "API error", { error: String(err) })
    return NextResponse.json({ error: "Failed to analyze. Please try again." }, { status: 502 })
  }
}
