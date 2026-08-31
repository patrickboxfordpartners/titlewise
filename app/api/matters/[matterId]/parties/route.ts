import { requireAuth } from "@/lib/auth-helpers"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { db } from "@/lib/db"
import { matters, matterParties } from "@/lib/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"

const createPartySchema = z.object({
  role: z.enum(["buyer", "seller", "buyers_agent", "listing_agent", "lender", "other"]),
  name: z.string().min(1),
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId } = await params
  const matter = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const parties = await db.select().from(matterParties)
    .where(eq(matterParties.matterId, matterId))
    .orderBy(asc(matterParties.createdAt))

  return NextResponse.json({ parties })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId } = await params
  const matter = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = createPartySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const [party] = await db.insert(matterParties).values({
    matterId,
    role: parsed.data.role,
    name: parsed.data.name,
    email: parsed.data.email ?? null,
    phone: parsed.data.phone ?? null,
    company: parsed.data.company ?? null,
  }).returning()

  return NextResponse.json({ party }, { status: 201 })
}
