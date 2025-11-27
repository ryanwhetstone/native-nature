import Link from "next/link";
import SpeciesGrid from "../SpeciesGrid";
import { stateToPlaceId } from "../stateMapping";
import { getSpeciesListWithCache } from "@/lib/speciesCache";

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
  const results = await getSpeciesListWithCache(placeId, taxonId);
  return results as Plant[];
}

export default async function PlantsPage({
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
  const taxonId = 47126; // All plants (Kingdom Plantae)
  const plants = placeId ? await getPlants(placeId, taxonId) : [];

  return (
    <main className="min-h-screen p-8">
      <Link href={`/states/${state}`} className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to {stateName}
      </Link>
      <h1 className="text-4xl font-bold mb-2">{stateName}</h1>
      <h2 className="text-2xl text-gray-600 mb-8">Plants</h2>
      
      <section>
        {plants.length === 0 ? (
          <p className="text-gray-600">Loading plant data...</p>
        ) : (
          <SpeciesGrid initialPlants={plants} placeId={placeId} taxonId={taxonId} />
        )}
      </section>
    </main>
  );
}
