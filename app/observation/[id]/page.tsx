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
    <main className="min-h-screen bg-gray-50">
      {/* Dark section for header and photos */}
      <div className="bg-slate-900 py-8">
        <div className="w-full px-4">
          {/* Header */}
          <div className="max-w-7xl mx-auto mb-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-semibold text-white">
                  {observation.species.preferredCommonName || observation.species.name}
                </h1>
                {observation.species.preferredCommonName && (
                  <p className="text-gray-400 italic mt-2 text-lg">
                    {observation.species.name}
                  </p>
                )}
                <div className="flex items-center gap-6 mt-6 text-sm text-gray-300">
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
                <div className="mt-4">
                  <Link
                    href={getSpeciesUrl(observation.species.slug, observation.species.name, observation.species.preferredCommonName)}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                  >
                    <span className="mr-2">🔍</span>
                    View Species Details
                  </Link>
                </div>
                {observation.description && (
                  <div className="mt-6 text-gray-300">
                    <p className="whitespace-pre-wrap">{observation.description}</p>
                  </div>
                )}
              </div>
              {isOwner && (
                <div className="flex-shrink-0 flex gap-2">
                  <Link
                    href={`/observation/${observation.id}/edit`}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Edit
                  </Link>
                  <DeleteObservationButton observationId={observation.id} />
                </div>
              )}
            </div>
          </div>

          {/* Photos */}
          {observation.pictures.length > 0 && (
            <div className="mb-8">
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
              />
            </div>
          )}
        </div>
      </div>

      {/* Light section for location */}
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Location */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-semibold mr-8">Location</h2>
            {(observation.city || observation.region || observation.country) && (
              <p className="text-gray-600">
                {[observation.city, observation.region, observation.country].filter(Boolean).join(', ')}
              </p>
            )}
              <p>
                <span className="text-gray-600 w-32 flex-shrink-0">Coordinates:</span>
              <span className="text-gray-600">
                {parseFloat(observation.latitude).toFixed(6)}, {parseFloat(observation.longitude).toFixed(6)}
              </span>
              </p>

          </div>
          
          {/* Map */}
          <div className="mt-4">
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
