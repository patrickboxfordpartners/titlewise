import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { db } from "@/lib/db"
import { users, teamMembers } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"
import { PLANS } from "@/lib/plans"
import { randomBytes } from "crypto"
import { logger } from "@/lib/logger"

const inviteSchema = z.object({ email: z.email() })

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getOrCreateUser(userId)

  const members = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.ownerId, user.id), eq(teamMembers.status, "accepted")))

  const pending = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.ownerId, user.id), eq(teamMembers.status, "pending")))

  const plan = user.subscriptionTier ? PLANS[user.subscriptionTier as keyof typeof PLANS] : null
  const seatLimit = plan?.seats ?? 1

  return NextResponse.json({
    members,
    pending,
    seatLimit,
    seatsUsed: members.length + 1, // +1 for owner
  })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getOrCreateUser(userId)

  // Seat check
  const plan = user.subscriptionTier ? PLANS[user.subscriptionTier as keyof typeof PLANS] : null
  const seatLimit = plan?.seats ?? 1

  const existingMembers = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(and(eq(teamMembers.ownerId, user.id), eq(teamMembers.status, "accepted")))

  if (existingMembers.length + 1 >= seatLimit) {
    return NextResponse.json({
      error: `Your ${plan?.name ?? "current"} plan allows ${seatLimit} seat${seatLimit !== 1 ? "s" : ""}. Upgrade to invite more team members.`,
    }, { status: 403 })
  }

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Valid email required" }, { status: 400 })

  const { email } = parsed.data

  // Don't invite owner's own email
  if (email.toLowerCase() === user.email.toLowerCase()) {
    return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 })
  }

  const token = randomBytes(32).toString("hex")

  // Upsert invite (re-invite sends a fresh token)
  const existing = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.ownerId, user.id), eq(teamMembers.invitedEmail, email.toLowerCase())))
    .limit(1)

  if (existing.length > 0 && existing[0].status === "accepted") {
    return NextResponse.json({ error: "This person is already on your team" }, { status: 409 })
  }

  if (existing.length > 0) {
    await db.update(teamMembers).set({ inviteToken: token, status: "pending" }).where(eq(teamMembers.id, existing[0].id))
  } else {
    await db.insert(teamMembers).values({
      ownerId: user.id,
      invitedEmail: email.toLowerCase(),
      inviteToken: token,
    })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://titlewise.app"
  const inviteUrl = `${appUrl}/join?token=${token}`

  // TODO: Send invite email via SES (for now log the URL)
  logger.info("team/invite", `Invite sent to ${email}`, { inviteUrl, owner: user.email })

  return NextResponse.json({ success: true, inviteUrl })
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getOrCreateUser(userId)
  const memberId = new URL(req.url).searchParams.get("id")
  if (!memberId) return NextResponse.json({ error: "id required" }, { status: 400 })

  await db.update(teamMembers)
    .set({ status: "revoked" })
    .where(and(eq(teamMembers.id, memberId), eq(teamMembers.ownerId, user.id)))

  return NextResponse.json({ success: true })
}
