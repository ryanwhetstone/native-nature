CREATE TABLE "observation_pictures" (
	"id" serial PRIMARY KEY NOT NULL,
	"observation_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"caption" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "observation_pictures" ADD CONSTRAINT "observation_pictures_observation_id_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."observations"("id") ON DELETE cascade ON UPDATE no action;