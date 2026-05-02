import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { apiKeys, apiUsageLogs, users } from "@/lib/db/schema"
import { eq, and, gte, sql } from "drizzle-orm"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  // Get user
  const [user] = await db.select().from(users).where(eq(users.clerkId, userId))
  if (!user) return Response.json({ error: "User not found" }, { status: 404 })

  // Check if user has Enterprise plan
  if (user.subscriptionTier !== "enterprise") {
    return Response.json({
      error: "API access requires Enterprise plan",
      keys: []
    })
  }

  // Get all keys for this user
  const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, user.id))

  // Get usage counts for each key (this month)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const keysWithUsage = await Promise.all(
    keys.map(async (key) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(apiUsageLogs)
        .where(
          and(
            eq(apiUsageLogs.apiKeyId, key.id),
            gte(apiUsageLogs.createdAt, startOfMonth)
          )
        )

      return {
        ...key,
        usageThisMonth: count || 0
      }
    })
  )

  return Response.json({ keys: keysWithUsage })
}
