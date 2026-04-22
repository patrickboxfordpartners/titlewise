import { currentUser } from "@clerk/nextjs/server"
import { eq, sql } from "drizzle-orm"
import { db } from "."
import { users, type User } from "./schema"
import { PLANS } from "@/lib/plans"

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
