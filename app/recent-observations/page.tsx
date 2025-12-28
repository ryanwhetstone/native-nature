import { db } from "@/db";
import { observations } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import MasonryPhotoGallery from "@/app/components/MasonryPhotoGallery";
import { getObservationUrl } from "@/lib/observation-url";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recent Observations | Native Nature",
  description: "Explore the latest wildlife and nature observations from our global community. View recent sightings, photos, and discoveries from around the world.",
};

export default async function RecentObservationsPage() {
  // Fetch recent observations with species and pictures
  const allObservations = await db.query.observations.findMany({
    with: {
      species: true,
      pictures: true,
      user: true,
    },
    orderBy: [desc(observations.createdAt)],
    limit: 100, // Get more to filter for approved
  });

  // Filter to only observations where ALL pictures are approved
  const recentObservations = allObservations.filter(obs => 
    obs.pictures.length > 0 && 
    obs.pictures.every(pic => pic.approved === true)
  ).slice(0, 50);

  // Get all observation photos for the masonry gallery
  const allPhotos = recentObservations.flatMap((obs) =>
    obs.pictures.map((pic) => ({
      ...pic,
      observation: {
        id: obs.id,
        observedAt: obs.observedAt,
        user: {
          publicName: obs.user.publicName,
          name: obs.user.name,
        },
      },
      species: obs.species,
    }))
  );

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Dark section for header and photo gallery */}
      <div className="bg-slate-900 py-8">
        <div className="w-full px-4">
          {/* Header */}
          <div className="max-w-7xl mx-auto mb-8">
            <h1 className="text-3xl font-semibold text-white">Recent Observations</h1>
            <p className="mt-2 text-gray-300">
              Latest wildlife sightings from the community
            </p>
          </div>

          {/* Photo Gallery */}
          {allPhotos.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Recent Photos</h2>
              <MasonryPhotoGallery photos={allPhotos} />
            </div>
          )}
        </div>
      </div>

      {/* Light section for observations list */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Observations List Header */}
          <div className="mb-6">
            <h2 className="heading-3">All Observations</h2>
          </div>

          {/* Observations Grid */}
        {recentObservations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentObservations.map((observation) => (
              <div
                key={observation.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
              >
                <Link href={getObservationUrl(observation.id, observation.species.name, observation.species.preferredCommonName)}>
                  <div className="relative aspect-video bg-gray-100">
                    {observation.pictures && observation.pictures.length > 0 ? (
                      <Image
                        src={observation.pictures[0].imageUrl}
                        alt={observation.species.preferredCommonName || observation.species.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : observation.species.defaultPhotoUrl ? (
                      <Image
                        src={observation.species.defaultPhotoUrl}
                        alt={observation.species.preferredCommonName || observation.species.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        🌿
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md">
                      <span className="text-xl">📍</span>
                    </div>
                    {observation.pictures && observation.pictures.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        +{observation.pictures.length - 1} more
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 mb-1">
                      {observation.species.preferredCommonName || observation.species.name}
                    </h3>
                    <p className="text-sm text-gray-500 italic mb-3">
                      {observation.species.name}
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="mr-2">👤</span>
                        <span>{observation.user.publicName || observation.user.name || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">📅</span>
                        <span>Observed: {new Date(observation.observedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">📍</span>
                        <span className="line-clamp-1">
                          {[observation.city, observation.region, observation.country].filter(Boolean).join(', ') || 'Location recorded'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="text-6xl mb-4">📍</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No observations yet</h2>
            <p className="text-muted">
              Be the first to record a wildlife observation!
            </p>
          </div>
        )}
        </div>
      </div>
    </main>
  );
}
