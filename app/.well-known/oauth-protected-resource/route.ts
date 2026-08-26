import { NextResponse } from "next/server"

export const dynamic = "force-static"

export function GET() {
  const metadata = {
    resource: "https://titlewise.app/api/v1/",
    authorization_servers: ["https://clerk.titlewise.app"],
    scopes_supported: ["api:read", "api:write"],
    bearer_methods_supported: ["header"],
    resource_documentation: "https://titlewise.app/auth.md",
  }

  return NextResponse.json(metadata, {
    headers: { "Cache-Control": "public, max-age=86400" },
  })
}
