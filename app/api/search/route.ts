import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { species, observations, observationPictures } from "@/db/schema";
import { ilike, or, sql, inArray } from "drizzle-orm";
// @ts-ignore
import csc from "countrycitystatejson";
import { countries } from "@/lib/countries";
import { saveSpeciesFromAPI } from "@/db/queries";

// IUCN Conservation Status mapping
const IUCN_STATUS_MAP: Record<number, string> = {
  0: 'Not Evaluated',
  5: 'Data Deficient',
  10: 'Least Concern',
  20: 'Near Threatened',
  30: 'Vulnerable',
  40: 'Endangered',
  50: 'Critically Endangered',
  60: 'Extinct in the Wild',
  70: 'Extinct',
};

// Helper to convert 2-char ISO code to 3-char ISO code
function getIso3Code(iso2: string): string | null {
  const country = Object.values(countries).find(c => c.isoCode2 === iso2);
  return country ? country.slug : null;
}

// Helper to slugify place names - strips accents and special characters
function slugifyPlace(name: string): string {
  return name
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        species: [],
        places: [],
        observations: [],
      });
    }

    const searchTerm = `%${query.trim()}%`;

    // Search species by name or common name (case-insensitive) in local DB
    const dbSpeciesResults = await db
      .select({
        id: species.id,
        name: species.name,
        preferredCommonName: species.preferredCommonName,
        slug: species.slug,
        defaultPhotoUrl: species.defaultPhotoUrl,
        taxonId: species.taxonId,
        conservationStatus: species.conservationStatus,
        conservationStatusName: species.conservationStatusName,
      })
      .from(species)
      .where(
        or(
          ilike(species.name, searchTerm),
          ilike(species.preferredCommonName, searchTerm)
        )
      )
      .limit(50);

    // Also search iNaturalist API for species
    let inatSpeciesResults: any[] = [];
    try {
      const inatResponse = await fetch(
        `https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(query.trim())}&per_page=20&rank=species`,
        { next: { revalidate: 3600 } } // Cache for 1 hour
      );
      
      if (inatResponse.ok) {
        const inatData = await inatResponse.json();
        
        // Add each species to database if not already there
        for (const taxon of inatData.results || []) {
          // Check if species already exists in DB
          const existingSpecies = await db.query.species.findFirst({
            where: sql`${species.taxonId} = ${taxon.id}`,
          });

          if (!existingSpecies) {
            // Fetch full taxon data with ancestry for enrichment
            try {
              const fullTaxonResponse = await fetch(
                `https://api.inaturalist.org/v1/taxa/${taxon.id}`,
                { next: { revalidate: 86400 } } // Cache for 24 hours
              );
              
              if (fullTaxonResponse.ok) {
                const fullTaxonData = await fullTaxonResponse.json();
                const fullTaxon = fullTaxonData.results?.[0];
                
                if (fullTaxon) {
                  // Extract global conservation status from conservation_statuses array
                  let conservationStatus = null;
                  if (fullTaxon.conservation_statuses && Array.isArray(fullTaxon.conservation_statuses)) {
                    // Look for IUCN global status (authority = "IUCN Red List")
                    const iucnStatus = fullTaxon.conservation_statuses.find(
                      (cs: any) => cs.authority === 'IUCN Red List' && !cs.place
                    );
                    
                    if (iucnStatus) {
                      const statusName = IUCN_STATUS_MAP[iucnStatus.iucn] || iucnStatus.status;
                      conservationStatus = {
                        status: iucnStatus.status,
                        status_name: statusName,
                      };
                    } else if (fullTaxon.conservation_statuses.length > 0) {
                      // Fall back to first conservation status
                      const firstStatus = fullTaxon.conservation_statuses[0];
                      const statusName = firstStatus.iucn && IUCN_STATUS_MAP[firstStatus.iucn] 
                        ? IUCN_STATUS_MAP[firstStatus.iucn]
                        : firstStatus.status;
                      conservationStatus = {
                        status: firstStatus.status,
                        status_name: statusName,
                      };
                    }
                  }
                  
                  // Add conservation status to taxon object before saving
                  const enrichedTaxon = {
                    ...fullTaxon,
                    conservation_status: conservationStatus,
                  };
                  
                  // Use the existing enrichment function
                  await saveSpeciesFromAPI(enrichedTaxon);
                }
              }
            } catch (enrichError) {
              console.error(`Error enriching species ${taxon.id}:`, enrichError);
              // If enrichment fails, continue with basic data
            }
          }

          // Get the slug from DB if it exists now
          const savedSpecies = await db.query.species.findFirst({
            where: sql`${species.taxonId} = ${taxon.id}`,
          });

          inatSpeciesResults.push({
            id: taxon.id,
            taxonId: taxon.id,
            name: taxon.name,
            preferredCommonName: taxon.preferred_common_name || null,
            slug: savedSpecies?.slug || (taxon.preferred_common_name
              ? `${taxon.preferred_common_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${taxon.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
              : taxon.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')),
            defaultPhotoUrl: taxon.default_photo?.medium_url || null,
            conservationStatus: savedSpecies?.conservationStatus || null,
            conservationStatusName: savedSpecies?.conservationStatusName || null,
            source: 'inaturalist',
          });
        }
      }
    } catch (error) {
      console.error("iNaturalist API error:", error);
    }

    // Merge results, prioritizing DB results and removing duplicates
    const dbTaxonIds = new Set(dbSpeciesResults.map(s => s.taxonId));
    const uniqueInatResults = inatSpeciesResults.filter(
      (inatSpecies: any) => !dbTaxonIds.has(inatSpecies.taxonId)
    );

    const speciesResults = [
      ...dbSpeciesResults.map(s => ({ ...s, source: 'database' })),
      ...uniqueInatResults,
    ].slice(0, 50);

    // Search observations based on the species IDs found (only database species have observations)
    let formattedObservations: any[] = [];
    
    if (speciesResults.length > 0) {
      // Only use database species IDs (numeric) for observations query
      const dbSpeciesIds = speciesResults
        .filter(s => s.source === 'database' && typeof s.id === 'number')
        .map(s => s.id as number);
      
      if (dbSpeciesIds.length > 0) {
        const observationsResults = await db.query.observations.findMany({
          where: inArray(observations.speciesId, dbSpeciesIds),
          with: {
            species: {
              columns: {
                name: true,
                preferredCommonName: true,
              },
            },
            pictures: {
              limit: 1,
              columns: {
                imageUrl: true,
              },
            },
          },
          limit: 50,
        });

        // Format observations with image URL
        formattedObservations = observationsResults.map((obs) => ({
          id: obs.id,
          species: {
            name: obs.species.name,
            preferredCommonName: obs.species.preferredCommonName,
          },
          imageUrl: obs.pictures[0]?.imageUrl || null,
          observedAt: obs.observedAt,
          location: [obs.city, obs.region, obs.country].filter(Boolean).join(", "),
        }));
      }
    }

    // Search places (countries and states)
    const placesResults: any[] = [];
    const searchQuery = query.trim().toLowerCase();
    
    // Search countries
    const allCountries = csc.getCountries();
    const matchingCountries = allCountries.filter((country: any) => 
      country.name.toLowerCase().includes(searchQuery) ||
      country.shortName.toLowerCase().includes(searchQuery)
    ).slice(0, 10);
    
    matchingCountries.forEach((country: any) => {
      const iso3Code = getIso3Code(country.shortName);
      if (iso3Code) {
        placesResults.push({
          id: `country-${country.shortName}`,
          name: country.name,
          type: "Country",
          country: country.name,
          url: `/country/${iso3Code}`,
        });
      }
    });
    
    // Search states/regions within countries
    allCountries.forEach((country: any) => {
      try {
        const iso3Code = getIso3Code(country.shortName);
        if (!iso3Code) return;
        
        const states = csc.getStatesByShort(country.shortName);
        if (states && Array.isArray(states)) {
          const matchingStates = states
            .filter((state: any) => 
              state.toLowerCase().includes(searchQuery) &&
              !state.toLowerCase().includes('dial code') // Filter out data errors
            )
            .slice(0, 5);
          
          matchingStates.forEach((state: any) => {
            placesResults.push({
              id: `state-${country.shortName}-${state}`,
              name: state,
              type: "State/Region",
              country: country.name,
              url: `/place/${iso3Code}/${slugifyPlace(state)}`,
            });
          });
        }
      } catch (error) {
        // Skip countries that don't have state data
      }
    });
    
    // Limit total results
    const limitedPlacesResults = placesResults.slice(0, 50);

    return NextResponse.json({
      species: speciesResults,
      places: limitedPlacesResults,
      observations: formattedObservations,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
