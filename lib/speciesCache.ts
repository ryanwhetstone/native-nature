import { getSpeciesByTaxonId, saveSpeciesFromAPI } from '@/db/queries';

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

interface TaxonPhoto {
  medium_url: string;
  attribution: string;
  license_code: string;
}

interface Taxon {
  id: number;
  dbId?: number; // Database ID (different from taxon ID)
  name: string;
  rank: string;
  preferred_common_name?: string;
  wikipedia_url?: string;
  observations_count: number;
  default_photo?: TaxonPhoto;
  taxon_photos?: Array<{ photo: TaxonPhoto }>;
  wikipedia_summary?: string;
  conservation_status?: {
    status: string;
    status_name: string;
  };
  // Taxonomy fields
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
}

/**
 * Get species data - checks database first, then falls back to iNaturalist API
 * Set DISABLE_SPECIES_CACHE=true to always fetch fresh data from API
 */
export async function getSpeciesWithCache(speciesId: string): Promise<Taxon | null> {
  const taxonId = parseInt(speciesId);
  
  const cacheDisabled = process.env.DISABLE_SPECIES_CACHE === 'true';
  
  // First, check the database (unless caching is disabled)
  const cachedSpecies = cacheDisabled ? null : await getSpeciesByTaxonId(taxonId);
  
  if (cachedSpecies) {
    // Return data from database in iNaturalist API format
    return {
      id: cachedSpecies.taxonId,
      dbId: cachedSpecies.id, // Add database ID
      name: cachedSpecies.name,
      rank: cachedSpecies.rank,
      preferred_common_name: cachedSpecies.preferredCommonName || undefined,
      wikipedia_url: cachedSpecies.wikipediaUrl || undefined,
      observations_count: cachedSpecies.observationsCount || 0,
      default_photo: cachedSpecies.defaultPhotoUrl ? {
        medium_url: cachedSpecies.defaultPhotoUrl,
        attribution: cachedSpecies.defaultPhotoAttribution || '',
        license_code: cachedSpecies.defaultPhotoLicense || '',
      } : undefined,
      taxon_photos: cachedSpecies.taxonPhotos as any,
      wikipedia_summary: cachedSpecies.wikipediaSummary || undefined,
      conservation_status: cachedSpecies.conservationStatus ? {
        status: cachedSpecies.conservationStatus,
        status_name: cachedSpecies.conservationStatusName || '',
      } : undefined,
      kingdom: cachedSpecies.kingdom || undefined,
      phylum: cachedSpecies.phylum || undefined,
      class: cachedSpecies.class || undefined,
      order: cachedSpecies.order || undefined,
      family: cachedSpecies.family || undefined,
      genus: cachedSpecies.genus || undefined,
    };
  }
  
  // If not in database, fetch from API
  try {
    const response = await fetch(
      `https://api.inaturalist.org/v1/taxa/${speciesId}`,
      { next: { revalidate: 86400 } }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const taxon = data.results[0];
    
    if (!taxon) return null;
    
    // Extract global conservation status from conservation_statuses array
    // Prefer IUCN global status if available
    let conservationStatus = null;
    if (taxon.conservation_statuses && Array.isArray(taxon.conservation_statuses)) {
      // Look for IUCN global status (authority = "IUCN Red List")
      const iucnStatus = taxon.conservation_statuses.find(
        (cs: any) => cs.authority === 'IUCN Red List' && !cs.place
      );
      
      if (iucnStatus) {
        const statusName = IUCN_STATUS_MAP[iucnStatus.iucn] || iucnStatus.status;
        conservationStatus = {
          status: iucnStatus.status,
          status_name: statusName,
        };
      } else if (taxon.conservation_statuses.length > 0) {
        // Fall back to first conservation status
        const firstStatus = taxon.conservation_statuses[0];
        const statusName = firstStatus.iucn && IUCN_STATUS_MAP[firstStatus.iucn] 
          ? IUCN_STATUS_MAP[firstStatus.iucn]
          : firstStatus.status;
        conservationStatus = {
          status: firstStatus.status,
          status_name: statusName,
        };
      }
    }
    
    // Extract taxonomy from ancestors
    const taxonomy: Record<string, string> = {};
    if (taxon.ancestors && Array.isArray(taxon.ancestors)) {
      taxon.ancestors.forEach((ancestor: any) => {
        if (ancestor.rank === 'kingdom') taxonomy.kingdom = ancestor.name;
        if (ancestor.rank === 'phylum') taxonomy.phylum = ancestor.name;
        if (ancestor.rank === 'class') taxonomy.class = ancestor.name;
        if (ancestor.rank === 'order') taxonomy.order = ancestor.name;
        if (ancestor.rank === 'family') taxonomy.family = ancestor.name;
        if (ancestor.rank === 'genus') taxonomy.genus = ancestor.name;
      });
    }
    
    // Create taxon object with conservation status and taxonomy
    const taxonWithStatus = {
      ...taxon,
      conservation_status: conservationStatus,
      ...taxonomy,
    } as Taxon;
    
    // Save to database asynchronously (don't wait for it) - only if caching is enabled
    if (!cacheDisabled) {
      saveSpeciesFromAPI(taxonWithStatus).catch(err => {
        console.error('Failed to save species to DB:', err);
        console.error('Species ID:', speciesId);
      });
    }
    
    return taxonWithStatus;
  } catch (error) {
    console.error('Error fetching species:', error);
    return null;
  }
}

/**
 * Get multiple species with caching and establishment means
 * Set DISABLE_SPECIES_CACHE=true to always fetch fresh data from API
 */
export async function getSpeciesListWithCache(
  placeId: number,
  taxonId: number,
  page: number = 1,
  filter?: 'native' | 'invasive'
): Promise<any[]> {
  const cacheDisabled = process.env.DISABLE_SPECIES_CACHE === 'true';
  
  try {
    let filterParam = '';
    if (filter === 'native') filterParam = '&native=true';
    if (filter === 'invasive') filterParam = '&introduced=true';
    
    const response = await fetch(
      `https://api.inaturalist.org/v1/observations/species_counts?place_id=${placeId}&taxon_id=${taxonId}&quality_grade=research&per_page=50&page=${page}${filterParam}`,
      { next: { revalidate: 86400 } }
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    const results = data.results || [];
    
    // Enrich results with establishment means data and save to database
    const enrichedResults = await Promise.all(
      results.map(async (result: any) => {
        try {
          // First check if we have this species in the database with establishment means for this place
          // (unless caching is disabled)
          const cachedSpecies = cacheDisabled ? null : await getSpeciesByTaxonId(result.taxon.id);
          
          if (cachedSpecies && !cacheDisabled) {
            // If we have cached species and caching is enabled, use cached data including slug
            const establishmentData = cachedSpecies.establishmentMeans as any;
            const establishmentMeans = establishmentData && establishmentData[placeId]
              ? {
                  establishment_means: establishmentData[placeId],
                  place: { id: placeId, name: '' }
                }
              : undefined;
            
            return {
              ...result,
              taxon: {
                ...result.taxon,
                slug: cachedSpecies.slug, // Include slug from database
                establishment_means: establishmentMeans
              }
            };
          }
          
          // Only fetch from API if caching is disabled OR species not in database
          if (cacheDisabled || !cachedSpecies) {
            const taxonResponse = await fetch(
              `https://api.inaturalist.org/v1/taxa/${result.taxon.id}?place_id=${placeId}`,
              { next: { revalidate: 86400 } }
            );
            
            if (taxonResponse.ok) {
              const taxonData = await taxonResponse.json();
              const taxon = taxonData.results[0];
              
              if (taxon) {
                // Extract conservation status (same logic as getSpeciesWithCache)
                let conservationStatus = null;
                if (taxon.conservation_statuses && Array.isArray(taxon.conservation_statuses)) {
                  const iucnStatus = taxon.conservation_statuses.find(
                    (cs: any) => cs.authority === 'IUCN Red List' && !cs.place
                  );
                  
                  if (iucnStatus) {
                    const statusName = IUCN_STATUS_MAP[iucnStatus.iucn] || iucnStatus.status;
                    conservationStatus = {
                      status: iucnStatus.status,
                      status_name: statusName,
                    };
                  } else if (taxon.conservation_statuses.length > 0) {
                    const firstStatus = taxon.conservation_statuses[0];
                    const statusName = firstStatus.iucn && IUCN_STATUS_MAP[firstStatus.iucn] 
                      ? IUCN_STATUS_MAP[firstStatus.iucn]
                      : firstStatus.status;
                    conservationStatus = {
                      status: firstStatus.status,
                      status_name: statusName,
                    };
                  }
                }
                
                // Add conservation status to taxon object
                const enrichedTaxon = {
                  ...taxon,
                  conservation_status: conservationStatus,
                };
                
                // Save the enriched taxon data to database
                await saveSpeciesFromAPI(enrichedTaxon);
                
                if (taxon.establishment_means) {
                  return {
                    ...result,
                    taxon: {
                      ...result.taxon,
                      establishment_means: taxon.establishment_means
                    }
                  };
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching establishment means for taxon ${result.taxon.id}:`, error);
        }
        
        return result;
      })
    );
    
    return enrichedResults;
  } catch (error) {
    console.error('Error fetching species list:', error);
    return [];
  }
}
