import Link from "next/link";
import { getSpeciesWithCache } from "@/lib/speciesCache";

export default async function SpeciesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const species = await getSpeciesWithCache(id);

  if (!species) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-gray-600">Species not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to states
      </Link>
      
      <div className="max-w-4xl mx-auto">
        {species.default_photo && (
          <div className="mb-8">
            <img
              src={species.default_photo.medium_url}
              alt={species.preferred_common_name || species.name}
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
            <p className="text-xs text-gray-500 mt-2">
              Photo: {species.default_photo.attribution} ({species.default_photo.license_code})
            </p>
          </div>
        )}

        <h1 className="text-4xl font-bold mb-2">
          {species.preferred_common_name || species.name}
        </h1>
        <p className="text-2xl text-gray-600 italic mb-4">{species.name}</p>
        
        <div className="mb-6">
          <div className="text-sm text-gray-600 flex flex-wrap gap-1">
            {species.kingdom && <><span className="font-medium">Kingdom:</span> <span>{species.kingdom}</span> <span className="mx-1">›</span></>}
            {species.phylum && <><span className="font-medium">Phylum:</span> <span>{species.phylum}</span> <span className="mx-1">›</span></>}
            {species.class && <><span className="font-medium">Class:</span> <span>{species.class}</span> <span className="mx-1">›</span></>}
            {species.order && <><span className="font-medium">Order:</span> <span>{species.order}</span> <span className="mx-1">›</span></>}
            {species.family && <><span className="font-medium">Family:</span> <span>{species.family}</span> <span className="mx-1">›</span></>}
            {species.genus && <><span className="font-medium">Genus:</span> <span>{species.genus}</span></>}
          </div>
        </div>
        
        <div className="flex gap-4 mb-6 text-sm">
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
            {species.observations_count.toLocaleString()} observations
          </span>
          {species.conservation_status && (
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
              {species.conservation_status.status_name}
            </span>
          )}
        </div>

        {species.wikipedia_summary && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-3">About</h2>
            <div 
              className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: species.wikipedia_summary }}
            />
          </div>
        )}

        {species.wikipedia_url && (
          <div className="mb-6">
            <a
              href={species.wikipedia_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View on Wikipedia →
            </a>
          </div>
        )}

        {species.taxon_photos && species.taxon_photos.length > 1 && (
          <div>
            <h2 className="text-2xl font-semibold mb-3">More Photos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {species.taxon_photos.slice(0, 6).map((item, index) => (
                <div key={index} className="rounded-lg overflow-hidden">
                  <img
                    src={item.photo.medium_url}
                    alt={`${species.preferred_common_name || species.name} photo ${index + 1}`}
                    className="w-full h-48 object-cover"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {item.photo.attribution}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
