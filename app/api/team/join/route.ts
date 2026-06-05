import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { teamMembers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const token = (body as { token?: string }).token
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })

  const [invite] = await db.select().from(teamMembers)
    .where(eq(teamMembers.inviteToken, token))
    .limit(1)

  if (!invite) return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 })
  if (invite.status === "revoked") return NextResponse.json({ error: "This invitation has been revoked" }, { status: 410 })
  if (invite.status === "accepted") return NextResponse.json({ ok: true, alreadyAccepted: true })

  const user = await getOrCreateUser(userId)

  await db.update(teamMembers)
    .set({ status: "accepted", joinedUserId: user.id, acceptedAt: new Date() })
    .where(eq(teamMembers.inviteToken, token))

  return NextResponse.json({ ok: true })
}
