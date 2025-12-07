import { notFound } from "next/navigation";
import Link from "next/link";
import { getCountryBySlug } from "@/lib/countries";
import { categoryMapping } from "@/app/states/[state]/categoryMapping";
import { getSVGConfigForCountry } from "@/lib/svg-mappings";

interface PlacePageProps {
  params: Promise<{
    country: string;
    place: string;
  }>;
}

export default async function PlacePage({ params }: PlacePageProps) {
  const { country, place } = await params;
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

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 relative">
          <Link 
            href={`/country/${country}`}
            className="absolute left-0 top-0 inline-flex items-center text-green-600 hover:text-green-700 font-medium"
          >
            ← Back to {countryData.name}
          </Link>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{placeName}</h1>
          <p className="text-lg text-gray-600">
            Explore the diverse wildlife and natural species found in {placeName}, {countryData.name}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(categoryMapping).map(([slug, info]) => {
            return (
              <Link
                key={slug}
                href={`/species-list/${country}/${place}/${slug}`}
                className={`p-8 border-2 border-gray-300 rounded-lg ${info.colors.hover} transition-all bg-white text-center group`}
              >
                <div className="text-6xl mb-4">{info.emoji}</div>
                <h2 className={`text-2xl font-bold text-gray-800 ${info.colors.text}`}>
                  {info.displayName}
                </h2>
                <p className="text-gray-600 mt-2">Explore {info.pluralName}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}

// Enable dynamic rendering for all place pages
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateStaticParams() {
  // For now, return empty array - states will be generated on-demand
  // In the future, you could pre-generate popular states
  return [];
}
