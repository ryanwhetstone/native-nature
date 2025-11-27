import Link from "next/link";
import SpeciesGrid from "../SpeciesGrid";
import { stateToPlaceId } from "../stateMapping";

interface Plant {
  count: number;
  taxon: {
    id: number;
    name: string;
    preferred_common_name: string;
    default_photo?: {
      medium_url: string;
    };
  };
}

async function getPlants(placeId: number, taxonId: number) {
  try {
    const response = await fetch(
      `https://api.inaturalist.org/v1/observations/species_counts?place_id=${placeId}&taxon_id=${taxonId}&quality_grade=research&per_page=50`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch birds');
    }
    
    const data = await response.json();
    return data.results as Plant[];
  } catch (error) {
    console.error('Error fetching birds:', error);
    return [];
  }
}

export default async function BirdsPage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  
  const stateName = state
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const placeId = stateToPlaceId[state];
  const taxonId = 3; // Birds (Aves)
  const plants = placeId ? await getPlants(placeId, taxonId) : [];

  return (
    <main className="min-h-screen p-8">
      <Link href={`/states/${state}`} className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to {stateName}
      </Link>
      <h1 className="text-4xl font-bold mb-2">{stateName}</h1>
      <h2 className="text-2xl text-gray-600 mb-8">Birds</h2>
      
      <section>
        {plants.length === 0 ? (
          <p className="text-gray-600">Loading bird data...</p>
        ) : (
          <SpeciesGrid initialPlants={plants} placeId={placeId} taxonId={taxonId} />
        )}
      </section>
    </main>
  );
}
