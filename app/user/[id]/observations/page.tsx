import { notFound } from "next/navigation";
import { db } from "@/db";
import { users, observations, favorites, conservationProjects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { getObservationUrl } from "@/lib/observation-url";
import { Metadata } from "next";
import { UserProfileHeader } from "../components/UserProfileHeader";

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
    title: `${displayName}'s Observations | Native Nature`,
    description: `View all nature observations by ${displayName}.`,
  };
}

export default async function UserObservationsPage({
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

  // Fetch user's observations
  const userObservations = await db.query.observations.findMany({
    where: eq(observations.userId, id),
    with: {
      species: true,
      pictures: true,
    },
    orderBy: [desc(observations.observedAt)],
  });

  // Fetch counts for nav
  const userFavorites = await db.query.favorites.findMany({
    where: eq(favorites.userId, id),
  });

  const userProjects = await db.query.conservationProjects.findMany({
    where: eq(conservationProjects.userId, id),
    with: {
      pictures: true,
      updates: {
        with: {
          pictures: true,
        },
      },
    },
  });

  const observationPhotos = userObservations.flatMap((obs) => obs.pictures);

  // Calculate total photo count (observation + project + project update photos)
  const projectPhotosCount = userProjects.reduce((count, proj) => {
    const mainPhotosCount = proj.pictures?.length || 0;
    const updatePhotosCount = proj.updates?.reduce((uCount, update) => uCount + (update.pictures?.length || 0), 0) || 0;
    return count + mainPhotosCount + updatePhotosCount;
  }, 0);
  const totalPhotosCount = observationPhotos.length + projectPhotosCount;

  const displayName = user.publicName || user.name || 'Anonymous User';

  return (
    <main className="min-h-screen bg-light">
      <UserProfileHeader
        userId={id}
        displayName={displayName}
        userImage={user.image}
        userBio={user.bio}
        observationsCount={userObservations.length}
        photosCount={totalPhotosCount}
        projectsCount={userProjects.length}
        favoritesCount={userFavorites.length}
      />
      <div className="section bg-light">

        <div className="container-lg">
          {/* Header */}
          <div className="flex-gap-xs">
            <div className="flex items-center justify-between">
              <div>
                <h1>{displayName}&apos;s Observations</h1>
                <p className="text-muted">
                  {userObservations.length} {userObservations.length === 1 ? 'observation' : 'observations'} recorded
                </p>
              </div>
              <Link
                href={`/user/${id}/list`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                List View
              </Link>
            </div>
          </div>

          {/* Observations Grid */}
          {userObservations.length > 0 ? (
            <div className="grid-4">
              {userObservations.map((observation) => (
                <Link
                  key={observation.id}
                  href={getObservationUrl(observation.id, observation.species.name, observation.species.preferredCommonName)}
                  className="card-hover group"
                >
                  <div className="relative aspect-video bg-gray-100">
                    {observation.pictures && observation.pictures.length > 0 ? (
                      <Image
                        src={observation.pictures[0].imageUrl}
                        alt={observation.species.preferredCommonName || observation.species.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : observation.species.defaultPhotoUrl ? (
                      <Image
                        src={observation.species.defaultPhotoUrl}
                        alt={observation.species.preferredCommonName || observation.species.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        🌿
                      </div>
                    )}
                    {observation.pictures && observation.pictures.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        +{observation.pictures.length - 1}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="heading-4 group-hover:text-green-600 mb-1">
                      {observation.species.preferredCommonName || observation.species.name}
                    </h3>
                    <p className="text-small italic mb-2">
                      {observation.species.name}
                    </p>
                    <div className="text-small">
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
            <div className="empty-state">
              <div className="text-6xl mb-4">📍</div>
              <p className="text-muted">No observations yet</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
