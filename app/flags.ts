import { flag } from "flags/next";
import { PLANS, type PlanKey } from "@/lib/plans";

async function getUserPlan(): Promise<PlanKey | null> {
  // This will be called server-side. In a real implementation,
  // read from the auth session / DB. For now, return null (free tier).
  // TODO: Wire to Clerk session + Stripe subscription lookup
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
