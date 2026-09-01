import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { users, webhooks } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { nanoid } from "nanoid"

export const dynamic = "force-dynamic"

// GET /api/webhooks - List user's webhooks
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

  const userWebhooks = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.userId, user.id))
    .orderBy(webhooks.createdAt)

  return NextResponse.json({ webhooks: userWebhooks })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// POST /api/webhooks - Create webhook
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

  // Verify Enterprise tier
  if (user.subscriptionTier !== "enterprise") {
    return NextResponse.json(
      { error: "Enterprise plan required for webhooks" },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { url, events } = body

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Invalid webhook URL" }, { status: 400 })
  }

  if (!events || !Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: "At least one event must be selected" }, { status: 400 })
  }

  // Validate URL format
  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
  }

  // Validate events
  const validEvents = ["analysis.completed", "analysis.failed"]
  for (const event of events) {
    if (!validEvents.includes(event)) {
      return NextResponse.json({ error: `Invalid event: ${event}` }, { status: 400 })
    }
  }

  // Generate signing secret (whsec_ prefix, 32 chars)
  const secret = `whsec_${nanoid(32)}`

  // Insert webhook
  const [newWebhook] = await db
    .insert(webhooks)
    .values({
      userId: user.id,
      url,
      events,
      secret,
      isActive: "true",
      failureCount: 0,
      createdBy: user.id,
    })
    .returning()

  return NextResponse.json({
    id: newWebhook.id,
    url: newWebhook.url,
    events: newWebhook.events,
    secret, // Return ONCE for user to save
  })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// PATCH /api/webhooks - Toggle webhook active state
export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireAuth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

  const body = await request.json()
  const { id, isActive } = body

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Webhook ID required" }, { status: 400 })
  }

  if (isActive !== "true" && isActive !== "false") {
    return NextResponse.json({ error: "Invalid isActive value" }, { status: 400 })
  }

  // Update webhook (verify ownership)
  await db
    .update(webhooks)
    .set({ isActive })
    .where(and(eq(webhooks.id, id), eq(webhooks.userId, user.id)))

  return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// DELETE /api/webhooks - Delete webhook
export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireAuth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Webhook ID required" }, { status: 400 })
  }

  // Delete webhook (verify ownership)
  await db
    .delete(webhooks)
    .where(and(eq(webhooks.id, id), eq(webhooks.userId, user.id)))

  return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
