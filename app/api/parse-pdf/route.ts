import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { PDFParse } from "pdf-parse"
import { logger } from "@/lib/logger"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const parser = new PDFParse({ data: new Uint8Array(buffer) })
    const result = await parser.getText()
    await parser.destroy()

    if (!result.text || result.text.trim().length < 50) {
      return NextResponse.json({ error: "Could not extract text from this PDF. It may be image-based." }, { status: 422 })
    }

    return NextResponse.json({ text: result.text })
  } catch (err) {
    logger.error("parse-pdf", "PDF extraction failed", { error: String(err) })
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 })
  }
}
