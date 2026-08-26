import { NextResponse } from "next/server"

export const dynamic = "force-static"

const BASE = "https://titlewise.app"

export function GET() {
  const linkset = {
    linkset: [
      {
        anchor: `${BASE}/api/v1/`,
        "service-desc": [
          { href: `${BASE}/.well-known/openapi.json`, type: "application/openapi+json" },
        ],
        "service-doc": [{ href: `${BASE}/api-docs` }],
        status: [{ href: `${BASE}/api/health` }],
      },
    ],
  }

  return new NextResponse(JSON.stringify(linkset, null, 2), {
    headers: {
      "Content-Type": "application/linkset+json",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
