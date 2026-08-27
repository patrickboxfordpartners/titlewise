import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

export const dynamic = "force-static"

export async function GET() {
  const filePath = join(process.cwd(), "public/.well-known/agent-card.json")
  const content = await readFile(filePath, "utf-8")

  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
