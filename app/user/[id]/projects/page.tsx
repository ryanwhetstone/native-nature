import { notFound } from "next/navigation";
import { db } from "@/db";
import { users, conservationProjects, observations, favorites } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
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
    title: `${displayName}'s Conservation Projects | Native Nature`,
    description: `View all conservation projects by ${displayName}.`,
  };
}

export default async function UserProjectsPage({
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

  // Fetch counts for nav
  const userObservations = await db.query.observations.findMany({
    where: eq(observations.userId, id),
    with: {
      pictures: true,
    },
  });

  const userFavorites = await db.query.favorites.findMany({
    where: eq(favorites.userId, id),
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
          <h1>
            {displayName}&apos;s Conservation Projects
          </h1>
          <p className="text-muted">
            {userProjects.length} {userProjects.length === 1 ? 'project' : 'projects'} total
          </p>
        </div>

        {/* Projects Grid */}
        {userProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProjects.map((project) => {
              const fundingPercentage = (project.currentFunding / project.fundingGoal) * 100;
              const mainImage = project.pictures[0]?.imageUrl;

              return (
                <Link
                  key={project.id}
                  href={getProjectUrl(project.id, project.title)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
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
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 line-clamp-2">
                        {project.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ml-2 ${
                        project.status === 'active' ? 'bg-green-100 text-green-800' :
                        project.status === 'funded' ? 'bg-blue-100 text-blue-800' :
                        project.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Location */}
                    <div className="flex items-center text-sm text-gray-500 mb-4">
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

                    {/* Created Date */}
                    <p className="text-xs text-gray-500 mt-4">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </p>
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
      
      {/* Share Buttons */}
      <ShareButtons
        title={`${displayName}'s Conservation Projects`}
        description={`View conservation projects by ${displayName} on Native Nature`}
        type="Share Projects"
      />
    </main>
  );
}
