import { requireAuth } from "@/lib/auth-helpers"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { db } from "@/lib/db"
import { matters, matterParties } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"

const updatePartySchema = z.object({
  role: z.enum(["buyer", "seller", "buyers_agent", "listing_agent", "lender", "other"]).optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
})

async function getOwnedMatter(matterId: string, userId: string) {
  const user = await getOrCreateUser(userId)
  const [matter] = await db.select().from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.userId, user.id)))
    .limit(1)
  return matter ?? null
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ matterId: string; partyId: string }> }) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId, partyId } = await params
  const matter = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = updatePartySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (parsed.data.role) updates.role = parsed.data.role
  if (parsed.data.name) updates.name = parsed.data.name
  if (parsed.data.email !== undefined) updates.email = parsed.data.email
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone
  if (parsed.data.company !== undefined) updates.company = parsed.data.company

  await db.update(matterParties).set(updates)
    .where(and(eq(matterParties.id, partyId), eq(matterParties.matterId, matterId)))

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ matterId: string; partyId: string }> }) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId, partyId } = await params
  const matter = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.delete(matterParties)
    .where(and(eq(matterParties.id, partyId), eq(matterParties.matterId, matterId)))

  return NextResponse.json({ ok: true })
}
