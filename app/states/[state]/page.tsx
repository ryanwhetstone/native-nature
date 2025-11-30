import Link from "next/link";
import { stateToPlaceId } from "./stateMapping";
import { categoryMapping } from "./categoryMapping";

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
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to all states
        </Link>
        <h1 className="text-4xl font-bold mb-8">{stateName}</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(categoryMapping).map(([slug, info]) => {
          return (
            <Link
              key={slug}
              href={`/states/${state}/${slug}`}
              className={`p-8 border-2 border-gray-300 rounded-lg ${info.colors.hover} transition-all text-center group`}
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
