import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { observations } from "@/db/schema";
import { eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { DeleteObservationButton } from "@/app/account/observations/DeleteObservationButton";
import ObservationMap from "./ObservationMap";
import MasonryPhotoGallery from "@/app/components/MasonryPhotoGallery";
import { getSpeciesUrl } from "@/lib/species-url";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const observation = await db.query.observations.findFirst({
    where: eq(observations.id, parseInt(id)),
    with: {
      species: true,
      user: true,
    },
  });

  if (!observation) {
    return {
      title: "Observation Not Found | Native Nature",
    };
  }

  const speciesName = observation.species.preferredCommonName || observation.species.name;
  const userName = observation.user.publicName || observation.user.name || 'Anonymous';

  return {
    title: `${speciesName} Observation | Native Nature`,
    description: `${speciesName} observed by ${userName} on ${new Date(observation.observedAt).toLocaleDateString()}`,
  };
}

export default async function ObservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const observation = await db.query.observations.findFirst({
    where: eq(observations.id, parseInt(id)),
    with: {
      species: true,
      pictures: true,
      user: true,
    },
  });

  if (!observation) {
    notFound();
  }

  // Check if user owns this observation
  const isOwner = session?.user && observation.userId === session.user.id;

  return (
    <main className="min-h-screen">
      {/* Dark section for header and photos */}
      <div className="section bg-dark px-4">
        <div className="container-md">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-gap-xs">
              <h1 className="text-white">
                {observation.species.preferredCommonName || observation.species.name}
              </h1>
              {observation.species.preferredCommonName && (
                <p className="text-gray-400 italic text-lg">
                  {observation.species.name}
                </p>
              )}
              <div className="flex items-center gap-6 text-sm text-gray-300">
                <div className="flex items-center">
                  <span className="mr-2">👤</span>
                  <span>Observed by{" "}
                    <Link
                      href={`/user/${observation.user.id}/profile`}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {observation.user.publicName || observation.user.name || 'Anonymous'}
                    </Link>
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">📅</span>
                  <span>{new Date(observation.observedAt).toLocaleDateString()}</span>
                </div>
              </div>
              {observation.description && (
                  <p className="mt-3 sm:mt-4 text-white">{observation.description}</p>
              )}
            </div>
            <div className="flex-shrink-0 flex gap-2">
              <Link
                href={getSpeciesUrl(observation.species.slug, observation.species.name, observation.species.preferredCommonName)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
              >
                <span className="mr-2">🔍</span>
                View Species Details
              </Link>
              {isOwner && (
                <div className="flex-shrink-0 flex gap-2">
                  <Link
                    href={`/observation/${observation.id}/edit`}
                    className="btn-blue"
                  >
                    Edit
                  </Link>
                  <DeleteObservationButton observationId={observation.id} />
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
        {/* Photos */}
        {observation.pictures.length > 0 && (
          <div className="section bg-dark px-4 pt-0">

            <MasonryPhotoGallery
              photos={observation.pictures.map(pic => ({
                ...pic,
                observation: {
                  id: observation.id,
                  observedAt: observation.observedAt,
                  user: {
                    publicName: observation.user.publicName,
                    name: observation.user.name,
                  },
                },
                species: observation.species,
              }))}
              columns={{ default: 1, md: 2, lg: 3 }}
              currentObservationId={observation.id}
            />
            </div>
        )}

      {/* Light section for location */}
      <div className="section bg-light">
        <div className="container-sm">
          {/* Location */}
          <div className="section-card">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold mr-8">Location</h2>
              {(observation.city || observation.region || observation.country) && (
                <p className="text-muted">
                  {[observation.city, observation.region, observation.country].filter(Boolean).join(', ')}
                </p>
              )}
              <p>
                <span className="text-gray-600 w-32 flex-shrink-0">Coordinates:</span>
                <span className="text-muted">
                  {parseFloat(observation.latitude).toFixed(6)}, {parseFloat(observation.longitude).toFixed(6)}
                </span>
              </p>

            </div>

            {/* Map */}
            <div className="">
              <ObservationMap
                longitude={parseFloat(observation.longitude)}
                latitude={parseFloat(observation.latitude)}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
