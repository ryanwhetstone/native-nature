import { notFound } from "next/navigation";
import Link from "next/link";
import CountryDetailMapWrapper from "../CountryDetailMapWrapper";
import InteractiveSVGMap from "@/components/InteractiveSVGMap";
import { getSVGConfigForCountry } from "@/lib/svg-mappings";
import { getCountryBySlug, getAllCountries } from "@/lib/countries";

interface CountryPageProps {
  params: Promise<{
    country: string;
  }>;
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { country } = await params;
  const countryData = getCountryBySlug(country);

  if (!countryData) {
    notFound();
  }

  // Check if this country has an interactive SVG map available
  const svgConfig = getSVGConfigForCountry(country);
  const hasSvgMap = svgConfig !== undefined;

  // Get states/provinces from the SVG mapping if available
  const states = hasSvgMap && svgConfig?.regionMapping 
    ? Object.entries(svgConfig.regionMapping).map(([regionId, region]: [string, any]) => ({
        id: regionId,
        name: region.name,
        slug: region.slug
      }))
    : [];

  // For other countries, show the country code and map
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 relative">
          <Link 
            href="/"
            className="absolute left-0 top-0 inline-flex items-center text-green-600 hover:text-green-700 font-medium"
          >
            ← Back to World
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{countryData.name}</h1>
          <p className="text-lg text-gray-600">
            Explore the diverse wildlife and ecosystems of {countryData.name}
          </p>
        </div>
        
        {hasSvgMap ? (
          <InteractiveSVGMap countrySlug={country} />
        ) : (
          <CountryDetailMapWrapper countryCode={countryData.isoCode} countryName={countryData.name} />
        )}
        
        {/* States/Provinces Grid */}
        {states.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">States & Provinces</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {states.map((state) => {
                return (
                  <Link
                    key={state.id}
                    href={`/place/${country}/${state.slug}`}
                    className="block p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all"
                  >
                    <p className="font-semibold text-gray-900">{state.name}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {states.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <p className="text-gray-500">
              Detailed regional and species information for {countryData.name} coming soon!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

// Enable dynamic params for countries not in generateStaticParams
export const dynamicParams = true;

export async function generateStaticParams() {
  // Generate pages for all countries
  return getAllCountries().map((country) => ({
    country: country.slug,
  }));
}
