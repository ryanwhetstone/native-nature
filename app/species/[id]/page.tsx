import { getSpeciesBySlug } from "@/db/queries";
import { SpeciesGallery } from "./SpeciesGallery";
import { FavoriteButton } from "@/app/components/FavoriteButton";
import { AddObservationButton } from "@/app/components/AddObservationButton";
import { BackButton } from "./BackButton";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: slug } = await params;
  const species = await getSpeciesBySlug(slug);

  if (!species) {
    return {
      title: "Species Not Found | Native Nature",
    };
  }

  const title = species.preferredCommonName || species.name;
  return {
    title: `${title} | Native Nature`,
    description: species.wikipediaSummary 
      ? species.wikipediaSummary.substring(0, 160) 
      : `Learn about ${title}, including photos, taxonomy, and observations.`,
  };
}

export default async function SpeciesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;
  
  const species = await getSpeciesBySlug(slug);

  if (!species) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <p className="text-gray-600">Species not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <SpeciesGallery species={species} slug={slug} />
    </main>
  );
}
