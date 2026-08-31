import { requireAuth } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { apiKeys, users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function DELETE(request: Request) {
  const userId = await requireAuth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  // Get user
  const [user] = await db.select().from(users).where(eq(users.id, userId))
  if (!user) return Response.json({ error: "User not found" }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const keyId = searchParams.get("id")

  if (!keyId) {
    return Response.json({ error: "Missing key ID" }, { status: 400 })
  }

  // Revoke key (set isActive = "false")
  await db
    .update(apiKeys)
    .set({ isActive: "false" })
    .where(
      and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.userId, user.id) // Security: only revoke own keys
      )
    )

  return Response.json({ success: true })
}
