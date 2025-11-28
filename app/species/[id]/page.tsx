import Link from "next/link";
import { getSpeciesWithCache } from "@/lib/speciesCache";
import { SpeciesGallery } from "./SpeciesGallery";

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
      
      <SpeciesGallery species={species} />

    </main>
  );
}
