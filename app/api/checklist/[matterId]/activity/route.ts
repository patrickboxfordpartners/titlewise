import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, matters, statusUpdates, titleAnalyses, cdReviews, hoaReviews, feeEstimates, wireInstructions } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId } = await params
  const user = await getOrCreateUser(userId)

  // Verify matter belongs to user
  const [matter] = await db.select().from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.userId, user.id)))
    .limit(1)

  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [updates, analyses, cdList, hoaList, feeList, wireList] = await Promise.all([
    db.select({ id: statusUpdates.id, clientName: statusUpdates.clientName, closingStage: statusUpdates.closingStage, createdAt: statusUpdates.createdAt })
      .from(statusUpdates).where(eq(statusUpdates.matterId, matterId)).orderBy(desc(statusUpdates.createdAt)).limit(20),
    db.select({ id: titleAnalyses.id, propertyAddress: titleAnalyses.propertyAddress, redFlagCount: titleAnalyses.redFlagCount, createdAt: titleAnalyses.createdAt })
      .from(titleAnalyses).where(eq(titleAnalyses.matterId, matterId)).orderBy(desc(titleAnalyses.createdAt)).limit(20),
    db.select({ id: cdReviews.id, propertyAddress: cdReviews.propertyAddress, discrepancyCount: cdReviews.discrepancyCount, createdAt: cdReviews.createdAt })
      .from(cdReviews).where(eq(cdReviews.matterId, matterId)).orderBy(desc(cdReviews.createdAt)).limit(20),
    db.select({ id: hoaReviews.id, associationName: hoaReviews.associationName, redFlagCount: hoaReviews.redFlagCount, createdAt: hoaReviews.createdAt })
      .from(hoaReviews).where(eq(hoaReviews.matterId, matterId)).orderBy(desc(hoaReviews.createdAt)).limit(20),
    db.select({ id: feeEstimates.id, clientName: feeEstimates.clientName, transactionType: feeEstimates.transactionType, createdAt: feeEstimates.createdAt })
      .from(feeEstimates).where(eq(feeEstimates.matterId, matterId)).orderBy(desc(feeEstimates.createdAt)).limit(20),
    db.select({ id: wireInstructions.id, bankName: wireInstructions.bankName, beneficiary: wireInstructions.beneficiary, createdAt: wireInstructions.createdAt })
      .from(wireInstructions).where(eq(wireInstructions.matterId, matterId)).orderBy(desc(wireInstructions.createdAt)).limit(20),
  ])

  return NextResponse.json({ updates, analyses, cdReviews: cdList, hoaReviews: hoaList, feeEstimates: feeList, wireInstructions: wireList })
}
