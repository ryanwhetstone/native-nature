import { notFound } from "next/navigation";
import { db } from "@/db";
import { users, conservationProjects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { getProjectUrl } from "@/lib/project-url";
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
    },
    orderBy: [desc(conservationProjects.createdAt)],
  });

  const displayName = user.publicName || user.name || 'Anonymous User';

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/user/${id}/profile`}
            className="text-green-600 hover:text-green-700 text-sm mb-2 inline-block"
          >
            ← Back to Profile
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {displayName}&apos;s Conservation Projects
          </h1>
          <p className="text-gray-600 mt-2">
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
                    <div className="relative h-48 bg-gray-200">
                      <Image
                        src={mainImage}
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
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
                        <span className="text-gray-600">Funding</span>
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
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🌍</div>
            <p className="text-gray-600">No conservation projects yet</p>
          </div>
        )}
      </div>
    </main>
  );
}
