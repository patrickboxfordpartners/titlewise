import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, statusUpdates, titleAnalyses, cdReviews, hoaReviews, feeEstimates } from "@/lib/db/schema"
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
  const cdFilters = [eq(cdReviews.userId, user.id)]
  const hoaFilters = [eq(hoaReviews.userId, user.id)]
  const feeFilters = [eq(feeEstimates.userId, user.id)]

  if (q) {
    updatesFilters.push(or(ilike(statusUpdates.clientName, `%${q}%`), ilike(statusUpdates.propertyAddress, `%${q}%`))!)
    analysesFilters.push(ilike(titleAnalyses.propertyAddress, `%${q}%`))
    cdFilters.push(or(ilike(cdReviews.propertyAddress, `%${q}%`), ilike(cdReviews.buyer, `%${q}%`))!)
    feeFilters.push(or(ilike(feeEstimates.clientName, `%${q}%`), ilike(feeEstimates.jurisdiction, `%${q}%`))!)
  }

  if (from) {
    const fromDate = new Date(from)
    updatesFilters.push(sql`${statusUpdates.createdAt} >= ${fromDate}`)
    analysesFilters.push(sql`${titleAnalyses.createdAt} >= ${fromDate}`)
    cdFilters.push(sql`${cdReviews.createdAt} >= ${fromDate}`)
    hoaFilters.push(sql`${hoaReviews.createdAt} >= ${fromDate}`)
    feeFilters.push(sql`${feeEstimates.createdAt} >= ${fromDate}`)
  }

  if (to) {
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999)
    updatesFilters.push(sql`${statusUpdates.createdAt} <= ${toDate}`)
    analysesFilters.push(sql`${titleAnalyses.createdAt} <= ${toDate}`)
    cdFilters.push(sql`${cdReviews.createdAt} <= ${toDate}`)
    hoaFilters.push(sql`${hoaReviews.createdAt} <= ${toDate}`)
    feeFilters.push(sql`${feeEstimates.createdAt} <= ${toDate}`)
  }

  const [allUpdates, allAnalyses, allCdReviews, allHoaReviews, allFeeEstimates] = await Promise.all([
    db.select({ id: statusUpdates.id, clientName: statusUpdates.clientName, propertyAddress: statusUpdates.propertyAddress, transactionType: statusUpdates.transactionType, closingStage: statusUpdates.closingStage, completedItems: statusUpdates.completedItems, outstandingItems: statusUpdates.outstandingItems, upcomingDeadlines: statusUpdates.upcomingDeadlines, additionalNotes: statusUpdates.additionalNotes, tone: statusUpdates.tone, generatedEmail: statusUpdates.generatedEmail, matterId: statusUpdates.matterId, createdAt: statusUpdates.createdAt })
      .from(statusUpdates).where(and(...updatesFilters)).orderBy(desc(statusUpdates.createdAt)).limit(limit),
    db.select({ id: titleAnalyses.id, propertyAddress: titleAnalyses.propertyAddress, redFlagCount: titleAnalyses.redFlagCount, analysis: titleAnalyses.analysis, matterId: titleAnalyses.matterId, createdAt: titleAnalyses.createdAt })
      .from(titleAnalyses).where(and(...analysesFilters)).orderBy(desc(titleAnalyses.createdAt)).limit(limit),
    db.select({ id: cdReviews.id, propertyAddress: cdReviews.propertyAddress, buyer: cdReviews.buyer, seller: cdReviews.seller, discrepancyCount: cdReviews.discrepancyCount, result: cdReviews.result, matterId: cdReviews.matterId, createdAt: cdReviews.createdAt })
      .from(cdReviews).where(and(...cdFilters)).orderBy(desc(cdReviews.createdAt)).limit(limit),
    db.select({ id: hoaReviews.id, associationName: hoaReviews.associationName, redFlagCount: hoaReviews.redFlagCount, result: hoaReviews.result, matterId: hoaReviews.matterId, createdAt: hoaReviews.createdAt })
      .from(hoaReviews).where(and(...hoaFilters)).orderBy(desc(hoaReviews.createdAt)).limit(limit),
    db.select({ id: feeEstimates.id, clientName: feeEstimates.clientName, transactionType: feeEstimates.transactionType, jurisdiction: feeEstimates.jurisdiction, generatedLetter: feeEstimates.generatedLetter, matterId: feeEstimates.matterId, createdAt: feeEstimates.createdAt })
      .from(feeEstimates).where(and(...feeFilters)).orderBy(desc(feeEstimates.createdAt)).limit(limit),
  ])

  return NextResponse.json({ updates: allUpdates, analyses: allAnalyses, cdReviews: allCdReviews, hoaReviews: allHoaReviews, feeEstimates: allFeeEstimates })
}
