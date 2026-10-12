import { requireAuth } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { apiKeys, apiUsageLogs, users } from "@/lib/db/schema"
import { eq, and, gte, inArray, sql } from "drizzle-orm"

export async function GET() {
  const userId = await requireAuth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const [user] = await db
    .select({ id: users.id, subscriptionTier: users.subscriptionTier })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user) return Response.json({ error: "User not found" }, { status: 404 })

  // Check if user has Enterprise plan
  if (user.subscriptionTier !== "enterprise") {
    return Response.json({
      error: "API access requires Enterprise plan",
      keys: []
    })
  }

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      rateLimitPerMonth: apiKeys.rateLimitPerMonth,
      isActive: apiKeys.isActive,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.id))

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const usageRows = keys.length === 0
    ? []
    : await db
        .select({
          apiKeyId: apiUsageLogs.apiKeyId,
          count: sql<number>`count(*)::int`,
        })
        .from(apiUsageLogs)
        .where(
          and(
            inArray(apiUsageLogs.apiKeyId, keys.map((key) => key.id)),
            gte(apiUsageLogs.createdAt, startOfMonth)
          )
        )
        .groupBy(apiUsageLogs.apiKeyId)

  const usageByKey = new Map(usageRows.map((row) => [row.apiKeyId, Number(row.count) || 0]))
  const keysWithUsage = keys.map((key) => ({
    ...key,
    usageThisMonth: usageByKey.get(key.id) ?? 0,
  }))

  return Response.json({ keys: keysWithUsage })
}
