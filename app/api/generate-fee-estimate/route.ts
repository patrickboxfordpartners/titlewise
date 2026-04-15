import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { anthropic, SAFETY_PREAMBLE } from "@/lib/anthropic"
import { getOrCreateUser, checkSubscriptionAccess, incrementUsage } from "@/lib/db/get-user"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const requestSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  transactionType: z.enum(["Purchase", "Sale", "Refinance", "Cash Purchase", "Commercial", "HELOC"]),
  propertyType: z.enum(["Single Family", "Condo/Townhouse", "Multi-Family", "Commercial", "Land"]),
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
  purchasePrice: z.string().optional().default(""),
  complexity: z.enum(["Standard", "Moderate", "Complex"]).optional().default("Standard"),
  additionalServices: z.string().optional().default(""),
  firmName: z.string().optional().default(""),
  attorneyName: z.string().min(1, "Attorney name is required"),
})

function buildPrompt(data: z.infer<typeof requestSchema>) {
  return `You are a real estate closing attorney drafting a professional fee estimate letter for a prospective client.

${SAFETY_PREAMBLE}

Generate a formal fee estimate letter with the following details:

Client: ${data.clientName}
Transaction Type: ${data.transactionType}
Property Type: ${data.propertyType}
Jurisdiction: ${data.jurisdiction}
${data.purchasePrice ? `Purchase/Sale Price: ${data.purchasePrice}` : ""}
Complexity: ${data.complexity}
${data.additionalServices ? `Additional Services Requested: ${data.additionalServices}` : ""}
${data.firmName ? `Firm: ${data.firmName}` : ""}
Attorney: ${data.attorneyName}

Requirements:
- Professional letter format with date and salutation
- Break fees into clear line items (attorney fee, title search, recording fees, etc.)
- Include a range for the attorney fee based on complexity and transaction type
- Note that estimates may vary based on actual complexity
- Include common disbursements and third-party costs as separate line items with "estimated" labels
- Add a note about what is NOT included (e.g., title insurance premiums, lender fees)
- Close with next steps for engagement
- Sign off with attorney name and firm
- Use realistic fee ranges appropriate for the jurisdiction
- Do NOT fabricate specific dollar amounts that you cannot reasonably estimate — use ranges instead
- Keep it to one page length`
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { allowed } = checkRateLimit(userId)
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation failed"
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  const user = await getOrCreateUser(userId)
  const access = await checkSubscriptionAccess(user)
  if (!access.allowed) {
    return NextResponse.json({ error: access.message }, { status: 403 })
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: buildPrompt(parsed.data) }],
    })

    const textBlock = message.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response generated." }, { status: 502 })
    }

    try { await incrementUsage(user.id) } catch {}

    return NextResponse.json({ estimate: textBlock.text })
  } catch (err) {
    logger.error("generate-fee-estimate", "Anthropic API error", { error: String(err) })
    return NextResponse.json({ error: "Failed to generate estimate. Please try again." }, { status: 502 })
  }
}
