// DB-backed rate limiting using the users table.
// Works correctly across Vercel serverless instances (no shared in-process state).
// Falls back to permissive on DB errors to avoid blocking users.

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_REQUESTS = 30

export async function checkRateLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now()
  const windowStart = now - WINDOW_MS

  try {
    const rows = await db
      .select({
        id: users.id,
        rateLimitCount: users.rateLimitCount,
        rateLimitWindowStart: users.rateLimitWindowStart,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (rows.length === 0) return { allowed: true, remaining: MAX_REQUESTS }

    const row = rows[0]
    const dbWindowStart = row.rateLimitWindowStart?.getTime() ?? 0
    const inCurrentWindow = dbWindowStart > windowStart
    const currentCount = inCurrentWindow ? (row.rateLimitCount ?? 0) : 0

    if (currentCount >= MAX_REQUESTS) {
      return { allowed: false, remaining: 0 }
    }

    const newCount = currentCount + 1
    const newWindowStart = inCurrentWindow ? row.rateLimitWindowStart! : new Date(now)

    await db.update(users)
      .set({
        rateLimitCount: newCount,
        rateLimitWindowStart: newWindowStart,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    return { allowed: true, remaining: MAX_REQUESTS - newCount }
  } catch {
    // Fail open — don't block users if rate limit DB check fails
    return { allowed: true, remaining: MAX_REQUESTS }
  }
}
