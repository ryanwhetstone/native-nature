import { notFound } from "next/navigation";
import Link from "next/link";
import CountryDetailMapWrapper from "../CountryDetailMapWrapper";
import { getCountryBySlug, getAllCountries } from "@/lib/countries";
// @ts-ignore - No types available for this package
import ccsjson from "countrycitystatejson";

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

  // For USA, redirect to the specific implementation
  if (country.toLowerCase() === "usa") {
    const { default: USAPage } = await import("../us/page");
    return <USAPage />;
  }

  // Get states/provinces for this country using the 2-letter ISO code
  const countryInfo = ccsjson.getCountryByShort(countryData.isoCode2);
  const stateNames = countryInfo?.states ? Object.keys(countryInfo.states) : [];
  const states = stateNames.filter(name => name.length > 2); // Filter out short codes like "AA", "AE"

  // For other countries, show the country code and map
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Link 
          href="/"
          className="inline-flex items-center text-green-600 hover:text-green-700 font-medium mb-4"
        >
          ← Back to World
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{countryData.name}</h1>
        
        <CountryDetailMapWrapper countryCode={countryData.isoCode} countryName={countryData.name} />
        
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <p className="text-gray-600 mb-4">
            Country Code: <span className="font-mono font-bold text-2xl text-green-600">{countryData.isoCode}</span>
          </p>
        </div>

        {/* States/Provinces Grid */}
        {states.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">States & Provinces</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {states.map((stateName: string, index: number) => {
                const stateSlug = stateName.toLowerCase().replace(/\s+/g, '-');
                return (
                  <Link
                    key={stateName || index}
                    href={`/country/${country}/place/${stateSlug}`}
                    className="block p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all"
                  >
                    <p className="font-semibold text-gray-900">{stateName}</p>
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

export async function generateStaticParams() {
  // Generate pages for all countries
  return getAllCountries().map((country) => ({
    country: country.slug,
  }));
}
