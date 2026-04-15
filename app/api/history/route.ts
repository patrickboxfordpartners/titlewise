import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, statusUpdates, titleAnalyses } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? ""

  const userRows = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1)
  if (userRows.length === 0) {
    return NextResponse.json({ updates: [], analyses: [] })
  }

  const user = userRows[0]

  const [allUpdates, allAnalyses] = await Promise.all([
    db
      .select()
      .from(statusUpdates)
      .where(eq(statusUpdates.userId, user.id))
      .orderBy(desc(statusUpdates.createdAt))
      .limit(50),
    db
      .select({
        id: titleAnalyses.id,
        propertyAddress: titleAnalyses.propertyAddress,
        redFlagCount: titleAnalyses.redFlagCount,
        analysis: titleAnalyses.analysis,
        createdAt: titleAnalyses.createdAt,
      })
      .from(titleAnalyses)
      .where(eq(titleAnalyses.userId, user.id))
      .orderBy(desc(titleAnalyses.createdAt))
      .limit(50),
  ])

  // Application-layer search filter
  const updates = q
    ? allUpdates.filter(
        (u) =>
          u.clientName.toLowerCase().includes(q) ||
          u.propertyAddress.toLowerCase().includes(q)
      )
    : allUpdates

  const analyses = q
    ? allAnalyses.filter((a) => a.propertyAddress?.toLowerCase().includes(q))
    : allAnalyses

  return NextResponse.json({ updates, analyses })
}
