import { getSpeciesWithCache } from "@/lib/speciesCache";
import { SpeciesGallery } from "./SpeciesGallery";
import { FavoriteButton } from "@/app/components/FavoriteButton";
import { BackButton } from "./BackButton";

export default async function SpeciesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;
  
  // Extract the numeric ID from the slug (format: "42223-white-tailed-deer")
  const id = slug.split('-')[0];
  const species = await getSpeciesWithCache(id);

  if (!species) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <p className="text-gray-600">Species not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <BackButton />
          <FavoriteButton speciesId={parseInt(id)} showLabel={true} />
        </div>
        
        <SpeciesGallery species={species} />
      </div>

    </main>
  );
}
