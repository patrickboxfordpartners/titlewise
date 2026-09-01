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
 * Get current user ID or return null
 * Use in API routes that require authentication
 */
export async function requireAuth(): Promise<string | null> {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }
  return session.user.id
}
