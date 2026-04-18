import { NextRequest, NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { sendDripEmail } from "@/lib/email/drip"
import { and, gte, lte, isNull, or, eq } from "drizzle-orm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  const day3Start = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)
  const day3End = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  const day7Start = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)
  const day7End = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const candidates = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.subscriptionStatus, "active"),
        or(
          and(
            gte(users.createdAt, day3Start),
            lte(users.createdAt, day3End),
            isNull(users.dripDay3SentAt),
          ),
          and(
            gte(users.createdAt, day7Start),
            lte(users.createdAt, day7End),
            isNull(users.dripDay7SentAt),
          ),
        ),
      ),
    )

  const results = { day3: 0, day7: 0, errors: 0 }

  const clerk = await clerkClient()

  for (const user of candidates) {
    try {
      const clerkUser = await clerk.users.getUser(user.clerkId)
      const email = clerkUser.emailAddresses[0]?.emailAddress
      if (!email) continue

      const name =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || user.name || "there"
      const plan = user.subscriptionTier ?? "solo"

      const isDay3 =
        user.createdAt >= day3Start &&
        user.createdAt <= day3End &&
        user.dripDay3SentAt === null

      const isDay7 =
        user.createdAt >= day7Start &&
        user.createdAt <= day7End &&
        user.dripDay7SentAt === null

      if (isDay3) {
        await sendDripEmail({ to: email, name, plan, sequence: "day3" })
        await db
          .update(users)
          .set({ dripDay3SentAt: now })
          .where(eq(users.id, user.id))
        results.day3++
        console.log(`[cron/drip] day3 sent to ${email}`)
      }

      if (isDay7) {
        await sendDripEmail({ to: email, name, plan, sequence: "day7" })
        await db
          .update(users)
          .set({ dripDay7SentAt: now })
          .where(eq(users.id, user.id))
        results.day7++
        console.log(`[cron/drip] day7 sent to ${email}`)
      }
    } catch (err) {
      results.errors++
      console.error(`[cron/drip] Error processing user ${user.id}:`, err)
    }
  }

  console.log("[cron/drip] Done:", results)
  return NextResponse.json({ ok: true, ...results })
}
