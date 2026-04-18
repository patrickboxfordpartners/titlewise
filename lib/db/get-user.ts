import { currentUser } from "@clerk/nextjs/server"
import { eq, sql } from "drizzle-orm"
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
    monthlyUsageCount: 0,
  }).returning()

  return inserted[0]
}

type AccessResult =
  | { allowed: true; reason: "subscription" }
  | { allowed: false; reason: "no_subscription"; message: string }

export async function checkSubscriptionAccess(user: User): Promise<AccessResult> {
  if (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing") {
    return { allowed: true, reason: "subscription" }
  }
  return {
    allowed: false,
    reason: "no_subscription",
    message: "Subscribe to continue using TITLEwise.",
  }
}

export async function incrementUsage(userId: string): Promise<void> {
  await db.update(users)
    .set({
      monthlyUsageCount: sql`${users.monthlyUsageCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
}
