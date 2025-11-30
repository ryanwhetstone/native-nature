import Link from "next/link";
import { getSpeciesWithCache } from "@/lib/speciesCache";
import { SpeciesGallery } from "./SpeciesGallery";
import { FavoriteButton } from "@/app/components/FavoriteButton";

export default async function SpeciesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to states
          </Link>
          <FavoriteButton speciesId={parseInt(id)} />
        </div>
        
        <SpeciesGallery species={species} />
      </div>

    </main>
  );
}
