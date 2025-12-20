ALTER TABLE "donations" ADD COLUMN "project_amount" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "site_tip" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "covers_fees" boolean DEFAULT false NOT NULL;