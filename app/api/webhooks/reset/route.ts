import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { users, webhooks } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export const dynamic = "force-dynamic"

// POST /api/webhooks/reset - Reset failure count and re-enable webhook
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

  const body = await request.json()
  const { id } = body

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Webhook ID required" }, { status: 400 })
  }

  // Reset failure count and re-enable (verify ownership)
  await db
    .update(webhooks)
    .set({
      failureCount: 0,
      isActive: "true",
    })
    .where(and(eq(webhooks.id, id), eq(webhooks.userId, user.id)))

  return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
