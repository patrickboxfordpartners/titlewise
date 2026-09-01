import { eq, sql } from "drizzle-orm"
import { db } from "."
import { users, type User } from "./schema"
import { PLANS } from "@/lib/plans"

/**
 * Get user by ID
 * @throws Error if user not found
 */
export async function getOrCreateUser(userId: string): Promise<User> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  })

  if (!user) {
    throw new Error("User not found")
  }

  return user
}

type AccessResult =
  | { allowed: true; reason: "subscription"; remaining?: number }
  | { allowed: false; reason: "no_subscription" | "usage_limit"; message: string }

export async function checkSubscriptionAccess(user: User): Promise<AccessResult> {
  const isActive = user.subscriptionStatus === "active"

  if (!isActive) {
    return { allowed: false, reason: "no_subscription", message: "Subscribe to continue using TITLEwise." }
  }

  // Check per-tier generation limit
  if (isActive && user.subscriptionTier) {
    const plan = PLANS[user.subscriptionTier as keyof typeof PLANS]
    if (plan) {
      const used = user.monthlyUsageCount ?? 0
      const limit = plan.monthlyGenerationLimit
      if (used >= limit) {
        return {
          allowed: false,
          reason: "usage_limit",
          message: `You've used all ${limit} generations for this month on the ${plan.name} plan. Upgrade your plan or wait until your usage resets.`,
        }
      }
      return { allowed: true, reason: "subscription", remaining: limit - used }
    }
  }

  return { allowed: true, reason: "subscription" }
}

export async function incrementUsage(userId: string): Promise<void> {
  await db.update(users)
    .set({
      monthlyUsageCount: sql`${users.monthlyUsageCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
}

