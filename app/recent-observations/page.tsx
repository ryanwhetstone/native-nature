import { db } from "@/db";
import { observations } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";

export default async function RecentObservationsPage() {
  // Fetch recent observations with species and pictures
  const recentObservations = await db.query.observations.findMany({
    with: {
      species: true,
      pictures: true,
      user: true,
    },
    orderBy: [desc(observations.createdAt)],
    limit: 50,
  });

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Recent Observations</h1>
          <p className="mt-2 text-gray-600">
            Latest wildlife sightings from the community
          </p>
        </div>

        {/* Observations Grid */}
        {recentObservations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentObservations.map((observation) => (
              <div
                key={observation.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
              >
                <Link href={`/user/${observation.userId}/profile`}>
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
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No observations yet</h2>
            <p className="text-gray-600">
              Be the first to record a wildlife observation!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
