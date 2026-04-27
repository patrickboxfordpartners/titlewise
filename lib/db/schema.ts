import { pgTable, text, timestamp, integer, uuid, jsonb, index } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  firmName: text("firm_name"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripePriceId: text("stripe_price_id"),
  subscriptionStatus: text("subscription_status").default("inactive"),
  subscriptionTier: text("subscription_tier"),
  seatCount: integer("seat_count").default(1),
  trialEndsAt: timestamp("trial_ends_at"),
  monthlyUsageCount: integer("monthly_usage_count").default(0),
  usageResetAt: timestamp("usage_reset_at"),
  googleRefreshToken: text("google_refresh_token"),
  outlookRefreshToken: text("outlook_refresh_token"),
  dripDay3SentAt: timestamp("drip_day3_sent_at"),
  dripDay7SentAt: timestamp("drip_day7_sent_at"),
  rateLimitCount: integer("rate_limit_count").default(0),
  rateLimitWindowStart: timestamp("rate_limit_window_start"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const statusUpdates = pgTable("status_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matterId: uuid("matter_id").references((): any => matters.id, { onDelete: "set null" }),
  clientName: text("client_name").notNull(),
  propertyAddress: text("property_address").notNull(),
  transactionType: text("transaction_type").notNull(),
  closingStage: text("closing_stage").notNull(),
  completedItems: text("completed_items"),
  outstandingItems: text("outstanding_items"),
  upcomingDeadlines: text("upcoming_deadlines"),
  additionalNotes: text("additional_notes"),
  tone: text("tone").default("professional"),
  generatedEmail: text("generated_email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_status_updates_user_id").on(table.userId),
  index("idx_status_updates_created").on(table.createdAt),
])

export const titleAnalyses = pgTable("title_analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matterId: uuid("matter_id").references((): any => matters.id, { onDelete: "set null" }),
  propertyAddress: text("property_address"),
  commitmentText: text("commitment_text").notNull(),
  analysis: jsonb("analysis").notNull(),
  redFlagCount: integer("red_flag_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_title_analyses_user_id").on(table.userId),
  index("idx_title_analyses_created").on(table.createdAt),
])

export const matters = pgTable("matters", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  clientName: text("client_name").notNull(),
  propertyAddress: text("property_address").notNull(),
  transactionType: text("transaction_type").notNull(),
  closingDate: timestamp("closing_date"),
  state: text("state"), // US state abbreviation e.g. "NH", "MA"
  status: text("status").default("active"), // active | closed
  portalToken: text("portal_token").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_matters_user_id").on(table.userId),
])

export const checklistItems = pgTable("checklist_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  matterId: uuid("matter_id").notNull().references(() => matters.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  assignedTo: text("assigned_to"), // buyer | seller | lender | title_company | attorney | agent
  status: text("status").default("pending"), // pending | in_progress | complete
  dueDate: timestamp("due_date"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_checklist_items_matter_id").on(table.matterId),
])

export const wireInstructions = pgTable("wire_instructions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lenderName: text("lender_name"),
  bankName: text("bank_name"),
  routingNumber: text("routing_number"),
  accountNumber: text("account_number"), // stored masked
  beneficiary: text("beneficiary"),
  verifiedAt: timestamp("verified_at").defaultNow().notNull(),
  matterId: uuid("matter_id").references((): any => matters.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_wire_instructions_user").on(table.userId),
  index("idx_wire_instructions_routing").on(table.routingNumber),
])

export type WireInstruction = typeof wireInstructions.$inferSelect

export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  invitedEmail: text("invited_email").notNull(),
  inviteToken: text("invite_token").notNull().unique(),
  status: text("status").default("pending"), // pending | accepted | revoked
  role: text("role").default("member"), // member | admin
  joinedUserId: uuid("joined_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
}, (table) => [
  index("idx_team_members_owner").on(table.ownerId),
  index("idx_team_members_token").on(table.inviteToken),
])

export type TeamMember = typeof teamMembers.$inferSelect

export const processedEvents = pgTable("processed_events", {
  id: text("id").primaryKey(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
})

export const contactSubmissions = pgTable("contact_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  firmName: text("firm_name"),
  message: text("message").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_contact_submissions_created").on(table.createdAt),
  index("idx_contact_submissions_email").on(table.email),
])

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type StatusUpdate = typeof statusUpdates.$inferSelect
export type NewStatusUpdate = typeof statusUpdates.$inferInsert
export type TitleAnalysis = typeof titleAnalyses.$inferSelect
export type NewTitleAnalysis = typeof titleAnalyses.$inferInsert
export type Matter = typeof matters.$inferSelect
export type NewMatter = typeof matters.$inferInsert
export type ChecklistItem = typeof checklistItems.$inferSelect
export type NewChecklistItem = typeof checklistItems.$inferInsert
export type ContactSubmission = typeof contactSubmissions.$inferSelect
export type NewContactSubmission = typeof contactSubmissions.$inferInsert
