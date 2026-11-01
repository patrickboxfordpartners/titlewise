import { requireAuth } from "@/lib/auth-helpers"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { wireInstructions } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { z } from "zod/v4"
import { anthropic, SAFETY_PREAMBLE } from "@/lib/anthropic"
import { getOrCreateUser, checkSubscriptionAccess, incrementUsage } from "@/lib/db/get-user"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"
import {
  isValidAbaRouting, normalizeRouting, hashAccount, maskAccount,
  encodeStoredAccount, decodeStoredAccount, signConfirmToken, hashUsesActiveKey,
  routingAppearsInSource, accountAppearsInSource,
} from "@/lib/wire-checks"

const requestSchema = z.object({
  wireInstructions: z.string().min(20, "Paste the wire instructions.").max(500_000, "Document text is too long (max 500,000 characters)."),
  previousInstructions: z.string().optional().default(""),
  transactionContext: z.string().optional().default(""),
  recipientExpected: z.string().optional().default(""),
  matterId: z.string().uuid().optional(),
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
    "accountNumber": "full account number exactly as written, or null",
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
- The verification email should be ready to send, professional and firm
- If no previous instructions provided, skip the changes array
- Return the full account number in extracted.accountNumber (the server masks it before display); never repeat it in any other field

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
  const userId = await requireAuth()
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
      max_tokens: 3000,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(parsed.data) }],
    })

    const textBlock = message.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") return NextResponse.json({ error: "No response." }, { status: 502 })

    let rawJson: unknown
    try { rawJson = JSON.parse(textBlock.text.trim()) } catch {
      logger.error("verify-wire", "JSON parse failed", { length: textBlock.text.length })
      return NextResponse.json({ error: "Failed to parse analysis." }, { status: 502 })
    }

    const validated = resultSchema.safeParse(rawJson)
    if (!validated.success) {
      logger.error("verify-wire", "Schema validation failed", { issues: validated.error.issues })
      return NextResponse.json({ error: "Unexpected format." }, { status: 502 })
    }

    try { await incrementUsage(user.id) } catch (err) { logger.error("verify-wire", "Failed to increment usage", { error: String(err) }) }

    const result = validated.data
    const deviations: string[] = []

    // Deterministic checks (no AI): ABA checksum + keyed account-number hash
    // The model's extraction is only trusted where it appears verbatim in the pasted text. A value it
    // "fixed" or mistranscribed would otherwise pass the checksum, be hashed, and be signed as confirmed.
    const source = parsed.data.wireInstructions
    let routing = normalizeRouting(result.extracted.routingNumber)
    let fullAccount = result.extracted.accountNumber
    let extractionUnverified = false
    if (routing && !routingAppearsInSource(source, routing)) {
      routing = null
      extractionUnverified = true
      result.redFlags.unshift({
        severity: "high",
        issue: "Routing number could not be matched to the pasted text",
        detail: "The extracted routing number does not appear in the instructions you pasted, so it was discarded. Read the routing number from the original document.",
      })
    }
    if (fullAccount && !accountAppearsInSource(source, fullAccount)) {
      fullAccount = null
      extractionUnverified = true
      result.redFlags.unshift({
        severity: "high",
        issue: "Account number could not be matched to the pasted text",
        detail: "The extracted account number does not appear in the instructions you pasted, so it was discarded. Read the account number from the original document.",
      })
    }
    if (extractionUnverified && (result.riskLevel === "low" || result.riskLevel === "medium")) result.riskLevel = "high"
    const accountHash = hashAccount(user.id, fullAccount)
    const maskedAccount = maskAccount(fullAccount)
    result.extracted.routingNumber = routing
    result.extracted.accountNumber = maskedAccount

    const deterministicChecks = {
      routingChecksum: routing ? (isValidAbaRouting(routing) ? "valid" : "invalid") : "not_found",
      accountCheck: "unavailable",
      skippedOldKeyHashes: 0,
    } as { routingChecksum: "valid" | "invalid" | "not_found"; accountCheck: "compared" | "no_known_account" | "unavailable"; skippedOldKeyHashes: number }

    if (deterministicChecks.routingChecksum === "invalid") {
      result.redFlags.unshift({
        severity: "high",
        issue: "Routing number fails ABA checksum",
        detail: `"${routing}" is not a valid ABA routing number (checksum failed). It may be mistyped or fabricated. Do not wire until confirmed by phone with a known contact.`,
      })
      if (result.riskLevel === "low" || result.riskLevel === "medium") result.riskLevel = "high"
    }

    // Institutional memory: compare against wires an attorney previously confirmed by callback
    if (routing) {
      try {
        const known = await db
          .select()
          .from(wireInstructions)
          .where(and(
            eq(wireInstructions.userId, user.id),
            eq(wireInstructions.routingNumber, routing),
          ))
          .orderBy(desc(wireInstructions.verifiedAt))
          .limit(100)

        if (known.length === 0) {
          deterministicChecks.accountCheck = "no_known_account"
        } else {
          const knownBanks = [...new Set(known.map(w => w.bankName).filter(Boolean))]
          const knownBeneficiaries = [...new Set(known.map(w => w.beneficiary).filter(Boolean))]
          const storedHashes = known.map(w => decodeStoredAccount(w.accountNumber).hash).filter((h): h is string => Boolean(h))
          const knownHashes = storedHashes.filter(hashUsesActiveKey)
          deterministicChecks.skippedOldKeyHashes = storedHashes.length - knownHashes.length
          if (storedHashes.length > knownHashes.length) {
            logger.warn("verify-wire", "Some stored account hashes were made with a different key and were skipped", { skipped: storedHashes.length - knownHashes.length })
          }

          if (result.extracted.bankName && knownBanks.length > 0 && !knownBanks.some(b => b?.toLowerCase() === result.extracted.bankName?.toLowerCase())) {
            deviations.push(`Bank name "${result.extracted.bankName}" differs from previously confirmed wires on this routing number (previously: ${knownBanks.join(", ")})`)
          }
          if (result.extracted.beneficiary && knownBeneficiaries.length > 0 && !knownBeneficiaries.some(b => result.extracted.beneficiary?.toLowerCase().includes(b?.toLowerCase() ?? ""))) {
            deviations.push(`Beneficiary "${result.extracted.beneficiary}" differs from previously confirmed wires (previously: ${knownBeneficiaries.join(", ")})`)
          }
          if (accountHash && knownHashes.length > 0) {
            deterministicChecks.accountCheck = "compared"
            if (!knownHashes.includes(accountHash)) {
              deviations.push(`Account number ${maskedAccount ?? ""} does not match any account previously confirmed for this routing number`)
            }
          }
        }
      } catch (err) {
        logger.error("verify-wire", "Institutional memory check failed (non-blocking)", { error: String(err) })
      }
    }

    // Nothing is saved automatically. The attorney confirms after a verbal callback.
    // A routing number that fails the checksum can never be saved as confirmed.
    const confirmToken = routing && deterministicChecks.routingChecksum === "valid" && !extractionUnverified
      ? signConfirmToken({
          u: user.id,
          bank: result.extracted.bankName,
          routing,
          acct: encodeStoredAccount(maskedAccount, accountHash),
          ben: result.extracted.beneficiary,
          matter: parsed.data.matterId ?? null,
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
        })
      : null

    return NextResponse.json({ result, institutionalDeviations: deviations, deterministicChecks, confirmToken })
  } catch (err) {
    logger.error("verify-wire", "API error", { error: String(err) })
    return NextResponse.json({ error: "Failed to analyze. Please try again." }, { status: 502 })
  }
}
