import { getSpeciesByTaxonId, saveSpeciesFromAPI } from '@/db/queries';

interface TaxonPhoto {
  medium_url: string;
  attribution: string;
  license_code: string;
}

interface Taxon {
  id: number;
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
}

/**
 * Get species data - checks database first, then falls back to iNaturalist API
 */
export async function getSpeciesWithCache(speciesId: string): Promise<Taxon | null> {
  const taxonId = parseInt(speciesId);
  
  // First, check the database
  const cachedSpecies = await getSpeciesByTaxonId(taxonId);
  
  if (cachedSpecies) {
    // Return data from database in iNaturalist API format
    return {
      id: cachedSpecies.taxonId,
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
    const taxon = data.results[0] as Taxon;
    
    // Save to database asynchronously (don't wait for it)
    if (taxon) {
      saveSpeciesFromAPI(taxon).catch(err => 
        console.error('Failed to save species to DB:', err)
      );
    }
    
    return taxon;
  } catch (error) {
    console.error('Error fetching species:', error);
    return null;
  }
}

/**
 * Get multiple species with caching
 */
export async function getSpeciesListWithCache(
  placeId: number,
  taxonId: number,
  page: number = 1,
  filter?: 'native' | 'invasive'
): Promise<any[]> {
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
    
    // Save species to database in the background
    results.forEach((item: any) => {
      if (item.taxon) {
        saveSpeciesFromAPI(
          item.taxon,
          placeId,
          filter === 'native' ? true : filter === 'invasive' ? false : undefined
        ).catch(err => console.error('Failed to save species to DB:', err));
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error fetching species list:', error);
    return [];
  }
}
