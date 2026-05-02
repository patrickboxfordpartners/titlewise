CREATE TABLE "cd_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"matter_id" uuid,
	"property_address" text,
	"buyer" text,
	"seller" text,
	"discrepancy_count" integer DEFAULT 0,
	"result" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hoa_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"matter_id" uuid,
	"association_name" text,
	"red_flag_count" integer DEFAULT 0,
	"result" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_estimates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"matter_id" uuid,
	"client_name" text NOT NULL,
	"transaction_type" text NOT NULL,
	"jurisdiction" text,
	"generated_letter" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cd_reviews" ADD CONSTRAINT "cd_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cd_reviews" ADD CONSTRAINT "cd_reviews_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hoa_reviews" ADD CONSTRAINT "hoa_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hoa_reviews" ADD CONSTRAINT "hoa_reviews_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_estimates" ADD CONSTRAINT "fee_estimates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_estimates" ADD CONSTRAINT "fee_estimates_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cd_reviews_user_id" ON "cd_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_cd_reviews_created" ON "cd_reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_hoa_reviews_user_id" ON "hoa_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_hoa_reviews_created" ON "hoa_reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_fee_estimates_user_id" ON "fee_estimates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_fee_estimates_created" ON "fee_estimates" USING btree ("created_at");
