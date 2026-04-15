import { pgTable, text, timestamp, integer, uuid, jsonb } from "drizzle-orm/pg-core"

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
  subscriptionTier: text("subscription_tier"), // solo | small_firm | team
  seatCount: integer("seat_count").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const statusUpdates = pgTable("status_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  clientName: text("client_name").notNull(),
  propertyAddress: text("property_address").notNull(),
  transactionType: text("transaction_type").notNull(), // purchase | sale | refinance
  closingStage: text("closing_stage").notNull(),
  completedItems: text("completed_items"),
  outstandingItems: text("outstanding_items"),
  upcomingDeadlines: text("upcoming_deadlines"),
  additionalNotes: text("additional_notes"),
  tone: text("tone").default("professional"), // professional | semi-formal
  generatedEmail: text("generated_email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const titleAnalyses = pgTable("title_analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyAddress: text("property_address"),
  commitmentText: text("commitment_text").notNull(),
  analysis: jsonb("analysis").notNull(),
  redFlagCount: integer("red_flag_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type StatusUpdate = typeof statusUpdates.$inferSelect
export type NewStatusUpdate = typeof statusUpdates.$inferInsert
export type TitleAnalysis = typeof titleAnalyses.$inferSelect
export type NewTitleAnalysis = typeof titleAnalyses.$inferInsert
