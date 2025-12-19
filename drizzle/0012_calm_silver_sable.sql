CREATE TABLE "conservation_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"country" varchar(255),
	"city" varchar(255),
	"region" varchar(255),
	"funding_goal" integer NOT NULL,
	"current_funding" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_pictures" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"caption" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "species" ADD COLUMN "slug" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "conservation_projects" ADD CONSTRAINT "conservation_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_pictures" ADD CONSTRAINT "project_pictures_project_id_conservation_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."conservation_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species" ADD CONSTRAINT "species_slug_unique" UNIQUE("slug");