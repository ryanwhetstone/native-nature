import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { observations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { DeleteObservationButton } from "./DeleteObservationButton";

export default async function ObservationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Fetch all user's observations
  const userObservations = await db.query.observations.findMany({
    where: eq(observations.userId, session.user.id),
    with: {
      species: true,
      pictures: true,
    },
    orderBy: [desc(observations.createdAt)],
  });

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/account/dashboard"
            className="text-green-600 hover:text-green-700 font-medium mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">My Observations</h1>
          <p className="mt-2 text-gray-600">
            {userObservations.length} {userObservations.length === 1 ? 'observation' : 'observations'} recorded
          </p>
        </div>

        {/* Observations Grid */}
        {userObservations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userObservations.map((observation) => (
              <div
                key={observation.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group relative"
              >
                <Link
                  href={`/observation/${observation.id}`}
                >
                  <div className="relative aspect-video bg-gray-100">
                    {observation.pictures && observation.pictures.length > 0 ? (
                      <img
                        src={observation.pictures[0].imageUrl}
                        alt={observation.species.preferredCommonName || observation.species.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : observation.species.defaultPhotoUrl ? (
                      <img
                        src={observation.species.defaultPhotoUrl}
                        alt={observation.species.preferredCommonName || observation.species.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
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
                        <span className="mr-2">📅</span>
                        <span>Observed: {new Date(observation.observedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">📍</span>
                        <span className="line-clamp-1">
                          {observation.latitude}, {observation.longitude}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-400">
                        <span className="mr-2">🕐</span>
                        <span>Added: {new Date(observation.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="px-4 pb-4">
                  <DeleteObservationButton observationId={observation.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No observations yet</h2>
            <p className="text-gray-600 mb-6">
              Start recording species observations to build your nature journal!
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Explore Species
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
