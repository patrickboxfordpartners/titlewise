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
  const isTrialing =
    user.subscriptionStatus === "trialing" &&
    (!user.trialEndsAt || new Date(user.trialEndsAt) > new Date())

  if (!isActive && !isTrialing) {
    const message =
      user.subscriptionStatus === "trialing"
        ? "Your free trial has ended. Subscribe to continue using TITLEwise."
        : "Subscribe to continue using TITLEwise."
    return { allowed: false, reason: "no_subscription", message }
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

export function getTrialStatus(user: User): { isTrial: boolean; daysRemaining: number } {
  const isTrialing = user.subscriptionStatus === "trialing"
  if (!isTrialing || !user.trialEndsAt) return { isTrial: false, daysRemaining: 0 }
  const msLeft = new Date(user.trialEndsAt).getTime() - Date.now()
  if (msLeft <= 0) return { isTrial: false, daysRemaining: 0 }
  const daysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
  return { isTrial: true, daysRemaining }
}
