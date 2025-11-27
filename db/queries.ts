import { db } from './index';
import { species, type NewSpecies } from './schema';
import { eq } from 'drizzle-orm';

interface TaxonPhoto {
  medium_url: string;
  attribution: string;
  license_code: string;
}

interface ConservationStatus {
  status: string;
  status_name: string;
}

interface INaturalistTaxon {
  id: number;
  name: string;
  rank: string;
  preferred_common_name?: string;
  wikipedia_url?: string;
  wikipedia_summary?: string;
  observations_count: number;
  default_photo?: TaxonPhoto;
  taxon_photos?: Array<{ photo: TaxonPhoto }>;
  conservation_status?: ConservationStatus;
  // Ancestry is in the ancestors array
  ancestors?: Array<{
    name: string;
    rank: string;
  }>;
}

// Extract taxonomy from ancestors array
function extractTaxonomy(ancestors?: Array<{ name: string; rank: string }>) {
  if (!ancestors) return {};
  
  const taxonomy: Record<string, string> = {};
  ancestors.forEach(ancestor => {
    if (ancestor.rank === 'kingdom') taxonomy.kingdom = ancestor.name;
    if (ancestor.rank === 'phylum') taxonomy.phylum = ancestor.name;
    if (ancestor.rank === 'class') taxonomy.class = ancestor.name;
    if (ancestor.rank === 'order') taxonomy.order = ancestor.name;
    if (ancestor.rank === 'family') taxonomy.family = ancestor.name;
    if (ancestor.rank === 'genus') taxonomy.genus = ancestor.name;
  });
  
  return taxonomy;
}

export async function saveSpeciesFromAPI(taxon: INaturalistTaxon, placeId?: number, isNative?: boolean) {
  const taxonomy = extractTaxonomy(taxon.ancestors);
  
  const speciesData: NewSpecies = {
    taxonId: taxon.id,
    name: taxon.name,
    preferredCommonName: taxon.preferred_common_name,
    rank: taxon.rank,
    kingdom: taxonomy.kingdom,
    phylum: taxonomy.phylum,
    class: taxonomy.class,
    order: taxonomy.order,
    family: taxonomy.family,
    genus: taxonomy.genus,
    wikipediaUrl: taxon.wikipedia_url,
    wikipediaSummary: taxon.wikipedia_summary,
    observationsCount: taxon.observations_count,
    defaultPhotoUrl: taxon.default_photo?.medium_url,
    defaultPhotoAttribution: taxon.default_photo?.attribution,
    defaultPhotoLicense: taxon.default_photo?.license_code,
    conservationStatus: taxon.conservation_status?.status,
    conservationStatusName: taxon.conservation_status?.status_name,
    taxonPhotos: taxon.taxon_photos as any,
    establishmentMeans: placeId && isNative !== undefined 
      ? { [placeId]: isNative ? 'native' : 'introduced' }
      : null,
    updatedAt: new Date(),
  };

  // Check if species already exists
  const existing = await db.query.species.findFirst({
    where: eq(species.taxonId, taxon.id),
  });

  if (existing) {
    // Update existing record
    await db.update(species)
      .set(speciesData)
      .where(eq(species.taxonId, taxon.id));
    return existing.id;
  } else {
    // Insert new record
    const result = await db.insert(species).values(speciesData).returning({ id: species.id });
    return result[0].id;
  }
}

export async function getSpeciesById(id: number) {
  return await db.query.species.findFirst({
    where: eq(species.id, id),
  });
}

export async function getSpeciesByTaxonId(taxonId: number) {
  return await db.query.species.findFirst({
    where: eq(species.taxonId, taxonId),
  });
}
