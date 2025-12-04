import { config } from "dotenv";
import { resolve } from "path";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../db/schema";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });
const { inaturalistPlaces } = schema;

// Map state names to iNaturalist place IDs
const usaStatePlaceIds: Record<string, number> = {
  "alabama": 19,
  "alaska": 6,
  "arizona": 40,
  "arkansas": 36,
  "california": 14,
  "colorado": 34,
  "connecticut": 49,
  "delaware": 4,
  "florida": 21,
  "georgia": 23,
  "hawaii": 11,
  "idaho": 22,
  "illinois": 35,
  "indiana": 20,
  "iowa": 24,
  "kansas": 25,
  "kentucky": 26,
  "louisiana": 27,
  "maine": 17,
  "maryland": 39,
  "massachusetts": 2,
  "michigan": 29,
  "minnesota": 38,
  "mississippi": 37,
  "missouri": 28,
  "montana": 16,
  "nebraska": 3,
  "nevada": 50,
  "new-hampshire": 41,
  "new-jersey": 51,
  "new-mexico": 9,
  "new-york": 48,
  "north-carolina": 30,
  "north-dakota": 13,
  "ohio": 31,
  "oklahoma": 12,
  "oregon": 10,
  "pennsylvania": 42,
  "rhode-island": 8,
  "south-carolina": 43,
  "south-dakota": 44,
  "tennessee": 45,
  "texas": 18,
  "utah": 52,
  "vermont": 47,
  "virginia": 7,
  "washington": 46,
  "west-virginia": 33,
  "wisconsin": 32,
  "wyoming": 15,
};

async function migrateUSAStates() {
  console.log("Starting migration of USA state place IDs...");

  for (const [stateSlug, placeId] of Object.entries(usaStatePlaceIds)) {
    // Convert slug to proper state name
    const stateName = stateSlug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    try {
      await db.insert(inaturalistPlaces).values({
        placeId,
        countryCode: "USA",
        placeName: stateName,
        placeSlug: stateSlug,
        displayName: `${stateName}, US`,
        placeType: 8, // State/Province type in iNaturalist
        adminLevel: null,
      });

      console.log(`✓ Migrated ${stateName} (place_id: ${placeId})`);
    } catch (error) {
      console.error(`✗ Failed to migrate ${stateName}:`, error);
    }
  }

  console.log("Migration complete!");
  process.exit(0);
}

migrateUSAStates().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
