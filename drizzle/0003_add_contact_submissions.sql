CREATE TABLE IF NOT EXISTS "contact_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"firm_name" text,
	"message" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_contact_submissions_created" ON "contact_submissions" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "idx_contact_submissions_email" ON "contact_submissions" USING btree ("email");
