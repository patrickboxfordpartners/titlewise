import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const provider = searchParams.get("provider")

  if (provider !== "google" && provider !== "outlook") {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
  }

  const user = await getOrCreateUser(userId)

  await db.update(users)
    .set({
      ...(provider === "google" ? { googleRefreshToken: null } : { outlookRefreshToken: null }),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  return NextResponse.json({ ok: true })
}
