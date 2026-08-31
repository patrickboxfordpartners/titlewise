import { requireAuth } from "@/lib/auth-helpers"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { db } from "@/lib/db"
import { matters, documentSlots } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"

const updateSlotSchema = z.object({
  status: z.enum(["pending", "received", "waived"]).optional(),
  notes: z.string().nullable().optional(),
})

async function getOwnedMatter(matterId: string, userId: string) {
  const user = await getOrCreateUser(userId)
  const [matter] = await db.select().from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.userId, user.id)))
    .limit(1)
  return matter ?? null
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ matterId: string; slotId: string }> }) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId, slotId } = await params
  const matter = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = updateSlotSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (parsed.data.status) updates.status = parsed.data.status
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes

  await db.update(documentSlots).set(updates)
    .where(and(eq(documentSlots.id, slotId), eq(documentSlots.matterId, matterId)))

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ matterId: string; slotId: string }> }) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId, slotId } = await params
  const matter = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.delete(documentSlots)
    .where(and(eq(documentSlots.id, slotId), eq(documentSlots.matterId, matterId)))

  return NextResponse.json({ ok: true })
}
