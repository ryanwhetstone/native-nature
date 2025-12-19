import { notFound } from "next/navigation";
import Link from "next/link";
import { getCountryBySlug } from "@/lib/countries";
import { getSVGConfigForCountry } from "@/lib/svg-mappings";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; place: string }>;
}): Promise<Metadata> {
  const { country, place } = await params;
  const countryData = getCountryBySlug(country);
  const svgConfig = getSVGConfigForCountry(country);
  const placeData = svgConfig?.regionMapping 
    ? Object.values(svgConfig.regionMapping).find((region: any) => region.slug === place)
    : null;

  if (!countryData || !placeData) {
    return {
      title: "Place Not Found | Native Nature",
    };
  }

  return {
    title: `Conservation Efforts in ${(placeData as any).name}, ${countryData.name} | Native Nature`,
    description: `Learn about conservation efforts and environmental initiatives in ${(placeData as any).name}, ${countryData.name}.`,
  };
}

interface ConservationEffortsPageProps {
  params: Promise<{
    country: string;
    place: string;
  }>;
}

export default async function ConservationEffortsPage({ params }: ConservationEffortsPageProps) {
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
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link 
            href={`/place/${country}/${place}`}
            className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
          >
            ← Back to {placeName}
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🌱</div>
            <h1 className="text-4xl font-semibold text-gray-900 mb-2">
              Conservation Efforts
            </h1>
            <p className="text-xl text-gray-600">
              {placeName}, {countryData.name}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Protecting Nature in {placeName}
          </h2>
          
          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="mb-4">
              Conservation efforts in {placeName} are crucial for preserving the region&apos;s unique biodiversity 
              and natural habitats. Local organizations, government agencies, and community groups work together 
              to protect endangered species, restore ecosystems, and promote sustainable practices.
            </p>
            
            <p className="mb-4">
              These initiatives focus on various aspects of environmental protection, including habitat restoration, 
              wildlife monitoring, invasive species management, and public education. By supporting these efforts, 
              we can help ensure that future generations will continue to enjoy the natural beauty and ecological 
              diversity of {placeName}.
            </p>
            
            <p className="mb-4">
              Whether through volunteering, donating to conservation organizations, or simply practicing 
              environmentally responsible behavior, everyone can contribute to the preservation of {placeName}&apos;s 
              natural heritage.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

// Enable dynamic rendering for all conservation efforts pages
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
