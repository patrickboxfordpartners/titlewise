import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const filePath = join(process.cwd(), "public/.well-known/api-catalog")
  const content = await readFile(filePath, "utf-8")

  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/linkset+json;profile=\"https://www.rfc-editor.org/info/rfc9727\"",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
