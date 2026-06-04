import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { db } from "@/lib/db"
import { matters, documentSlots } from "@/lib/db/schema"
import { eq, and, asc, desc } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"

const createSlotSchema = z.object({
  label: z.string().min(1),
  category: z.enum(["contract", "title", "lender", "hoa", "misc"]),
})

async function getOwnedMatter(matterId: string, userId: string) {
  const user = await getOrCreateUser(userId)
  const [matter] = await db.select().from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.userId, user.id)))
    .limit(1)
  return matter ?? null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId } = await params
  const matter = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const slots = await db.select().from(documentSlots)
    .where(eq(documentSlots.matterId, matterId))
    .orderBy(asc(documentSlots.sortOrder), asc(documentSlots.createdAt))

  return NextResponse.json({ slots })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId } = await params
  const matter = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = createSlotSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const existing = await db.select({ sortOrder: documentSlots.sortOrder })
    .from(documentSlots).where(eq(documentSlots.matterId, matterId))
    .orderBy(desc(documentSlots.sortOrder)).limit(1)
  const nextOrder = (existing[0]?.sortOrder ?? 0) + 100

  const [slot] = await db.insert(documentSlots).values({
    matterId,
    label: parsed.data.label,
    category: parsed.data.category,
    status: "pending",
    sortOrder: nextOrder,
  }).returning()

  return NextResponse.json({ slot }, { status: 201 })
}
