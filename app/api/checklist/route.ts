import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { db } from "@/lib/db"
import { matters, checklistItems } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"
import { getTemplateItems } from "@/lib/checklist-templates"

const createSchema = z.object({
  clientName: z.string().min(1),
  propertyAddress: z.string().min(1),
  transactionType: z.enum(["Purchase", "Sale", "Refinance", "Cash Purchase"]),
  closingDate: z.string().optional(),
  state: z.string().max(2).optional(),
})

// GET — list all matters with item counts
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getOrCreateUser(userId)
  const allMatters = await db.select().from(matters)
    .where(eq(matters.userId, user.id))
    .orderBy(desc(matters.updatedAt))
    .limit(50)

  // Get item counts per matter
  const mattersWithCounts = await Promise.all(
    allMatters.map(async (m) => {
      const items = await db.select().from(checklistItems).where(eq(checklistItems.matterId, m.id))
      const total = items.length
      const complete = items.filter((i) => i.status === "complete").length
      return { ...m, totalItems: total, completedItems: complete }
    })
  )

  return NextResponse.json({ matters: mattersWithCounts })
}

// POST — create a new matter with auto-generated checklist
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })

  const user = await getOrCreateUser(userId)

  const [matter] = await db.insert(matters).values({
    userId: user.id,
    clientName: parsed.data.clientName,
    propertyAddress: parsed.data.propertyAddress,
    transactionType: parsed.data.transactionType,
    closingDate: parsed.data.closingDate ? new Date(parsed.data.closingDate) : null,
    state: parsed.data.state?.toUpperCase() ?? null,
  }).returning()

  // Auto-generate checklist items from template (including state-specific items)
  const templateItems = getTemplateItems(parsed.data.transactionType, parsed.data.state)
  if (templateItems.length > 0) {
    await db.insert(checklistItems).values(
      templateItems.map((t) => ({
        matterId: matter.id,
        title: t.title,
        assignedTo: t.assignedTo,
        sortOrder: t.sortOrder,
      }))
    )
  }

  return NextResponse.json({ matter })
}
