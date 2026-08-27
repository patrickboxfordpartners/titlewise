import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export function GET() {
  return NextResponse.redirect(
    "https://clerk.titlewise.app/.well-known/openid-configuration",
    { status: 302 }
  )
}
