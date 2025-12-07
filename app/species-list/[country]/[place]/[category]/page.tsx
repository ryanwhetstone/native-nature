import Link from "next/link";
import { notFound } from "next/navigation";
import { getCountryBySlug } from "@/lib/countries";
import { getINaturalistPlaceId } from "@/lib/inaturalist-places";
import { getSpeciesListWithCache } from "@/lib/speciesCache";
import { categoryMapping } from "@/app/states/[state]/categoryMapping";
import SpeciesGrid from "@/app/states/[state]/SpeciesGrid";
import { getSVGConfigForCountry } from "@/lib/svg-mappings";

interface CategoryPageProps {
  params: Promise<{
    country: string;
    place: string;
    category: string;
  }>;
}

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

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { country, place, category } = await params;
  const countryData = getCountryBySlug(country);

  if (!countryData) {
    notFound();
  }

  // Get the state/region name from the SVG mapping
  const svgConfig = getSVGConfigForCountry(country);
  const regionData = svgConfig?.regionMapping 
    ? Object.values(svgConfig.regionMapping).find((region: any) => region.slug === place)
    : null;

  if (!regionData) {
    notFound();
  }

  const placeName = (regionData as any).name;

  const categoryInfo = categoryMapping[category];
  if (!categoryInfo) {
    notFound();
  }

  // Fetch the iNaturalist place ID from cache or API
  const iNaturalistPlaceId = await getINaturalistPlaceId(
    countryData.isoCode,
    countryData.isoCode2,
    placeName
  );

  // Fetch species data if we have a place ID
  const species = iNaturalistPlaceId 
    ? await getSpecies(iNaturalistPlaceId, categoryInfo.taxonId)
    : [];
  
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 relative">
          <Link 
            href={`/place/${country}/${place}`}
            className="absolute left-0 top-0 inline-flex items-center text-green-600 hover:text-green-700 font-medium"
          >
            ← Back to {placeName}
          </Link>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {categoryInfo.displayName} in {placeName}
          </h1>
          <p className="text-lg text-gray-600">
            Discover {categoryInfo.pluralName.toLowerCase()} observed in {placeName}, {countryData.name}
          </p>
        </div>

        {!iNaturalistPlaceId ? (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center">
              <div className="text-8xl mb-6">{categoryInfo.emoji}</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {categoryInfo.pluralName}
              </h2>
              <p className="text-gray-600 text-lg">
                Place data not available for {placeName}, {countryData.name}.
              </p>
              <p className="text-gray-500 mt-4">
                Unable to find this location in the iNaturalist database. 
                Try selecting a different region or contact support.
              </p>
            </div>
          </div>
        ) : species.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8">
            <p className="text-gray-600 text-center">Loading {categoryInfo.pluralName} data...</p>
          </div>
        ) : (
          <section>
            <SpeciesGrid 
              initialPlants={species} 
              placeId={iNaturalistPlaceId} 
              taxonId={categoryInfo.taxonId} 
            />
          </section>
        )}
      </div>
    </main>
  );
}

// Enable dynamic rendering for all category pages
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateStaticParams() {
  // Generate on-demand for now
  return [];
}
