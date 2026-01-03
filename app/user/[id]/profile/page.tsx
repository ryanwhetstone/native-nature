import { notFound } from "next/navigation";
import { db } from "@/db";
import { users, observations, favorites, conservationProjects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import MasonryPhotoGallery from "@/app/components/MasonryPhotoGallery";
import { getSpeciesUrl } from "@/lib/species-url";
import { getObservationUrl } from "@/lib/observation-url";
import { getProjectUrl } from "@/lib/project-url";
import { Metadata } from "next";
import { UserProfileHeader } from "../components/UserProfileHeader";
import ShareButtons from "@/app/components/ShareButtons";

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

  // Fetch user's conservation projects
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
    orderBy: [desc(conservationProjects.createdAt)],
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

  // Get project photos (main project photos + update photos)
  const projectPhotos = userProjects.flatMap((proj) => {
    // Get main project photos
    const mainPhotos = proj.pictures.map((pic) => ({
      id: `project-${pic.id}`,
      imageUrl: pic.imageUrl,
      caption: pic.caption,
      createdAt: pic.createdAt,
      observation: {
        id: proj.id,
        observedAt: proj.createdAt,
        user: {
          publicName: user.publicName,
          name: user.name,
        },
      },
      species: {
        name: proj.title,
        preferredCommonName: null,
        slug: '',
      },
      projectId: proj.id,
      projectTitle: proj.title,
    }));

    // Get update photos
    const updatePhotos = proj.updates?.flatMap((update) =>
      update.pictures.map((pic) => ({
        id: `project-update-${pic.id}`,
        imageUrl: pic.imageUrl,
        caption: pic.caption,
        createdAt: pic.createdAt,
        observation: {
          id: proj.id,
          observedAt: update.createdAt,
          user: {
            publicName: user.publicName,
            name: user.name,
          },
        },
        species: {
          name: proj.title,
          preferredCommonName: null,
          slug: '',
        },
        projectId: proj.id,
        projectTitle: proj.title,
      }))
    ) || [];

    return [...mainPhotos, ...updatePhotos];
  });

  // Get species photos (favorited species with default photos)
  const speciesPhotos = userFavorites
    .filter((fav) => fav.species.defaultPhotoUrl)
    .map((fav) => ({
      id: `species-fav-${fav.id}`,
      imageUrl: fav.species.defaultPhotoUrl!,
      caption: fav.species.defaultPhotoAttribution || null,
      createdAt: fav.createdAt,
      species: {
        name: fav.species.name,
        preferredCommonName: fav.species.preferredCommonName,
        slug: fav.species.slug,
      },
    }));

  // Combine all photos, sort by date, and take first 12
  const allPhotosForGallery = [...observationPhotos, ...projectPhotos, ...speciesPhotos]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12);

  // Calculate total photo count (observation + project + project update photos)
  const projectPhotosCount = userProjects.reduce((count, proj) => {
    const mainPhotosCount = proj.pictures.length;
    const updatePhotosCount = proj.updates?.reduce((uCount, update) => uCount + update.pictures.length, 0) || 0;
    return count + mainPhotosCount + updatePhotosCount;
  }, 0);
  const totalPhotosCount = observationPhotos.length + projectPhotosCount;

  const displayName = user.publicName || user.name || 'Anonymous User';

  return (
    <>
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
      <div className="container-full bg-dark px-4 pt-0">

        {/* Photo Gallery */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h2 className="heading-3 text-white">Recent Photos</h2>
            {totalPhotosCount > 12 && (
              <Link
                href={`/user/${id}/photos`}
                className="text-white hover:text-gray-300 text-sm font-medium"
              >
                View All ({totalPhotosCount})
              </Link>
            )}
          </div>
          {allPhotosForGallery.length > 0 ? (
            <MasonryPhotoGallery photos={allPhotosForGallery} showTypeBadges={true} />
          ) : (
            <div className="empty-state">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-muted">No photos yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Light section for observations and favorites */}
      <div className="section bg-light">
        <div className="container-lg">

          {/* Observations List */}
          <div className="flex items-center justify-between">
            <h2 className="heading-3">Recent Observations</h2>
            <div className="flex items-center gap-3">
              {userObservations.length > 4 && (
                <Link
                  href={`/user/${id}/observations`}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  View All ({userObservations.length})
                </Link>
              )}
            </div>
          </div>
          {userObservations.length > 0 ? (
            <div className="grid-4">
              {userObservations.slice(0, 4).map((observation) => (
                <Link
                  key={observation.id}
                  href={getObservationUrl(observation.id, observation.species.name, observation.species.preferredCommonName)}
                  className="card-hover group"
                >
                  <div className="relative aspect-video bg-gray-100 overflow-hidden">
                    {observation.pictures && observation.pictures.length > 0 ? (
                      <Image
                        src={observation.pictures[0].imageUrl}
                        alt={observation.species.preferredCommonName || observation.species.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform"
                      />
                    ) : observation.species.defaultPhotoUrl ? (
                      <Image
                        src={observation.species.defaultPhotoUrl}
                        alt={observation.species.preferredCommonName || observation.species.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        🌿
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
      <div className="section bg-light">
        <div className="container-lg">

          {/* Conservation Projects - Moved above Favorites */}
          <div className="flex items-center justify-between">
            <h2 className="heading-3">Conservation Projects</h2>
            {userProjects.length > 6 && (
              <Link
                href={`/user/${id}/projects`}
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                View All ({userProjects.length})
              </Link>
            )}
          </div>
          {userProjects.length > 0 ? (
            <div className="grid-3">
              {userProjects.slice(0, 6).map((project) => {
                const fundingPercentage = (project.currentFunding / project.fundingGoal) * 100;
                const mainImage = project.pictures[0]?.imageUrl;

                return (
                  <Link
                    key={project.id}
                    href={getProjectUrl(project.id, project.title)}
                    className="card-hover group"
                  >
                    {/* Project Image */}
                    {mainImage ? (
                      <div className="relative h-48 bg-gray-200 overflow-hidden">
                        <Image
                          src={mainImage}
                          alt={project.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                        <span className="text-6xl">🌍</span>
                      </div>
                    )}

                    {/* Project Info */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="heading-4 group-hover:text-green-600 line-clamp-2">
                          {project.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ml-2 ${project.status === 'active' ? 'bg-green-100 text-green-800' :
                            project.status === 'funded' ? 'bg-blue-100 text-blue-800' :
                              project.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                          }`}>
                          {project.status}
                        </span>
                      </div>

                      <p className="text-small mb-4 line-clamp-2">
                        {project.description}
                      </p>

                      {/* Location */}
                      <div className="flex items-center text-small text-gray-500 mb-4">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {[project.city, project.region, project.country].filter(Boolean).join(', ') || 'Location not specified'}
                      </div>

                      {/* Funding Progress */}
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted">Funding</span>
                          <span className="font-semibold text-gray-900">
                            ${(project.currentFunding / 100).toLocaleString()} / ${(project.fundingGoal / 100).toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="text-6xl mb-4">🌍</div>
              <p className="text-muted">No conservation projects yet</p>
            </div>
          )}
        </div>
      </div>
      <div className="section bg-light">
        <div className="container-lg">

          {/* Favorites */}
          <div className="flex items-center justify-between">
            <h2 className="heading-3">Favorite Species</h2>
            {userFavorites.length > 5 && (
              <Link
                href={`/user/${id}/favorites`}
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                View All ({userFavorites.length})
              </Link>
            )}
          </div>
          {userFavorites.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {userFavorites.slice(0, 5).map((favorite) => (
                <Link
                  key={favorite.id}
                  href={getSpeciesUrl(favorite.species.slug, favorite.species.name, favorite.species.preferredCommonName)}
                  className="card-hover group"
                >
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    {favorite.species.defaultPhotoUrl ? (
                      <Image
                        src={favorite.species.defaultPhotoUrl}
                        alt={favorite.species.preferredCommonName || favorite.species.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform"
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
      
      {/* Share Buttons */}
      <ShareButtons
        title={`${displayName}'s Profile`}
        description={`View ${displayName}'s nature observations and contributions on Native Nature`}
        type="Share Profile"
      />
    
      </>
  );
}
