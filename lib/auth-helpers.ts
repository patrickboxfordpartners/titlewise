import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * Get the current user from NextAuth session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id)
  })

  return user || null
}

/**
 * Get current user ID or throw 401
 * Use in API routes that require authentication
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  return session.user.id
}
