import { notFound } from "next/navigation";
import { db } from "@/db";
import { users, favorites, observations, conservationProjects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { getSpeciesUrl } from "@/lib/species-url";
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
    title: `${displayName}'s Favorites | Native Nature`,
    description: `View favorite species by ${displayName}.`,
  };
}

export default async function UserFavoritesPage({
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

  // Fetch user's favorites
  const userFavorites = await db.query.favorites.findMany({
    where: eq(favorites.userId, id),
    with: {
      species: true,
    },
    orderBy: [desc(favorites.createdAt)],
  });

  // Fetch counts for nav
  const userObservations = await db.query.observations.findMany({
    where: eq(observations.userId, id),
    with: {
      pictures: true,
    },
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
        <div className="flex-gap-xs">
          <h1>{displayName}'s Favorite Species</h1>
          <p className="text-muted">
            {userFavorites.length} {userFavorites.length === 1 ? 'species' : 'species'}
          </p>
        </div>

        {userFavorites.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {userFavorites.map((favorite) => (
              <Link
                key={favorite.id}
                href={getSpeciesUrl(favorite.species.slug, favorite.species.name, favorite.species.preferredCommonName)}
                className="card-hover group"
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
                  <p className="font-medium text-small group-hover:text-green-600 line-clamp-2">
                    {favorite.species.preferredCommonName || favorite.species.name}
                  </p>
                  <p className="text-xs text-gray-500 italic line-clamp-1 mt-1">
                    {favorite.species.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="text-6xl mb-4">⭐</div>
            <p className="text-muted">No favorite species yet</p>
          </div>
        )}
      </div>
      </div>
    </main>
  );
}
