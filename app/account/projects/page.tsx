import { auth } from "@/auth";
import { db } from "@/db";
import { conservationProjects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getProjectUrl } from "@/lib/project-url";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'My Projects | Native Nature',
  description: 'Manage your conservation projects.',
};

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Fetch user's projects
  const userProjects = await db.query.conservationProjects.findMany({
    where: eq(conservationProjects.userId, session.user.id),
    with: {
      pictures: true,
    },
    orderBy: [desc(conservationProjects.createdAt)],
  });

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">My Conservation Projects</h1>
            <p className="mt-2 text-gray-600">Manage and track your conservation initiatives</p>
          </div>
          <Link
            href="/account/projects/new"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </Link>
        </div>

        {/* Projects Grid */}
        {userProjects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🌱</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No projects yet</h2>
            <p className="text-gray-600 mb-6">
              Start making a difference by creating your first conservation project
            </p>
            <Link
              href="/account/projects/new"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProjects.map((project) => {
              const fundingPercentage = (project.currentFunding / project.fundingGoal) * 100;
              const mainImage = project.pictures[0]?.imageUrl;

              return (
                <Link
                  key={project.id}
                  href={getProjectUrl(project.id, project.title)}
                  className="project-card"
                >
                  {/* Project Image */}
                  {mainImage ? (
                    <div className="relative h-48 bg-gray-200">
                      <Image
                        src={mainImage}
                        alt={project.title}
                        fill
                        className="object-cover"
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
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {project.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
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
                        <span className="text-muted">Funding Progress</span>
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

                    <div className="text-xs text-gray-500 mt-4">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    
      </>
  );
}
