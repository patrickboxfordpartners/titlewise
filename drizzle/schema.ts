import { pgTable, text, timestamp, unique, uuid, integer, index, foreignKey, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const processedEvents = pgTable("processed_events", {
	id: text().primaryKey().notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }).defaultNow().notNull(),
});

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clerkId: text("clerk_id").notNull(),
	email: text().notNull(),
	name: text(),
	firmName: text("firm_name"),
	stripeCustomerId: text("stripe_customer_id"),
	stripeSubscriptionId: text("stripe_subscription_id"),
	stripePriceId: text("stripe_price_id"),
	subscriptionStatus: text("subscription_status").default('inactive'),
	subscriptionTier: text("subscription_tier"),
	seatCount: integer("seat_count").default(1),
	trialEndsAt: timestamp("trial_ends_at", { mode: 'string' }),
	monthlyUsageCount: integer("monthly_usage_count").default(0),
	usageResetAt: timestamp("usage_reset_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	googleRefreshToken: text("google_refresh_token"),
	outlookRefreshToken: text("outlook_refresh_token"),
	dripDay3SentAt: timestamp("drip_day3_sent_at", { mode: 'string' }),
	dripDay7SentAt: timestamp("drip_day7_sent_at", { mode: 'string' }),
	rateLimitCount: integer("rate_limit_count").default(0),
	rateLimitWindowStart: timestamp("rate_limit_window_start", { mode: 'string' }),
}, (table) => [
	unique("users_clerk_id_unique").on(table.clerkId),
	unique("users_stripe_customer_id_unique").on(table.stripeCustomerId),
	unique("users_stripe_subscription_id_unique").on(table.stripeSubscriptionId),
]);

export const statusUpdates = pgTable("status_updates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	clientName: text("client_name").notNull(),
	propertyAddress: text("property_address").notNull(),
	transactionType: text("transaction_type").notNull(),
	closingStage: text("closing_stage").notNull(),
	completedItems: text("completed_items"),
	outstandingItems: text("outstanding_items"),
	upcomingDeadlines: text("upcoming_deadlines"),
	additionalNotes: text("additional_notes"),
	tone: text().default('professional'),
	generatedEmail: text("generated_email"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	matterId: uuid("matter_id"),
}, (table) => [
	index("idx_status_updates_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_status_updates_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "status_updates_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.matterId],
			foreignColumns: [matters.id],
			name: "status_updates_matter_id_matters_id_fk"
		}).onDelete("set null"),
]);

export const titleAnalyses = pgTable("title_analyses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	propertyAddress: text("property_address"),
	commitmentText: text("commitment_text").notNull(),
	analysis: jsonb().notNull(),
	redFlagCount: integer("red_flag_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	matterId: uuid("matter_id"),
}, (table) => [
	index("idx_title_analyses_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_title_analyses_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "title_analyses_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.matterId],
			foreignColumns: [matters.id],
			name: "title_analyses_matter_id_matters_id_fk"
		}).onDelete("set null"),
]);

export const matters = pgTable("matters", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	clientName: text("client_name").notNull(),
	propertyAddress: text("property_address").notNull(),
	transactionType: text("transaction_type").notNull(),
	closingDate: timestamp("closing_date", { mode: 'string' }),
	status: text().default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	state: text(),
	portalToken: text("portal_token"),
}, (table) => [
	index("idx_matters_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "matters_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("matters_portal_token_unique").on(table.portalToken),
]);

export const checklistItems = pgTable("checklist_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	matterId: uuid("matter_id").notNull(),
	title: text().notNull(),
	assignedTo: text("assigned_to"),
	status: text().default('pending'),
	dueDate: timestamp("due_date", { mode: 'string' }),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_checklist_items_matter_id").using("btree", table.matterId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.matterId],
			foreignColumns: [matters.id],
			name: "checklist_items_matter_id_matters_id_fk"
		}).onDelete("cascade"),
]);

export const wireInstructions = pgTable("wire_instructions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	lenderName: text("lender_name"),
	bankName: text("bank_name"),
	routingNumber: text("routing_number"),
	accountNumber: text("account_number"),
	beneficiary: text(),
	verifiedAt: timestamp("verified_at", { mode: 'string' }).defaultNow().notNull(),
	matterId: uuid("matter_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_wire_instructions_routing").using("btree", table.routingNumber.asc().nullsLast().op("text_ops")),
	index("idx_wire_instructions_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "wire_instructions_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.matterId],
			foreignColumns: [matters.id],
			name: "wire_instructions_matter_id_matters_id_fk"
		}).onDelete("set null"),
]);

export const teamMembers = pgTable("team_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ownerId: uuid("owner_id").notNull(),
	invitedEmail: text("invited_email").notNull(),
	inviteToken: text("invite_token").notNull(),
	status: text().default('pending'),
	role: text().default('member'),
	joinedUserId: uuid("joined_user_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	acceptedAt: timestamp("accepted_at", { mode: 'string' }),
}, (table) => [
	index("idx_team_members_owner").using("btree", table.ownerId.asc().nullsLast().op("uuid_ops")),
	index("idx_team_members_token").using("btree", table.inviteToken.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "team_members_owner_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.joinedUserId],
			foreignColumns: [users.id],
			name: "team_members_joined_user_id_users_id_fk"
		}).onDelete("set null"),
	unique("team_members_invite_token_unique").on(table.inviteToken),
]);

