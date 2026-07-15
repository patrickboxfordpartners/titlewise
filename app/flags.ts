import { flag } from "flags/next";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser, getTrialStatus } from "@/lib/db/get-user";
import { PLANS, type PlanKey } from "@/lib/plans";

async function getUserPlan(): Promise<PlanKey | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await getOrCreateUser(userId);
  const tier = user.subscriptionTier;
  if (tier && tier in PLANS) return tier as PlanKey;
  return null;
}

function planHasFeature(plan: PlanKey | null, feature: keyof typeof PLANS["solo"]): boolean {
  if (!plan) return false;
  return !!(PLANS[plan] as any)[feature];
}

export const hasAgentFlag = flag<boolean>({
  key: "has-agent",
  description: "Access to the AI Closing Agent (Pro+)",
  async decide() {
    const plan = await getUserPlan();
    return planHasFeature(plan, "hasAgent");
  },
});

export const hasClientPortalFlag = flag<boolean>({
  key: "has-client-portal",
  description: "Access to the Client Portal (Small Firm+)",
  async decide() {
    const plan = await getUserPlan();
    return planHasFeature(plan, "hasClientPortal");
  },
});

export const hasTridEngineFlag = flag<boolean>({
  key: "has-trid-engine",
  description: "Access to the TRID Compliance Engine (Pro+)",
  async decide() {
    const plan = await getUserPlan();
    return planHasFeature(plan, "hasTridEngine");
  },
});

export const hasWireFraudMemoryFlag = flag<boolean>({
  key: "has-wire-fraud-memory",
  description: "Access to Wire Fraud Memory (Small Firm+)",
  async decide() {
    const plan = await getUserPlan();
    return planHasFeature(plan, "hasWireFraudMemory");
  },
});

export const monthlyGenerationLimitFlag = flag<number>({
  key: "monthly-generation-limit",
  description: "Monthly AI generation limit based on plan",
  async decide() {
    const plan = await getUserPlan();
    if (!plan) return 10; // free tier gets 10 generations
    return PLANS[plan].monthlyGenerationLimit;
  },
});

export const isTrialFlag = flag<boolean>({
  key: "is-trial",
  description: "Whether the user is on a 7-day free trial",
  async decide() {
    const { userId } = await auth();
    if (!userId) return false;
    const user = await getOrCreateUser(userId);
    return user.subscriptionStatus === "trialing";
  },
});

export const trialDaysRemainingFlag = flag<number>({
  key: "trial-days-remaining",
  description: "Days remaining on the free trial (0 if not trialing)",
  async decide() {
    const { userId } = await auth();
    if (!userId) return 0;
    const user = await getOrCreateUser(userId);
    const { daysRemaining } = getTrialStatus(user);
    return daysRemaining;
  },
});
