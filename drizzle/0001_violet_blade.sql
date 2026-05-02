CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"rate_limit_per_month" integer DEFAULT 1000 NOT NULL,
	"is_active" text DEFAULT 'true',
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "api_keys_key_prefix_unique" UNIQUE("key_prefix")
);
--> statement-breakpoint
CREATE TABLE "api_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_key_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"method" text NOT NULL,
	"status_code" integer NOT NULL,
	"request_size_bytes" integer,
	"response_size_bytes" integer,
	"duration_ms" integer,
	"tokens_used" integer,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matter_id" uuid NOT NULL,
	"title" text NOT NULL,
	"assigned_to" text,
	"status" text DEFAULT 'pending',
	"due_date" timestamp,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"firm_name" text,
	"message" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_name" text NOT NULL,
	"property_address" text NOT NULL,
	"transaction_type" text NOT NULL,
	"closing_date" timestamp,
	"state" text,
	"status" text DEFAULT 'active',
	"portal_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "matters_portal_token_unique" UNIQUE("portal_token")
);
--> statement-breakpoint
CREATE TABLE "processed_events" (
	"id" text PRIMARY KEY NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"invited_email" text NOT NULL,
	"invite_token" text NOT NULL,
	"status" text DEFAULT 'pending',
	"role" text DEFAULT 'member',
	"joined_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	CONSTRAINT "team_members_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"url" text NOT NULL,
	"events" jsonb NOT NULL,
	"secret" text NOT NULL,
	"is_active" text DEFAULT 'true',
	"last_triggered_at" timestamp,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "wire_instructions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lender_name" text,
	"bank_name" text,
	"routing_number" text,
	"account_number" text,
	"beneficiary" text,
	"verified_at" timestamp DEFAULT now() NOT NULL,
	"matter_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "status_updates" ADD COLUMN "matter_id" uuid;--> statement-breakpoint
ALTER TABLE "title_analyses" ADD COLUMN "matter_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trial_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "monthly_usage_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "usage_reset_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_refresh_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "outlook_refresh_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "drip_day3_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "drip_day7_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "rate_limit_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "rate_limit_window_start" timestamp;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matters" ADD CONSTRAINT "matters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_joined_user_id_users_id_fk" FOREIGN KEY ("joined_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wire_instructions" ADD CONSTRAINT "wire_instructions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wire_instructions" ADD CONSTRAINT "wire_instructions_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_keys_user_id" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_api_keys_prefix" ON "api_keys" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "idx_usage_logs_key_created" ON "api_usage_logs" USING btree ("api_key_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_usage_logs_user_created" ON "api_usage_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_checklist_items_matter_id" ON "checklist_items" USING btree ("matter_id");--> statement-breakpoint
CREATE INDEX "idx_contact_submissions_created" ON "contact_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_contact_submissions_email" ON "contact_submissions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_matters_user_id" ON "matters" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_team_members_owner" ON "team_members" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_team_members_token" ON "team_members" USING btree ("invite_token");--> statement-breakpoint
CREATE INDEX "idx_webhooks_user_id" ON "webhooks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_wire_instructions_user" ON "wire_instructions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_wire_instructions_routing" ON "wire_instructions" USING btree ("routing_number");--> statement-breakpoint
ALTER TABLE "status_updates" ADD CONSTRAINT "status_updates_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_analyses" ADD CONSTRAINT "title_analyses_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_status_updates_user_id" ON "status_updates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_status_updates_created" ON "status_updates" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_title_analyses_user_id" ON "title_analyses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_title_analyses_created" ON "title_analyses" USING btree ("created_at");