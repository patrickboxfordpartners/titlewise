import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { anthropic } from "@/lib/anthropic"

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

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { commitment } = body

  if (!commitment || commitment.trim().length < 100) {
    return NextResponse.json({ error: "Please paste a complete title commitment." }, { status: 400 })
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildTitlePrompt(commitment) }],
  })

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : ""

  let analysis
  try {
    analysis = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: "Failed to parse analysis. Please try again." }, { status: 500 })
  }

  return NextResponse.json({ analysis })
}
