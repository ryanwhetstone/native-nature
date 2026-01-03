import { auth } from "@/auth";
import { db } from "@/db";
import { users, favorites, observations, conservationProjects, observationPictures, projectPictures, projectUpdatePictures, projectUpdates } from "@/db/schema";
import { eq, count, desc, sql } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { getSpeciesUrl } from "@/lib/species-url";
import { getObservationUrl } from "@/lib/observation-url";
import { getProjectUrl } from "@/lib/project-url";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Dashboard | Native Nature',
  description: 'Your Native Nature dashboard with favorites, observations, and nature exploration.',
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Fetch user data
  const userData = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!userData) {
    redirect("/auth/signin");
  }

  // Get total count of favorites
  const favoritesCountResult = await db
    .select({ count: count() })
    .from(favorites)
    .where(eq(favorites.userId, session.user.id));
  
  const favoritesCount = favoritesCountResult[0]?.count || 0;

  // Get total count of observations
  const observationsCountResult = await db
    .select({ count: count() })
    .from(observations)
    .where(eq(observations.userId, session.user.id));
  
  const observationsCount = observationsCountResult[0]?.count || 0;

  // Get total count of projects
  const projectsCountResult = await db
    .select({ count: count() })
    .from(conservationProjects)
    .where(eq(conservationProjects.userId, session.user.id));
  
  const projectsCount = projectsCountResult[0]?.count || 0;

  // Get unique species count from user's observations
  const speciesCountResult = await db
    .selectDistinct({ speciesId: observations.speciesId })
    .from(observations)
    .where(eq(observations.userId, session.user.id));
  
  const speciesCount = speciesCountResult.length;

  // Count all photos from user's observations and projects
  const [obsPhotosCount] = await db
    .select({ count: count() })
    .from(observationPictures)
    .innerJoin(observations, eq(observationPictures.observationId, observations.id))
    .where(eq(observations.userId, session.user.id));

  const [projPhotosCount] = await db
    .select({ count: count() })
    .from(projectPictures)
    .innerJoin(conservationProjects, eq(projectPictures.projectId, conservationProjects.id))
    .where(eq(conservationProjects.userId, session.user.id));

  const [updatePhotosCount] = await db
    .select({ count: count() })
    .from(projectUpdatePictures)
    .innerJoin(projectUpdates, eq(projectUpdatePictures.updateId, projectUpdates.id))
    .innerJoin(conservationProjects, eq(projectUpdates.projectId, conservationProjects.id))
    .where(eq(conservationProjects.userId, session.user.id));

  const totalPhotosCount = (obsPhotosCount?.count || 0) + (projPhotosCount?.count || 0) + (updatePhotosCount?.count || 0);

  // Fetch user's favorite species (limited to 6 for display)
  const userFavorites = await db.query.favorites.findMany({
    where: eq(favorites.userId, session.user.id),
    with: {
      species: true,
    },
    orderBy: (favorites, { desc }) => [desc(favorites.createdAt)],
    limit: 6,
  });

  // Fetch user's recent observations (limited to 6 for display)
  const userObservations = await db.query.observations.findMany({
    where: eq(observations.userId, session.user.id),
    with: {
      species: true,
      pictures: true,
    },
    orderBy: (observations, { desc }) => [desc(observations.createdAt)],
    limit: 6,
  });

  // Fetch user's conservation projects (limited to 6 for display)
  const userProjects = await db.query.conservationProjects.findMany({
    where: eq(conservationProjects.userId, session.user.id),
    with: {
      pictures: true,
    },
    orderBy: (conservationProjects, { desc }) => [desc(conservationProjects.createdAt)],
    limit: 6,
  });

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">
            Welcome back, {userData.name || "there"}!
          </h1>
          <p className="mt-2 text-gray-600">Here&apos;s what&apos;s happening with your nature exploration</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/account/projects" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small">Conservation Projects</p>
                <p className="text-3xl font-semibold text-gray-900">{projectsCount}</p>
              </div>
              <div className="text-4xl">🌍</div>
            </div>
          </Link>

          <Link href="/account/observations" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small">Observations</p>
                <p className="text-3xl font-semibold text-gray-900">{observationsCount}</p>
              </div>
              <div className="text-4xl">📍</div>
            </div>
          </Link>

          <Link href="/account/favorites" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small">Favorited Species</p>
                <p className="text-3xl font-semibold text-gray-900">{speciesCount}</p>
              </div>
              <div className="text-4xl">🦋</div>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small">Photos</p>
                <p className="text-3xl font-semibold text-gray-900">{totalPhotosCount}</p>
              </div>
              <div className="text-4xl">📷</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="heading-4">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            <Link
              href={`/user/${session.user.id}/profile`}
              className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="text-3xl">👤</div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-green-600">View Profile</h3>
                <p className="text-small">See your public profile</p>
              </div>
            </Link>
            <Link
              href="/account/settings"
              className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="text-3xl">⚙️</div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-green-600">Settings</h3>
                <p className="text-small">Manage your account</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Favorite Species */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="heading-4">Favorite Species</h2>
              {favoritesCount > 0 && (
                <Link href="/account/favorites" className="text-sm text-green-600 hover:text-green-700 font-medium">
                  View All
                </Link>
              )}
            </div>
          </div>
          <div className="p-6">
            {userFavorites.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {userFavorites.map((favorite) => (
                  <Link
                    key={favorite.id}
                    href={getSpeciesUrl(favorite.species.slug, favorite.species.name, favorite.species.preferredCommonName)}
                    className="group"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                      {favorite.species.defaultPhotoUrl ? (
                        <Image
                          src={favorite.species.defaultPhotoUrl}
                          alt={favorite.species.preferredCommonName || favorite.species.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          🌿
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="text-xl">❤️</span>
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-green-600 line-clamp-2">
                      {favorite.species.preferredCommonName || favorite.species.name}
                    </h3>
                    <p className="text-xs text-gray-500 italic line-clamp-1">
                      {favorite.species.name}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-4">⭐</div>
                <p className="text-lg font-medium">No favorites yet</p>
                <p className="mt-2">Start favoriting species to see them here!</p>
                <Link
                  href="/"
                  className="mt-6 inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  Explore Species
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Observations */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="heading-4">Recent Observations</h2>
              {observationsCount > 0 && (
                <Link href="/account/observations" className="text-sm text-green-600 hover:text-green-700 font-medium">
                  View All
                </Link>
              )}
            </div>
          </div>
          <div className="p-6">
            {userObservations.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {userObservations.map((observation) => (
                  <Link
                    key={observation.id}
                    href={getObservationUrl(
                      observation.id,
                      observation.species.name,
                      observation.species.preferredCommonName
                    )}
                    className="group"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                      {observation.pictures && observation.pictures.length > 0 ? (
                        <Image
                          src={observation.pictures[0].imageUrl}
                          alt={observation.species.preferredCommonName || observation.species.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                      ) : observation.species.defaultPhotoUrl ? (
                        <Image
                          src={observation.species.defaultPhotoUrl}
                          alt={observation.species.preferredCommonName || observation.species.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          🌿
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="text-xl">📍</span>
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-green-600 line-clamp-2">
                      {observation.species.preferredCommonName || observation.species.name}
                    </h3>
                    <p className="text-tiny">
                      {new Date(observation.observedAt).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-4">📍</div>
                <p className="text-lg font-medium">No observations yet</p>
                <p className="mt-2">Start recording species observations to see them here!</p>
                <Link
                  href="/"
                  className="mt-6 inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  Explore Species
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Conservation Projects */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="heading-4">Conservation Projects</h2>
              {projectsCount > 0 && (
                <Link href="/account/projects" className="text-sm text-green-600 hover:text-green-700 font-medium">
                  View All
                </Link>
              )}
            </div>
          </div>
          <div className="p-6">
            {userProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={getProjectUrl(project.id, project.title)}
                    className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-video bg-gray-100">
                      {project.pictures && project.pictures.length > 0 ? (
                        <Image
                          src={project.pictures[0].imageUrl}
                          alt={project.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          🌍
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                            project.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : project.status === 'funded'
                              ? 'bg-blue-100 text-blue-800'
                              : project.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 mb-2 line-clamp-2">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                        📍 {[project.city, project.region, project.country].filter(Boolean).join(', ')}
                      </p>
                      {project.fundingGoal && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Funding Goal</span>
                            <span>${(project.fundingGoal / 100).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-4">🌍</div>
                <p className="text-lg font-medium">No projects yet</p>
                <p className="mt-2">Start a conservation project to make a difference!</p>
                <Link
                  href="/account/projects/new"
                  className="mt-6 inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  Create Project
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    
      </>
  );
}
