import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logger } from "@/lib/logger"
import { secretsMatch } from "@/lib/secret-compare"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get("authorization")
  if (!secretsMatch(authHeader, cronSecret ? `Bearer ${cronSecret}` : undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()
    const result = await db
      .update(users)
      .set({
        monthlyUsageCount: 0,
        usageResetAt: now,
        updatedAt: now,
      })
      .where(eq(users.subscriptionStatus, "active"))
      .returning({ id: users.id })

    logger.info("cron/reset-usage", `Reset usage for ${result.length} users`)
    return NextResponse.json({ reset: result.length, timestamp: now.toISOString() })
  } catch (error) {
    logger.error("cron/reset-usage", "Failed to reset usage", { error: String(error) })
    return NextResponse.json({ error: "Reset failed" }, { status: 500 })
  }
}
