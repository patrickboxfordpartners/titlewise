import { db } from "@/lib/db"
import { apiKeys, apiUsageLogs } from "@/lib/db/schema"
import { eq, and, gte, sql } from "drizzle-orm"

export type RateLimitResult =
  | { allowed: true; remaining: number; resetAt: number }
  | { allowed: false; limit: number; resetAt: number }

/**
 * Check if API key has exceeded rate limit for current month
 *
 * @param apiKeyId - UUID of API key
 * @returns RateLimitResult with allowed status and metadata
 */
export async function checkRateLimit(apiKeyId: string): Promise<RateLimitResult> {
  // 1. Get key's rate limit
  const [key] = await db
    .select({ rateLimitPerMonth: apiKeys.rateLimitPerMonth })
    .from(apiKeys)
    .where(eq(apiKeys.id, apiKeyId))

  if (!key) {
    return { allowed: false, limit: 0, resetAt: getNextMonthTimestamp() }
  }

  const limit = key.rateLimitPerMonth

  // 2. Calculate start of current month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // 3. Count API calls this month
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(apiUsageLogs)
    .where(
      and(
        eq(apiUsageLogs.apiKeyId, apiKeyId),
        gte(apiUsageLogs.createdAt, startOfMonth)
      )
    )

  const usage = count || 0

  // 4. Check if limit exceeded
  if (usage >= limit) {
    return {
      allowed: false,
      limit,
      resetAt: getNextMonthTimestamp()
    }
  }

  // 5. Return allowed with remaining count
  return {
    allowed: true,
    remaining: limit - usage,
    resetAt: getNextMonthTimestamp()
  }
}

/**
 * Log API usage for billing and analytics
 *
 * @param params - Usage log parameters
 */
export async function logApiUsage(params: {
  apiKeyId: string
  userId: string
  endpoint: string
  method: string
  statusCode: number
  durationMs: number
  tokensUsed?: number
  requestSizeBytes?: number
  responseSizeBytes?: number
  ipAddress?: string
  userAgent?: string
}) {
  await db.insert(apiUsageLogs).values({
    apiKeyId: params.apiKeyId,
    userId: params.userId,
    endpoint: params.endpoint,
    method: params.method,
    statusCode: params.statusCode,
    durationMs: params.durationMs,
    tokensUsed: params.tokensUsed || 0,
    requestSizeBytes: params.requestSizeBytes,
    responseSizeBytes: params.responseSizeBytes,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent
  })
}

/**
 * Get Unix timestamp of first day of next month (for rate limit reset)
 */
function getNextMonthTimestamp(): number {
  const next = new Date()
  next.setMonth(next.getMonth() + 1)
  next.setDate(1)
  next.setHours(0, 0, 0, 0)
  return Math.floor(next.getTime() / 1000)
}
