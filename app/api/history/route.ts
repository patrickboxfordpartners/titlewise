import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, statusUpdates, titleAnalyses } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userRows = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1)
  if (userRows.length === 0) {
    return NextResponse.json({ updates: [], analyses: [] })
  }

  const user = userRows[0]

  const [updates, analyses] = await Promise.all([
    db
      .select({
        id: statusUpdates.id,
        clientName: statusUpdates.clientName,
        propertyAddress: statusUpdates.propertyAddress,
        transactionType: statusUpdates.transactionType,
        closingStage: statusUpdates.closingStage,
        generatedEmail: statusUpdates.generatedEmail,
        createdAt: statusUpdates.createdAt,
      })
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

  return NextResponse.json({ updates, analyses })
}
