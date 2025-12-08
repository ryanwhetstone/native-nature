import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { observations } from "@/db/schema";
import { eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { DeleteObservationButton } from "@/app/account/observations/DeleteObservationButton";
import ObservationMap from "./ObservationMap";

export default async function ObservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const observation = await db.query.observations.findFirst({
    where: eq(observations.id, parseInt(id)),
    with: {
      species: true,
      pictures: true,
    },
  });

  if (!observation) {
    notFound();
  }

  // Check if user owns this observation
  const isOwner = observation.userId === session.user.id;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Link
                href={`/species/${observation.species.taxonId}`}
                className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {observation.species.preferredCommonName || observation.species.name}
              </Link>
              {observation.species.preferredCommonName && (
                <p className="text-gray-500 italic mt-1">
                  {observation.species.name}
                </p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="mr-2">📅</span>
                  <span>Observed: {new Date(observation.observedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">🕐</span>
                  <span>Added: {new Date(observation.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            {isOwner && (
              <div className="flex-shrink-0 flex gap-2">
                <Link
                  href={`/observation/${observation.id}/edit`}
                  className="px-4 py-2 bg-blue-50 text-blue-600 text-sm rounded-md hover:bg-blue-100 transition-colors whitespace-nowrap"
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
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Photos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {observation.pictures.map((picture) => (
                <div key={picture.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={picture.imageUrl}
                    alt={picture.caption || "Observation photo"}
                    fill
                    className="object-cover"
                  />
                  {picture.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-sm p-2">
                      {picture.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/account/observations"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Back to My Observations
          </Link>
        </div>
      </div>
    </div>
  );
}
