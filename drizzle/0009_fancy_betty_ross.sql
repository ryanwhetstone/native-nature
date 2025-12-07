ALTER TABLE "observations" ADD COLUMN "city" varchar(255);--> statement-breakpoint
ALTER TABLE "observations" ADD COLUMN "region" varchar(255);--> statement-breakpoint
ALTER TABLE "observations" ADD COLUMN "zipcode" varchar(20);--> statement-breakpoint
ALTER TABLE "observations" DROP COLUMN "location_name";