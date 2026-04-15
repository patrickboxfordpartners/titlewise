import { currentUser } from "@clerk/nextjs/server"
import { eq, sql } from "drizzle-orm"
import { db } from "."
import { users, type User } from "./schema"

const TRIAL_DAYS = 14
const FREE_MONTHLY_LIMIT = 5

export async function getOrCreateUser(clerkId: string): Promise<User> {
  const existing = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
  if (existing.length > 0) {
    return existing[0]
  }

  const clerk = await currentUser()
  const email = clerk?.emailAddresses?.[0]?.emailAddress ?? ""
  const name = [clerk?.firstName, clerk?.lastName].filter(Boolean).join(" ") || null

  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)

  const now = new Date()
  const usageResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1) // first of next month

  const inserted = await db.insert(users).values({
    clerkId,
    email,
    name,
    trialEndsAt,
    monthlyUsageCount: 0,
    usageResetAt,
  }).returning()

  return inserted[0]
}

type AccessResult =
  | { allowed: true; reason: "subscription" | "trial" | "free_tier"; remaining?: number }
  | { allowed: false; reason: "trial_expired" | "free_limit_reached"; message: string }

export async function checkSubscriptionAccess(user: User): Promise<AccessResult> {
  // Active subscription — always allowed
  if (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing") {
    return { allowed: true, reason: "subscription" }
  }

  // Trial period
  if (user.trialEndsAt && new Date() < new Date(user.trialEndsAt)) {
    return { allowed: true, reason: "trial" }
  }

  // Free tier — check monthly usage
  const now = new Date()
  let usageCount = user.monthlyUsageCount ?? 0
  const resetAt = user.usageResetAt ? new Date(user.usageResetAt) : null

  // Reset counter if past reset date
  if (!resetAt || now >= resetAt) {
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    await db.update(users)
      .set({ monthlyUsageCount: 0, usageResetAt: nextReset, updatedAt: now })
      .where(eq(users.id, user.id))
    usageCount = 0
  }

  if (usageCount < FREE_MONTHLY_LIMIT) {
    return { allowed: true, reason: "free_tier", remaining: FREE_MONTHLY_LIMIT - usageCount }
  }

  return {
    allowed: false,
    reason: "free_limit_reached",
    message: `You've used all ${FREE_MONTHLY_LIMIT} free generations this month. Subscribe to continue.`,
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
