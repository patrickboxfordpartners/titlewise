import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, or } from "drizzle-orm"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
      .where(
        or(
          eq(users.subscriptionStatus, "active"),
          eq(users.subscriptionStatus, "trialing")
        )
      )
      .returning({ id: users.id })

    logger.info("cron/reset-usage", `Reset usage for ${result.length} users`)
    return NextResponse.json({ reset: result.length, timestamp: now.toISOString() })
  } catch (error) {
    logger.error("cron/reset-usage", "Failed to reset usage", { error: String(error) })
    return NextResponse.json({ error: "Reset failed" }, { status: 500 })
  }
}
