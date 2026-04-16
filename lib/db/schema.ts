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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const statusUpdates = pgTable("status_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  status: text("status").default("active"), // active | closed
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

export const processedEvents = pgTable("processed_events", {
  id: text("id").primaryKey(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
})

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
