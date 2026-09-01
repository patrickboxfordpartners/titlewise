import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const DEMO_FINDINGS = [
  { title: "Property Address", description: "18 Harbor View Drive, Portsmouth, NH 03801" },
  { title: "Transaction Type", description: "Residential Purchase, Single Family" },
  { title: "Parties", description: "Buyers: Sarah and David Thompson. Seller: Harbor Realty Trust" },
  { title: "Purchase Price", description: "$485,000.00" },
  { title: "Closing Date", description: "September 15, 2026" },
  { title: "Title Insurance", description: "Owner's policy required. Lender's policy issued by First American Title." },
  { title: "Notable Exception", description: "Easement for municipal drainage recorded Book 4821, Page 112. Should be reviewed for impact on planned additions." },
]

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString("base64")

    if (!process.env.ANTHROPIC_API_KEY) {
      await new Promise((r) => setTimeout(r, 1500))
      return NextResponse.json({ findings: DEMO_FINDINGS, demo: true })
    }

    const opts: ConstructorParameters<typeof Anthropic>[0] = {
      apiKey: process.env.ANTHROPIC_API_KEY,
    }
    if (process.env.ANTHROPIC_WORKSPACE_ID) {
      opts.defaultHeaders = { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
    }
    const anthropic = new Anthropic(opts)

    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64,
                },
              },
              {
                type: "text",
                text: `You are analyzing a real estate closing document. Extract key information and present findings in a structured way.

Provide 3-7 key findings as a JSON array with this structure:
[
  {"title": "Property Address", "description": "123 Main St, City, State"},
  {"title": "Buyer Name", "description": "John and Jane Doe"},
  ...
]

Focus on: property address, parties involved, transaction type, key dates, financial figures, and any red flags or notable items.

Return ONLY the JSON array, no other text.`,
              },
            ],
          },
        ],
      })

      const content = message.content[0]
      if (content.type !== "text") {
        throw new Error("Unexpected response type")
      }

      let findings: { title: string; description: string }[]
      try {
        const text = content.text.replace(/```json\n?|\n?```/g, "").trim()
        findings = JSON.parse(text)
      } catch {
        findings = [
          { title: "Document Analyzed", description: "AI successfully processed the document but could not extract structured data." },
          { title: "Raw Response", description: content.text.slice(0, 300) },
        ]
      }

      return NextResponse.json({ findings })
    } catch (apiError: any) {
      if (apiError?.status === 400 || apiError?.status === 404 || apiError?.status === 401) {
        await new Promise((r) => setTimeout(r, 1500))
        return NextResponse.json({ findings: DEMO_FINDINGS, demo: true })
      }
      throw apiError
    }
  } catch (error: any) {
    console.error("Demo analysis error:", error)
    return NextResponse.json(
      { error: "Analysis failed", detail: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}
