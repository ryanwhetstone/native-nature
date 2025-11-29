import Link from "next/link";
import { notFound } from "next/navigation";
import SpeciesGrid from "../SpeciesGrid";
import { stateToPlaceId } from "../stateMapping";
import { categoryMapping } from "../categoryMapping";
import { getSpeciesListWithCache } from "@/lib/speciesCache";

interface Species {
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

async function getSpecies(placeId: number, taxonId: number) {
  const results = await getSpeciesListWithCache(placeId, taxonId);
  return results as Species[];
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ state: string; category: string }>;
}) {
  const { state, category } = await params;
  
  // Check if category exists in mapping
  const categoryInfo = categoryMapping[category];
  if (!categoryInfo) {
    notFound();
  }
  
  const stateName = state
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const placeId = stateToPlaceId[state];
  const species = placeId ? await getSpecies(placeId, categoryInfo.taxonId) : [];

  return (
    <main className="min-h-screen p-8">
      <Link href={`/states/${state}`} className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to {stateName}
      </Link>
      <h1 className="text-4xl font-bold mb-2">{stateName}</h1>
      <h2 className="text-2xl text-gray-600 mb-8">{categoryInfo.displayName}</h2>
      
      <section>
        {species.length === 0 ? (
          <p className="text-gray-600">Loading {categoryInfo.pluralName} data...</p>
        ) : (
          <SpeciesGrid initialPlants={species} placeId={placeId} taxonId={categoryInfo.taxonId} />
        )}
      </section>
    </main>
  );
}
