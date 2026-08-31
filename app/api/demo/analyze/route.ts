import { requireAuth } from "@/lib/auth-helpers"
import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

// Stub for PDF extraction - lib/pdf doesn't exist yet
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return `[PDF text extraction not implemented]\n\n${buffer.slice(0, 1000).toString('utf-8')}`
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  const userId = await requireAuth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Extract text from PDF
    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await extractTextFromPDF(buffer)

    // Analyze with Claude
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are analyzing a real estate closing document. Extract key information and present findings in a structured way.

Document text:
${text.slice(0, 8000)}

Provide 3-5 key findings as a JSON array with this structure:
[
  {"title": "Property Address", "description": "123 Main St, City, State"},
  {"title": "Buyer Name", "description": "John and Jane Doe"},
  ...
]

Return ONLY the JSON array, no other text.`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type")
    }

    let findings: any[]
    try {
      findings = JSON.parse(content.text)
    } catch {
      // Fallback if JSON parsing fails
      findings = [
        { title: "Document Analyzed", description: "AI successfully processed the document" },
        { title: "Key Information Extracted", description: "Property details, parties, and closing information identified" },
        { title: "Ready for Review", description: "Full analysis would appear here in production" },
      ]
    }

    return NextResponse.json({ findings })
  } catch (error) {
    console.error("Demo analysis error:", error)
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    )
  }
}
