import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { db } from "@/lib/db"
import { matters, checklistItems } from "@/lib/db/schema"
import { eq, and, asc, desc } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"

// GET — get matter with all checklist items
export async function GET(_req: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId } = await params
  const user = await getOrCreateUser(userId)

  const [matter] = await db.select().from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.userId, user.id)))
    .limit(1)

  if (!matter) return NextResponse.json({ error: "Matter not found" }, { status: 404 })

  const items = await db.select().from(checklistItems)
    .where(eq(checklistItems.matterId, matterId))
    .orderBy(asc(checklistItems.sortOrder))

  return NextResponse.json({ matter, items })
}

const updateItemSchema = z.object({
  itemId: z.string().uuid(),
  status: z.enum(["pending", "in_progress", "complete"]).optional(),
  title: z.string().min(1).optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().nullable().optional(),
})

const addItemSchema = z.object({
  action: z.literal("add"),
  title: z.string().min(1),
  assignedTo: z.string().optional(),
})

const deleteItemSchema = z.object({
  action: z.literal("delete"),
  itemId: z.string().uuid(),
})

const closeMatterSchema = z.object({
  action: z.literal("close"),
})

// PATCH — update an item, add an item, delete an item, or close the matter
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId } = await params
  const user = await getOrCreateUser(userId)

  // Verify ownership
  const [matter] = await db.select().from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.userId, user.id)))
    .limit(1)
  if (!matter) return NextResponse.json({ error: "Matter not found" }, { status: 404 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  // Add item
  const addParsed = addItemSchema.safeParse(body)
  if (addParsed.success) {
    const maxOrder = await db.select({ sortOrder: checklistItems.sortOrder })
      .from(checklistItems).where(eq(checklistItems.matterId, matterId))
      .orderBy(desc(checklistItems.sortOrder)).limit(1)
    const nextOrder = (maxOrder[0]?.sortOrder ?? 0) + 100

    const [item] = await db.insert(checklistItems).values({
      matterId,
      title: addParsed.data.title,
      assignedTo: addParsed.data.assignedTo ?? null,
      sortOrder: nextOrder,
    }).returning()
    return NextResponse.json({ item })
  }

  // Delete item
  const deleteParsed = deleteItemSchema.safeParse(body)
  if (deleteParsed.success) {
    await db.delete(checklistItems).where(
      and(eq(checklistItems.id, deleteParsed.data.itemId), eq(checklistItems.matterId, matterId))
    )
    return NextResponse.json({ ok: true })
  }

  // Close matter
  const closeParsed = closeMatterSchema.safeParse(body)
  if (closeParsed.success) {
    await db.update(matters).set({ status: "closed", updatedAt: new Date() }).where(eq(matters.id, matterId))
    return NextResponse.json({ ok: true })
  }

  // Update item
  const updateParsed = updateItemSchema.safeParse(body)
  if (!updateParsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (updateParsed.data.status) updates.status = updateParsed.data.status
  if (updateParsed.data.title) updates.title = updateParsed.data.title
  if (updateParsed.data.assignedTo !== undefined) updates.assignedTo = updateParsed.data.assignedTo
  if (updateParsed.data.dueDate !== undefined) updates.dueDate = updateParsed.data.dueDate ? new Date(updateParsed.data.dueDate) : null

  await db.update(checklistItems).set(updates)
    .where(and(eq(checklistItems.id, updateParsed.data.itemId), eq(checklistItems.matterId, matterId)))

  // Update matter timestamp
  await db.update(matters).set({ updatedAt: new Date() }).where(eq(matters.id, matterId))

  return NextResponse.json({ ok: true })
}
