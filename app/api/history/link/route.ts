import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { db } from "@/lib/db"
import { statusUpdates, titleAnalyses, users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"

const linkSchema = z.object({
  recordType: z.enum(["status_update", "title_analysis"]),
  recordId: z.string().uuid(),
  matterId: z.string().uuid().nullable(),
})

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getOrCreateUser(userId)
  const body = await req.json()
  const parsed = linkSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const { recordType, recordId, matterId } = parsed.data

  if (recordType === "status_update") {
    await db.update(statusUpdates)
      .set({ matterId })
      .where(and(eq(statusUpdates.id, recordId), eq(statusUpdates.userId, user.id)))
  } else {
    await db.update(titleAnalyses)
      .set({ matterId })
      .where(and(eq(titleAnalyses.id, recordId), eq(titleAnalyses.userId, user.id)))
  }

  return NextResponse.json({ success: true })
}
