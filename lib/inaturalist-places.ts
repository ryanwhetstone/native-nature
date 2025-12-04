import { db } from "@/db";
import { inaturalistPlaces } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface INaturalistPlaceResult {
  id: number;
  name: string;
  display_name: string;
  place_type: number;
  admin_level: number | null;
}

/**
 * Get iNaturalist place ID for a country/region
 * First checks database cache, then queries iNaturalist API if not found
 * @param countryCode3 - ISO 3166-1 alpha-3 (3-letter) country code
 * @param countryCode2 - ISO 3166-1 alpha-2 (2-letter) country code for API calls
 * @param placeName - Optional state/province name
 */
export async function getINaturalistPlaceId(
  countryCode3: string,
  countryCode2: string,
  placeName: string | null = null
): Promise<number | null> {
  const placeSlug = placeName
    ? placeName.toLowerCase().replace(/\s+/g, "-")
    : countryCode3.toLowerCase();

  // Check if we have it cached in the database
  const cached = await db
    .select()
    .from(inaturalistPlaces)
    .where(
      placeName
        ? and(
            eq(inaturalistPlaces.countryCode, countryCode3.toUpperCase()),
            eq(inaturalistPlaces.placeSlug, placeSlug)
          )
        : eq(inaturalistPlaces.countryCode, countryCode3.toUpperCase())
    )
    .limit(1);

  if (cached.length > 0) {
    return cached[0].placeId;
  }

  // Not cached, query iNaturalist API (use 2-letter code)
  const searchQuery = placeName
    ? `${placeName} ${countryCode2}`
    : countryCode2;

  try {
    const response = await fetch(
      `https://api.inaturalist.org/v1/places/autocomplete?q=${encodeURIComponent(
        searchQuery
      )}`
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const place: INaturalistPlaceResult = data.results[0];

      // Cache it in the database
      await db.insert(inaturalistPlaces).values({
        placeId: place.id,
        countryCode: countryCode3.toUpperCase(),
        placeName: placeName || countryCode2,
        placeSlug,
        displayName: place.display_name,
        placeType: place.place_type,
        adminLevel: place.admin_level,
      });

      return place.id;
    }
  } catch (error) {
    console.error("Error fetching iNaturalist place ID:", error);
  }

  return null;
}

/**
 * Batch fetch and cache place IDs for multiple locations
 */
export async function cacheMultiplePlaces(
  locations: Array<{ countryCode3: string; countryCode2: string; placeName?: string }>
): Promise<void> {
  for (const location of locations) {
    await getINaturalistPlaceId(location.countryCode3, location.countryCode2, location.placeName);
    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
