import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { encryptToken } from "@/lib/email/crypto"
import { getOrCreateUser } from "@/lib/db/get-user"

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  if (searchParams.get("error")) {
    return NextResponse.redirect(new URL("/settings?error=oauth_denied", req.url))
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/settings?error=oauth_invalid", req.url))
  }

  // Verify state and nonce
  const cookieStore = await cookies()
  const nonce = cookieStore.get("oauth_nonce")?.value
  let stateUserId: string
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8")
    const [uid, stateNonce] = decoded.split(":")
    if (!stateNonce || stateNonce !== nonce) throw new Error("nonce mismatch")
    stateUserId = uid
  } catch {
    return NextResponse.redirect(new URL("/settings?error=oauth_invalid_state", req.url))
  }

  const user = await getOrCreateUser(userId)
  if (user.id !== stateUserId) {
    return NextResponse.redirect(new URL("/settings?error=oauth_invalid_state", req.url))
  }

  // Exchange code for tokens
  const { origin } = new URL(req.url)
  const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/email/callback/outlook`,
      grant_type: "authorization_code",
      scope: "Mail.Send offline_access",
    }),
  })
  const tokenData = await tokenRes.json() as {
    refresh_token?: string
    access_token?: string
    error?: string
  }

  if (!tokenRes.ok || !tokenData.refresh_token) {
    return NextResponse.redirect(new URL("/settings?error=oauth_token_failed", req.url))
  }

  await db.update(users)
    .set({ outlookRefreshToken: encryptToken(tokenData.refresh_token), updatedAt: new Date() })
    .where(eq(users.id, user.id))

  const response = NextResponse.redirect(new URL("/settings?connected=outlook", req.url))
  response.cookies.delete("oauth_nonce")
  return response
}
