import { currentUser } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { db } from "."
import { users, type User } from "./schema"

export async function getOrCreateUser(clerkId: string): Promise<User> {
  const existing = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
  if (existing.length > 0) {
    return existing[0]
  }

  const clerk = await currentUser()
  const email = clerk?.emailAddresses?.[0]?.emailAddress ?? ""
  const name = [clerk?.firstName, clerk?.lastName].filter(Boolean).join(" ") || null

  const inserted = await db.insert(users).values({
    clerkId,
    email,
    name,
  }).returning()

  return inserted[0]
}
