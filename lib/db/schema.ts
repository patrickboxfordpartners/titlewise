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
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  customLogoUrl: text("custom_logo_url"),
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

export const cdReviews = pgTable("cd_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matterId: uuid("matter_id").references((): any => matters.id, { onDelete: "set null" }),
  propertyAddress: text("property_address"),
  buyer: text("buyer"),
  seller: text("seller"),
  discrepancyCount: integer("discrepancy_count").default(0),
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_cd_reviews_user_id").on(table.userId),
  index("idx_cd_reviews_created").on(table.createdAt),
])

export const hoaReviews = pgTable("hoa_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matterId: uuid("matter_id").references((): any => matters.id, { onDelete: "set null" }),
  associationName: text("association_name"),
  redFlagCount: integer("red_flag_count").default(0),
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_hoa_reviews_user_id").on(table.userId),
  index("idx_hoa_reviews_created").on(table.createdAt),
])

export const feeEstimates = pgTable("fee_estimates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matterId: uuid("matter_id").references((): any => matters.id, { onDelete: "set null" }),
  clientName: text("client_name").notNull(),
  transactionType: text("transaction_type").notNull(),
  jurisdiction: text("jurisdiction"),
  generatedLetter: text("generated_letter"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_fee_estimates_user_id").on(table.userId),
  index("idx_fee_estimates_created").on(table.createdAt),
])

export type CdReview = typeof cdReviews.$inferSelect
export type HoaReview = typeof hoaReviews.$inferSelect
export type FeeEstimate = typeof feeEstimates.$inferSelect

// API Keys table (Enterprise tier)
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "Production", "Staging"
  keyPrefix: text("key_prefix").notNull().unique(), // First 16 chars: tw_live_abc123...
  keyHash: text("key_hash").notNull(), // bcrypt hash of full key
  rateLimitPerMonth: integer("rate_limit_per_month").notNull().default(1000),
  isActive: text("is_active").default("true"), // "true" | "false" (text for compatibility)
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
}, (table) => [
  index("idx_api_keys_user_id").on(table.userId),
  index("idx_api_keys_prefix").on(table.keyPrefix), // Fast lookup during auth
])

// API Usage Logs (for billing and monitoring)
export const apiUsageLogs = pgTable("api_usage_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  apiKeyId: uuid("api_key_id").notNull().references(() => apiKeys.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(), // e.g., "/analyze-commitment"
  method: text("method").notNull(), // POST, GET
  statusCode: integer("status_code").notNull(),
  requestSizeBytes: integer("request_size_bytes"),
  responseSizeBytes: integer("response_size_bytes"),
  durationMs: integer("duration_ms"),
  tokensUsed: integer("tokens_used"), // Claude API tokens
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_usage_logs_key_created").on(table.apiKeyId, table.createdAt),
  index("idx_usage_logs_user_created").on(table.userId, table.createdAt),
])

// Webhooks (for async result delivery)
export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  events: jsonb("events").notNull(), // ["analysis.completed", "analysis.failed"]
  secret: text("secret").notNull(), // For HMAC signature verification
  isActive: text("is_active").default("true"), // "true" | "false"
  lastTriggeredAt: timestamp("last_triggered_at"),
  failureCount: integer("failure_count").notNull().default(0), // Auto-disable after 10 failures
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
}, (table) => [
  index("idx_webhooks_user_id").on(table.userId),
])

export const matterParties = pgTable("matter_parties", {
  id: uuid("id").primaryKey().defaultRandom(),
  matterId: uuid("matter_id").notNull().references(() => matters.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // buyer | seller | buyers_agent | listing_agent | lender | other
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_matter_parties_matter_id").on(table.matterId),
])

export const documentSlots = pgTable("document_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  matterId: uuid("matter_id").notNull().references(() => matters.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  category: text("category").notNull(), // contract | title | lender | hoa | misc
  status: text("status").default("pending").notNull(), // pending | received | waived
  notes: text("notes"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_document_slots_matter_id").on(table.matterId),
])

export const emailThreads = pgTable("email_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  matterId: uuid("matter_id").notNull().references(() => matters.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  direction: text("direction").notNull(), // "inbound" | "outbound"
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  subject: text("subject").notNull(),
  bodyText: text("body_text"),
  bodyHtml: text("body_html"),
  messageId: text("message_id").unique(), // Postmark message ID for dedup
  inReplyTo: text("in_reply_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_email_threads_matter_id").on(table.matterId),
  index("idx_email_threads_created").on(table.createdAt),
])

export type EmailThread = typeof emailThreads.$inferSelect
export type NewEmailThread = typeof emailThreads.$inferInsert

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  matterId: uuid("matter_id").notNull().references(() => matters.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content"),
  toolCalls: jsonb("tool_calls"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_chat_messages_matter").on(table.matterId, table.createdAt),
])

export type ChatMessage = typeof chatMessages.$inferSelect
export type NewChatMessage = typeof chatMessages.$inferInsert

export type MatterParty = typeof matterParties.$inferSelect
export type NewMatterParty = typeof matterParties.$inferInsert
export type DocumentSlot = typeof documentSlots.$inferSelect
export type NewDocumentSlot = typeof documentSlots.$inferInsert

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
export type ApiKey = typeof apiKeys.$inferSelect
export type NewApiKey = typeof apiKeys.$inferInsert
export type ApiUsageLog = typeof apiUsageLogs.$inferSelect
export type NewApiUsageLog = typeof apiUsageLogs.$inferInsert
export type Webhook = typeof webhooks.$inferSelect
export type NewWebhook = typeof webhooks.$inferInsert

export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  author: text("author").notNull().default("Patrick Mitchell"),
  authorUrl: text("author_url").notNull().default("https://linkedin.com/in/patricktmitchell"),
  category: text("category").notNull(),
  readTime: text("read_time").notNull(),
  brand: text("brand").notNull().default("titlewise"),
  tags: text("tags").array().default([]),
  status: text("status").notNull().default("draft"),
  canonical: text("canonical"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_blog_posts_slug").on(table.slug),
  index("idx_blog_posts_status").on(table.status),
  index("idx_blog_posts_published").on(table.publishedAt),
])

export type BlogPost = typeof blogPosts.$inferSelect
export type NewBlogPost = typeof blogPosts.$inferInsert
