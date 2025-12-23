CREATE TABLE "project_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" text,
	"asker_name" varchar(255),
	"question" text NOT NULL,
	"response" text,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_questions" ADD CONSTRAINT "project_questions_project_id_conservation_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."conservation_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_questions" ADD CONSTRAINT "project_questions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;