import Link from "next/link";

// Map state names to iNaturalist place IDs
const stateToPlaceId: Record<string, number> = {
  "alabama": 19,
  "alaska": 6,
  "arizona": 40,
  "arkansas": 36,
  "california": 14,
  "colorado": 34,
  "connecticut": 49,
  "delaware": 4,
  "florida": 21,
  "georgia": 23,
  "hawaii": 11,
  "idaho": 22,
  "illinois": 35,
  "indiana": 20,
  "iowa": 24,
  "kansas": 25,
  "kentucky": 26,
  "louisiana": 27,
  "maine": 17,
  "maryland": 39,
  "massachusetts": 2,
  "michigan": 29,
  "minnesota": 38,
  "mississippi": 37,
  "missouri": 28,
  "montana": 16,
  "nebraska": 3,
  "nevada": 50,
  "new-hampshire": 41,
  "new-jersey": 51,
  "new-mexico": 9,
  "new-york": 48,
  "north-carolina": 30,
  "north-dakota": 13,
  "ohio": 31,
  "oklahoma": 12,
  "oregon": 10,
  "pennsylvania": 42,
  "rhode-island": 8,
  "south-carolina": 43,
  "south-dakota": 44,
  "tennessee": 45,
  "texas": 18,
  "utah": 52,
  "vermont": 47,
  "virginia": 7,
  "washington": 46,
  "west-virginia": 33,
  "wisconsin": 32,
  "wyoming": 15,
};

export default async function StatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  
  // Convert URL slug back to readable state name
  const stateName = state
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const placeId = stateToPlaceId[state];

  return (
    <main className="min-h-screen p-8">
      <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to all states
      </Link>
      <h1 className="text-4xl font-bold mb-8">{stateName}</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
        <Link
          href={`/states/${state}/plants`}
          className="p-8 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center group"
        >
          <div className="text-6xl mb-4">🌿</div>
          <h2 className="text-2xl font-bold text-gray-800 group-hover:text-green-700">Plants</h2>
          <p className="text-gray-600 mt-2">Explore native and invasive plant species</p>
        </Link>

        <Link
          href={`/states/${state}/conifers`}
          className="p-8 border-2 border-gray-300 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all text-center group"
        >
          <div className="text-6xl mb-4">🌲</div>
          <h2 className="text-2xl font-bold text-gray-800 group-hover:text-green-700">Conifers</h2>
          <p className="text-gray-600 mt-2">Discover evergreen and coniferous trees</p>
        </Link>

        <Link
          href={`/states/${state}/deciduous`}
          className="p-8 border-2 border-gray-300 rounded-lg hover:border-amber-600 hover:bg-amber-50 transition-all text-center group"
        >
          <div className="text-6xl mb-4">🍂</div>
          <h2 className="text-2xl font-bold text-gray-800 group-hover:text-amber-700">Deciduous Trees</h2>
          <p className="text-gray-600 mt-2">Explore oaks, maples, and other deciduous trees</p>
        </Link>

        <Link
          href={`/states/${state}/fish`}
          className="p-8 border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-center group"
        >
          <div className="text-6xl mb-4">🐟</div>
          <h2 className="text-2xl font-bold text-gray-800 group-hover:text-blue-700">Fish</h2>
          <p className="text-gray-600 mt-2">Discover freshwater and marine fish species</p>
        </Link>

        <Link
          href={`/states/${state}/birds`}
          className="p-8 border-2 border-gray-300 rounded-lg hover:border-sky-600 hover:bg-sky-50 transition-all text-center group"
        >
          <div className="text-6xl mb-4">🦅</div>
          <h2 className="text-2xl font-bold text-gray-800 group-hover:text-sky-700">Birds</h2>
          <p className="text-gray-600 mt-2">Discover native and migratory bird species</p>
        </Link>

        <Link
          href={`/states/${state}/mammals`}
          className="p-8 border-2 border-gray-300 rounded-lg hover:border-orange-600 hover:bg-orange-50 transition-all text-center group"
        >
          <div className="text-6xl mb-4">🦌</div>
          <h2 className="text-2xl font-bold text-gray-800 group-hover:text-orange-700">Mammals</h2>
          <p className="text-gray-600 mt-2">Discover native and invasive mammal species</p>
        </Link>
      </div>
    </main>
  );
}
