import posthog from "posthog-js"

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  try {
    posthog.capture(event, properties)
  } catch {
    // Never throw on analytics failure
  }
}

// Predefined event names for consistency
export const EVENTS = {
  TOOL_USED: "tool_used",
  PDF_EXPORTED: "pdf_exported",
  EMAIL_SENT: "email_sent",
  MATTER_CREATED: "matter_created",
  MATTER_PORTAL_SHARED: "matter_portal_shared",
  SUBSCRIPTION_UPGRADE_PROMPTED: "subscription_upgrade_prompted",
  WIRE_VERIFIED: "wire_verified",
  TITLE_ANALYZED: "title_analyzed",
  STATUS_UPDATE_GENERATED: "status_update_generated",
  CD_REVIEWED: "cd_reviewed",
  HOA_REVIEWED: "hoa_reviewed",
  FEE_ESTIMATE_GENERATED: "fee_estimate_generated",
  TEAM_MEMBER_INVITED: "team_member_invited",
} as const
