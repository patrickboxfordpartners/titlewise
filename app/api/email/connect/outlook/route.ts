import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { getOrCreateUser } from "@/lib/db/get-user"

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getOrCreateUser(userId)
  const nonce = randomBytes(16).toString("hex")
  const state = Buffer.from(`${user.id}:${nonce}`).toString("base64url")

  const { origin } = new URL(req.url)
  const redirectUri = `${origin}/api/email/callback/outlook`

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "Mail.Send offline_access",
    state,
  })

  const response = NextResponse.redirect(
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
  )
  response.cookies.set("oauth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })
  return response
}
