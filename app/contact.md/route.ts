import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const filePath = join(process.cwd(), "public/contact.md")
  const content = await readFile(filePath, "utf-8")

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
