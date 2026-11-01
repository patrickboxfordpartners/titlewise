import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { and, eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { matters, wireInstructions } from "@/lib/db/schema"
import { getOrCreateUser } from "@/lib/db/get-user"
import { verifyConfirmToken } from "@/lib/wire-checks"
import { logger } from "@/lib/logger"

const bodySchema = z.object({
  confirmToken: z.string().min(10).max(4000),
  calledBack: z.literal(true),
})

// POST /api/verify-wire/confirm
// The attorney confirms they verified these instructions by phone with a known contact.
// Only then is the wire saved as known-good for future comparisons.
export async function POST(req: NextRequest) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }) }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Confirm the verbal callback first." }, { status: 400 })

  const user = await getOrCreateUser(userId)
  const payload = verifyConfirmToken(parsed.data.confirmToken)
  if (!payload || payload.u !== user.id) {
    return NextResponse.json({ error: "This analysis has expired. Run the check again." }, { status: 400 })
  }

  let matterId: string | null = null
  if (payload.matter) {
    const owned = await db.select({ id: matters.id }).from(matters)
      .where(and(eq(matters.id, payload.matter), eq(matters.userId, user.id))).limit(1)
    matterId = owned.length > 0 ? payload.matter : null
  }

  try {
    const existing = await db.select({ id: wireInstructions.id }).from(wireInstructions)
      .where(and(
        eq(wireInstructions.userId, user.id),
        eq(wireInstructions.routingNumber, payload.routing ?? ""),
        eq(wireInstructions.accountNumber, payload.acct ?? ""),
      )).limit(1)
    if (existing.length === 0) {
      await db.insert(wireInstructions).values({
        userId: user.id,
        bankName: payload.bank,
        routingNumber: payload.routing,
        accountNumber: payload.acct,
        beneficiary: payload.ben,
        matterId,
        verifiedAt: new Date(),
      })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("verify-wire-confirm", "Failed to save confirmed wire", { error: String(err) })
    return NextResponse.json({ error: "Could not save. Please try again." }, { status: 500 })
  }
}
