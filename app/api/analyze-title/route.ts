import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { anthropic } from "@/lib/anthropic"
import { db } from "@/lib/db"
import { titleAnalyses } from "@/lib/db/schema"
import { getOrCreateUser } from "@/lib/db/get-user"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const requestSchema = z.object({
  commitment: z.string().min(100, "Please paste a complete title commitment (at least 100 characters)."),
})

const SYSTEM_PROMPT = `You are an expert real estate closing attorney analyzing a title commitment.
Your job is to extract and explain key information in plain English that a client or junior attorney can understand.
Always respond with valid JSON matching the exact structure requested. Never include markdown code blocks in your response.`

const buildTitlePrompt = (commitment: string) => `Analyze this title commitment and return a JSON object with the following structure:

{
  "property": {
    "address": "full property address or null if not found",
    "type": "property type (residential/commercial/land/etc) or null",
    "owners": "current owner(s) or null",
    "amount": "policy amount or null"
  },
  "scheduleA": {
    "summary": "2-3 sentence plain-English summary of Schedule A details"
  },
  "requirements": [
    {
      "item": "requirement number or label",
      "description": "plain-English explanation of what must happen before closing",
      "flagged": true or false (flag if unusual, complex, or needs attorney attention)
    }
  ],
  "exceptions": [
    {
      "item": "exception number or label",
      "description": "plain-English explanation of what is NOT covered by the policy",
      "flagged": true or false (flag if unusual, potentially problematic, or needs attorney attention)
    }
  ],
  "redFlags": [
    {
      "severity": "high" or "medium",
      "issue": "short title of the issue",
      "detail": "plain-English explanation of why this needs attention"
    }
  ],
  "summary": "3-5 sentence overall plain-English summary of the title commitment, highlighting the most important items the attorney should know"
}

Rules:
- Explain everything in plain English — no legalese
- Flag any requirement or exception that is non-standard, unusual, or requires careful attention
- Red flags should capture anything that could delay or complicate closing, cloud title, or expose the client to risk
- If a section is not present in the commitment, return an empty array
- Return only the JSON object, nothing else

Title Commitment:
${commitment}`

const analysisSchema = z.object({
  property: z.object({
    address: z.string().nullable(),
    type: z.string().nullable(),
    owners: z.string().nullable(),
    amount: z.string().nullable(),
  }),
  scheduleA: z.object({ summary: z.string() }),
  requirements: z.array(z.object({
    item: z.string(),
    description: z.string(),
    flagged: z.boolean(),
  })),
  exceptions: z.array(z.object({
    item: z.string(),
    description: z.string(),
    flagged: z.boolean(),
  })),
  redFlags: z.array(z.object({
    severity: z.enum(["high", "medium"]),
    issue: z.string(),
    detail: z.string(),
  })),
  summary: z.string(),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { allowed } = checkRateLimit(userId)
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
    )
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

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildTitlePrompt(parsed.data.commitment) }],
    })

    const textBlock = message.content.find((block) => block.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response generated. Please try again." }, { status: 502 })
    }

    const raw = textBlock.text.trim()

    let rawJson: unknown
    try {
      rawJson = JSON.parse(raw)
    } catch {
      logger.error("analyze-title", "Failed to parse JSON response", { preview: raw.slice(0, 200) })
      return NextResponse.json({ error: "Failed to parse analysis. Please try again." }, { status: 502 })
    }

    const validated = analysisSchema.safeParse(rawJson)
    if (!validated.success) {
      logger.error("analyze-title", "Response failed schema validation", { issues: validated.error.issues })
      return NextResponse.json({ error: "Analysis format was unexpected. Please try again." }, { status: 502 })
    }

    // Persist to database (non-blocking)
    try {
      const user = await getOrCreateUser(userId)
      await db.insert(titleAnalyses).values({
        userId: user.id,
        propertyAddress: validated.data.property.address,
        commitmentText: parsed.data.commitment,
        analysis: validated.data,
        redFlagCount: validated.data.redFlags.length,
      })
    } catch (dbErr) {
      logger.error("analyze-title", "DB write failed", { error: String(dbErr) })
    }

    return NextResponse.json({ analysis: validated.data })
  } catch (err) {
    logger.error("analyze-title", "Anthropic API error", { error: String(err) })
    const message = err instanceof Error ? err.message : "Unknown error"
    if (message.includes("rate_limit") || message.includes("429")) {
      return NextResponse.json({ error: "AI service is busy. Please try again in a moment." }, { status: 429 })
    }
    return NextResponse.json({ error: "Failed to analyze title commitment. Please try again." }, { status: 502 })
  }
}
