import { requireAuth } from "@/lib/auth-helpers"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"

export async function POST() {
  const userId = await requireAuth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await getOrCreateUser(userId)

  await db
    .update(users)
    .set({ onboardingCompletedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id))

  return NextResponse.json({ success: true })
}
