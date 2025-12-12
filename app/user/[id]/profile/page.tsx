import { notFound } from "next/navigation";
import { db } from "@/db";
import { users, observations, favorites } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import MasonryPhotoGallery from "@/app/components/MasonryPhotoGallery";
import { getSpeciesUrl } from "@/lib/species-url";
import { getObservationUrl } from "@/lib/observation-url";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!user) {
    return {
      title: "User Not Found | Native Nature",
    };
  }

  const displayName = user.publicName || user.name || user.email;

  return {
    title: `${displayName} | Native Nature`,
    description: `View ${displayName}'s nature observations, favorite species, and contributions to the Native Nature community.`,
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch user data
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!user) {
    notFound();
  }

  // Fetch user's observations with photos
  const userObservations = await db.query.observations.findMany({
    where: eq(observations.userId, id),
    with: {
      species: true,
      pictures: true,
    },
    orderBy: [desc(observations.observedAt)],
  });

  // Fetch user's favorites
  const userFavorites = await db.query.favorites.findMany({
    where: eq(favorites.userId, id),
    with: {
      species: true,
    },
    orderBy: [desc(favorites.createdAt)],
  });

  // Get all observation photos for the gallery
  const observationPhotos = userObservations.flatMap((obs) =>
    obs.pictures.map((pic) => ({
      ...pic,
      observation: {
        id: obs.id,
        observedAt: obs.observedAt,
        user: {
          publicName: user.publicName,
          name: user.name,
        },
      },
      species: obs.species,
    }))
  );

  const displayName = user.publicName || user.name || 'Anonymous User';

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Dark section for profile and photos */}
      <div className="bg-slate-900 py-8">
        <div className="w-full px-4">
          {/* Profile Header */}
          <div className="max-w-7xl mx-auto p-8">
            <div className="flex items-center justify-start gap-6">
              {user.image && (
                <div className="relative w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={user.image}
                    alt={displayName}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {displayName}
                </h1>
                {user.bio && (
                  <p className="text-white mb-4">{user.bio}</p>
                )}
                <div className="flex gap-6 text-sm text-white">
                  <div>
                    <span className="font-semibold text-white">
                      {userObservations.length}
                    </span>{" "}
                    Observations
                  </div>
                  <div>
                    <span className="font-semibold text-white">
                      {observationPhotos.length}
                    </span>{" "}
                    Photos
                  </div>
                  <div>
                    <span className="font-semibold text-white">
                      {userFavorites.length}
                    </span>{" "}
                    Favorites
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Gallery */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Observation Photos</h2>
            {observationPhotos.length > 0 ? (
              <MasonryPhotoGallery photos={observationPhotos} />
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">📷</div>
                <p className="text-gray-600">No observation photos yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Light section for observations and favorites */}
      <div className="py-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">

        {/* Observations List */}
        <div className="mb-8 max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Observations</h2>
          {userObservations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userObservations.slice(0, 6).map((observation) => (
                <Link
                  key={observation.id}
                  href={getObservationUrl(observation.id, observation.species.name, observation.species.preferredCommonName)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
                >
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
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 mb-1">
                      {observation.species.preferredCommonName || observation.species.name}
                    </h3>
                    <p className="text-sm text-gray-500 italic mb-2">
                      {observation.species.name}
                    </p>
                    <div className="text-sm text-gray-600">
                      <p>📅 {new Date(observation.observedAt).toLocaleDateString()}</p>
                      <p className="line-clamp-1">
                        📍 {[observation.city, observation.region, observation.country].filter(Boolean).join(', ') || 'Location recorded'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📍</div>
              <p className="text-gray-600">No observations yet</p>
            </div>
          )}
        </div>

        {/* Favorites */}
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Favorite Species</h2>
          {userFavorites.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {userFavorites.map((favorite) => (
                <Link
                  key={favorite.id}
                  href={getSpeciesUrl(favorite.species.slug, favorite.species.name, favorite.species.preferredCommonName)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
                >
                  <div className="relative aspect-square bg-gray-100">
                    {favorite.species.defaultPhotoUrl ? (
                      <Image
                        src={favorite.species.defaultPhotoUrl}
                        alt={favorite.species.preferredCommonName || favorite.species.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🌿
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm text-gray-900 group-hover:text-green-600 line-clamp-2">
                      {favorite.species.preferredCommonName || favorite.species.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">⭐</div>
              <p className="text-gray-600">No favorite species yet</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </main>
  );
}
