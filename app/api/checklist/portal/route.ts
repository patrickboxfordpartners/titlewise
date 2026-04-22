import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { matters, checklistItems } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"
import { randomBytes } from "crypto"

// GET /api/checklist/portal?token=xxx — public, no auth required
// POST /api/checklist/portal?matterId=xxx — generate portal token (auth required)

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const matterId = new URL(req.url).searchParams.get("matterId")
  if (!matterId) return NextResponse.json({ error: "matterId required" }, { status: 400 })

  const user = await getOrCreateUser(userId)

  const matter = await db.select().from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.userId, user.id)))
    .limit(1)

  if (matter.length === 0) return NextResponse.json({ error: "Matter not found" }, { status: 404 })

  // Generate or return existing token
  let token = matter[0].portalToken
  if (!token) {
    token = randomBytes(24).toString("base64url")
    await db.update(matters).set({ portalToken: token }).where(eq(matters.id, matterId))
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://titlewise.app"
  return NextResponse.json({ token, url: `${appUrl}/matter-portal/${token}` })
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token")
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })

  const matterRows = await db.select().from(matters).where(eq(matters.portalToken, token)).limit(1)
  if (matterRows.length === 0) return NextResponse.json({ error: "Invalid token" }, { status: 404 })

  const matter = matterRows[0]
  const items = await db.select().from(checklistItems)
    .where(eq(checklistItems.matterId, matter.id))
    .orderBy(checklistItems.sortOrder)

  const total = items.length
  const complete = items.filter(i => i.status === "complete").length

  return NextResponse.json({
    matter: {
      clientName: matter.clientName,
      propertyAddress: matter.propertyAddress,
      transactionType: matter.transactionType,
      closingDate: matter.closingDate,
      state: matter.state,
      status: matter.status,
    },
    checklist: items.map(i => ({
      id: i.id,
      title: i.title,
      assignedTo: i.assignedTo,
      status: i.status,
      dueDate: i.dueDate,
    })),
    progress: { total, complete, percent: total > 0 ? Math.round((complete / total) * 100) : 0 },
  })
}
