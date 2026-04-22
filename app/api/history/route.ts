import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, statusUpdates, titleAnalyses } from "@/lib/db/schema"
import { eq, desc, and, ilike, or, sql } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""
  const from = req.nextUrl.searchParams.get("from") ?? ""
  const to = req.nextUrl.searchParams.get("to") ?? ""
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10), 200)

  const userRows = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1)
  if (userRows.length === 0) {
    return NextResponse.json({ updates: [], analyses: [] })
  }

  const user = userRows[0]

  const updatesFilters = [eq(statusUpdates.userId, user.id)]
  const analysesFilters = [eq(titleAnalyses.userId, user.id)]

  if (q) {
    updatesFilters.push(
      or(
        ilike(statusUpdates.clientName, `%${q}%`),
        ilike(statusUpdates.propertyAddress, `%${q}%`),
      )!
    )
    analysesFilters.push(ilike(titleAnalyses.propertyAddress, `%${q}%`))
  }

  if (from) {
    const fromDate = new Date(from)
    updatesFilters.push(sql`${statusUpdates.createdAt} >= ${fromDate}`)
    analysesFilters.push(sql`${titleAnalyses.createdAt} >= ${fromDate}`)
  }

  if (to) {
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999)
    updatesFilters.push(sql`${statusUpdates.createdAt} <= ${toDate}`)
    analysesFilters.push(sql`${titleAnalyses.createdAt} <= ${toDate}`)
  }

  const [allUpdates, allAnalyses] = await Promise.all([
    db
      .select()
      .from(statusUpdates)
      .where(and(...updatesFilters))
      .orderBy(desc(statusUpdates.createdAt))
      .limit(limit),
    db
      .select({
        id: titleAnalyses.id,
        propertyAddress: titleAnalyses.propertyAddress,
        redFlagCount: titleAnalyses.redFlagCount,
        analysis: titleAnalyses.analysis,
        matterId: titleAnalyses.matterId,
        createdAt: titleAnalyses.createdAt,
      })
      .from(titleAnalyses)
      .where(and(...analysesFilters))
      .orderBy(desc(titleAnalyses.createdAt))
      .limit(limit),
  ])

  return NextResponse.json({ updates: allUpdates, analyses: allAnalyses })
}
