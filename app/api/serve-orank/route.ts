import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const FILE_MAP: Record<string, { path: string; contentType: string }> = {
  "/.well-known/ard.json": {
    path: "public/.well-known/ard.json",
    contentType: "application/json",
  },
  "/.well-known/agent-card.json": {
    path: "public/.well-known/agent-card.json",
    contentType: "application/json",
  },
  "/.well-known/oauth-authorization-server": {
    path: "public/.well-known/oauth-authorization-server",
    contentType: "application/json",
  },
  "/pricing.md": {
    path: "public/pricing.md",
    contentType: "text/markdown; charset=utf-8",
  },
  "/about.md": {
    path: "public/about.md",
    contentType: "text/markdown; charset=utf-8",
  },
  "/contact.md": {
    path: "public/contact.md",
    contentType: "text/markdown; charset=utf-8",
  },
  "/privacy.md": {
    path: "public/privacy.md",
    contentType: "text/markdown; charset=utf-8",
  },
  "/index.md": {
    path: "public/index.md",
    contentType: "text/markdown; charset=utf-8",
  },
  "/auth.md": {
    path: "public/auth.md",
    contentType: "text/markdown; charset=utf-8",
  },
  "/schemamap.xml": {
    path: "public/schemamap.xml",
    contentType: "application/xml",
  },
}

export async function GET(request: NextRequest) {
  const requestedPath = request.nextUrl.searchParams.get("path")

  if (!requestedPath || !FILE_MAP[requestedPath]) {
    return new NextResponse("Not Found", { status: 404 })
  }

  const { path, contentType } = FILE_MAP[requestedPath]

  try {
    const filePath = join(process.cwd(), path)
    const content = await readFile(filePath, "utf-8")

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    return new NextResponse("File not found", { status: 404 })
  }
}