export const documentSlots = pgTable("document_slots", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	matterId: uuid("matter_id").notNull(),
	label: text().notNull(),
	category: text().notNull(),
	status: text().default('pending').notNull(),
	notes: text(),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_document_slots_matter_id").using("btree", table.matterId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.matterId],
			foreignColumns: [matters.id],
			name: "document_slots_matter_id_matters_id_fk"
		}).onDelete("cascade"),
]);

export const matterParties = pgTable("matter_parties", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	matterId: uuid("matter_id").notNull(),
	role: text().notNull(),
	name: text().notNull(),
	email: text(),
	phone: text(),
	company: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_matter_parties_matter_id").using("btree", table.matterId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.matterId],
			foreignColumns: [matters.id],
			name: "matter_parties_matter_id_matters_id_fk"
		}).onDelete("cascade"),
]);

export const emailThreads = pgTable("email_threads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	matterId: uuid("matter_id").notNull(),
	userId: uuid("user_id").notNull(),
	direction: text().notNull(),
	fromAddress: text("from_address").notNull(),
	toAddress: text("to_address").notNull(),
	subject: text().notNull(),
	bodyText: text("body_text"),
	bodyHtml: text("body_html"),
	messageId: text("message_id"),
	inReplyTo: text("in_reply_to"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_email_threads_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_email_threads_matter_id").using("btree", table.matterId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.matterId],
			foreignColumns: [matters.id],
			name: "email_threads_matter_id_matters_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "email_threads_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("email_threads_message_id_unique").on(table.messageId),
]);

export const contactSubmissions = pgTable("contact_submissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	firmName: text("firm_name"),
	message: text().notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_contact_submissions_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_contact_submissions_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
]);

export const apiKeys = pgTable("api_keys", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: text().notNull(),
	keyPrefix: text("key_prefix").notNull(),
	keyHash: text("key_hash").notNull(),
	rateLimitPerMonth: integer("rate_limit_per_month").default(1000).notNull(),
	isActive: text("is_active").default('true'),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
}, (table) => [
	index("idx_api_keys_prefix").using("btree", table.keyPrefix.asc().nullsLast().op("text_ops")),
	index("idx_api_keys_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "api_keys_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "api_keys_created_by_users_id_fk"
		}).onDelete("set null"),
	unique("api_keys_key_prefix_unique").on(table.keyPrefix),
]);

export const apiUsageLogs = pgTable("api_usage_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	apiKeyId: uuid("api_key_id").notNull(),
	userId: uuid("user_id").notNull(),
	endpoint: text().notNull(),
	method: text().notNull(),
	statusCode: integer("status_code").notNull(),
	requestSizeBytes: integer("request_size_bytes"),
	responseSizeBytes: integer("response_size_bytes"),
	durationMs: integer("duration_ms"),
	tokensUsed: integer("tokens_used"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_usage_logs_key_created").using("btree", table.apiKeyId.asc().nullsLast().op("timestamp_ops"), table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_usage_logs_user_created").using("btree", table.userId.asc().nullsLast().op("timestamp_ops"), table.createdAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.apiKeyId],
			foreignColumns: [apiKeys.id],
			name: "api_usage_logs_api_key_id_api_keys_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "api_usage_logs_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const webhooks = pgTable("webhooks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	url: text().notNull(),
	events: jsonb().notNull(),
	secret: text().notNull(),
	isActive: text("is_active").default('true'),
	lastTriggeredAt: timestamp("last_triggered_at", { mode: 'string' }),
	failureCount: integer("failure_count").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by"),
}, (table) => [
	index("idx_webhooks_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "webhooks_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "webhooks_created_by_users_id_fk"
		}).onDelete("set null"),
]);

export const feeEstimates = pgTable("fee_estimates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	matterId: uuid("matter_id"),
	clientName: text("client_name").notNull(),
	transactionType: text("transaction_type").notNull(),
	jurisdiction: text(),
	generatedLetter: text("generated_letter"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_fee_estimates_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_fee_estimates_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fee_estimates_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.matterId],
			foreignColumns: [matters.id],
			name: "fee_estimates_matter_id_matters_id_fk"
		}).onDelete("set null"),
]);

export const cdReviews = pgTable("cd_reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	matterId: uuid("matter_id"),
	propertyAddress: text("property_address"),
	buyer: text(),
	seller: text(),
	discrepancyCount: integer("discrepancy_count").default(0),
	result: jsonb().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_cd_reviews_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_cd_reviews_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "cd_reviews_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.matterId],
			foreignColumns: [matters.id],
			name: "cd_reviews_matter_id_matters_id_fk"
		}).onDelete("set null"),
]);

export const hoaReviews = pgTable("hoa_reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	matterId: uuid("matter_id"),
	associationName: text("association_name"),
	redFlagCount: integer("red_flag_count").default(0),
	result: jsonb().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_hoa_reviews_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_hoa_reviews_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "hoa_reviews_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.matterId],
			foreignColumns: [matters.id],
			name: "hoa_reviews_matter_id_matters_id_fk"
		}).onDelete("set null"),
]);
