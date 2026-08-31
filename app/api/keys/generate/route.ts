import { requireAuth } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { apiKeys, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { customAlphabet } from "nanoid"
import bcrypt from "bcryptjs"

// Generate URL-safe random strings
const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 32)

export async function POST(request: Request) {
  const userId = await requireAuth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  // Get user
  const [user] = await db.select().from(users).where(eq(users.id, userId))
  if (!user) return Response.json({ error: "User not found" }, { status: 404 })

  // Check if user has Enterprise plan
  if (user.subscriptionTier !== "enterprise") {
    return Response.json({
      error: "API access requires Enterprise plan. Upgrade at Settings → Subscription."
    }, { status: 403 })
  }

  const body = await request.json()
  const name = body.name || "Production"

  // Generate key: tw_live_<32 random chars>
  const keySecret = nanoid()
  const fullKey = `tw_live_${keySecret}`
  const keyPrefix = fullKey.substring(0, 16) // tw_live_abc123...
  const keyHash = await bcrypt.hash(fullKey, 10)

  // Store in database
  const [apiKey] = await db
    .insert(apiKeys)
    .values({
      userId: user.id,
      name,
      keyPrefix,
      keyHash,
      rateLimitPerMonth: 1000,
      createdBy: user.id
    })
    .returning()

  // Return full key ONCE (never stored in plaintext, never shown again)
  return Response.json({
    id: apiKey.id,
    key: fullKey,
    prefix: keyPrefix,
    rateLimit: 1000
  })
}
