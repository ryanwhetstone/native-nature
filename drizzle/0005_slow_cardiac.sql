CREATE TABLE "inaturalist_places" (
	"id" serial PRIMARY KEY NOT NULL,
	"place_id" integer NOT NULL,
	"country_code" varchar(3) NOT NULL,
	"place_name" varchar(255) NOT NULL,
	"place_slug" varchar(255) NOT NULL,
	"display_name" varchar(500),
	"place_type" integer,
	"admin_level" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inaturalist_places_place_id_unique" UNIQUE("place_id"),
	CONSTRAINT "inaturalist_places_country_code_place_slug_unique" UNIQUE("country_code","place_slug")
);
