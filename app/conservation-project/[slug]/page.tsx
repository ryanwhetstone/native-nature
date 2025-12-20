import { db } from "@/db";
import { conservationProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import MasonryPhotoGallery from "@/app/components/MasonryPhotoGallery";
import type { Metadata } from "next";
import { parseProjectSlug } from "@/lib/project-url";
import { DeleteProjectButton } from "@/app/account/projects/DeleteProjectButton";
import ProjectDisplayMap from "./ProjectDisplayMap";
import DonateButton from "./DonateButton";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const projectId = parseProjectSlug(slug);
  
  if (!projectId) {
    return {
      title: 'Project Not Found | Native Nature',
    };
  }
  
  const project = await db.query.conservationProjects.findFirst({
    where: eq(conservationProjects.id, projectId),
  });

  if (!project) {
    return {
      title: 'Project Not Found | Native Nature',
    };
  }

  return {
    title: `${project.title} | Native Nature Conservation`,
    description: project.description.slice(0, 160),
  };
}

export default async function PublicProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;
  const projectId = parseProjectSlug(slug);

  if (!projectId) {
    notFound();
  }

  const project = await db.query.conservationProjects.findFirst({
    where: eq(conservationProjects.id, projectId),
    with: {
      pictures: true,
      user: {
        columns: {
          id: true,
          name: true,
          publicName: true,
          image: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const isOwner = session?.user?.id === project.userId;
  const fundingPercentage = (project.currentFunding / project.fundingGoal) * 100;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Dark section for header and photos */}
      <div className="bg-slate-900 py-8">
        <div className="w-full px-4">
          {/* Header */}
          <div className="max-w-7xl mx-auto mb-8">
            <div className="flex justify-end mb-4">
              {/* Owner Actions */}
              {isOwner && (
                <div className="flex-shrink-0 flex gap-2">
                  <Link
                    href={`/account/projects/${project.id}/edit`}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Edit
                  </Link>
                  <DeleteProjectButton projectId={project.id} />
                </div>
              )}
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      project.status === 'active' ? 'bg-green-600 text-white' :
                      project.status === 'completed' ? 'bg-blue-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)} Conservation Project
                    </span>
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center gap-6 text-sm text-gray-300 flex-wrap">
                    <div className="flex items-center">
                      <span className="mr-2">👤</span>
                      <span>Created by{" "}
                        <Link 
                          href={`/user/${project.user.id}/profile`}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {project.user.publicName || project.user.name || 'Anonymous'}
                        </Link>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">📅</span>
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                    {(project.city || project.region || project.country) && (
                      <div className="flex items-center">
                        <span className="mr-2">📍</span>
                        <span>{[project.city, project.region, project.country].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>

                </div>

                <h1 className="text-3xl font-semibold text-white mb-6">
                  {project.title}
                </h1>
                <div className="mb-4">
                  <p className="whitespace-pre-wrap text-white text-lg lg:pr-64">{project.description}</p>
                </div>

              </div>
            </div>
          </div>

          {/* Photos Gallery */}
          {project.pictures.length > 0 && (
            <div className="mb-8">
              <MasonryPhotoGallery 
                photos={project.pictures.map(pic => ({
                  id: pic.id,
                  imageUrl: pic.imageUrl,
                  caption: pic.caption,
                  createdAt: pic.createdAt,
                  observation: {
                    id: project.id,
                    observedAt: project.createdAt,
                    user: {
                      publicName: project.user.publicName,
                      name: project.user.name,
                    },
                  },
                  species: {
                    name: project.title,
                    preferredCommonName: null,
                    slug: '',
                  },
                }))}
                columns={{ default: 1, md: 2, lg: 3 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Light section for additional details */}
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Funding Progress Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Funding Progress</h2>
            <div className="mb-6">
              <div className="flex justify-between items-baseline mb-2">
                <h3 className="text-3xl font-bold text-gray-900">
                  ${(project.currentFunding / 100).toLocaleString()}
                </h3>
                <span className="text-gray-600">
                  of ${(project.fundingGoal / 100).toLocaleString()} goal
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div
                  className="bg-green-600 h-4 rounded-full transition-all"
                  style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                {fundingPercentage.toFixed(1)}% funded
              </p>
            </div>
            
            {/* Donate Button */}
            <DonateButton 
              projectId={project.id}
              projectTitle={project.title}
              currentFunding={project.currentFunding}
              fundingGoal={project.fundingGoal}
            />
          </div>
          {/* Location Map */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xl font-semibold mr-8">Location</h2>
              {(project.city || project.region || project.country) && (
                <p className="text-gray-600">
                  {[project.city, project.region, project.country].filter(Boolean).join(', ')}
                </p>
              )}
              <p>
                <span className="text-gray-600 w-32 flex-shrink-0">Coordinates:</span>
                <span className="text-gray-600">
                  {parseFloat(project.latitude).toFixed(6)}, {parseFloat(project.longitude).toFixed(6)}
                </span>
              </p>
            </div>
            
            {/* Map */}
            <div className="mt-4">
              <ProjectDisplayMap 
                longitude={parseFloat(project.longitude)}
                latitude={parseFloat(project.latitude)}
              />
            </div>
          </div>

          {/* Project Details Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Project Details</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-gray-600 w-40 flex-shrink-0 font-medium">Title:</span>
                <span className="text-gray-900 font-semibold">{project.title}</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-600 w-40 flex-shrink-0 font-medium">Description:</span>
                <span className="text-gray-900 whitespace-pre-wrap">{project.description}</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-600 w-40 flex-shrink-0 font-medium">Status:</span>
                <span className="text-gray-900 capitalize">{project.status}</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-600 w-40 flex-shrink-0 font-medium">Created:</span>
                <span className="text-gray-900">{new Date(project.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-600 w-40 flex-shrink-0 font-medium">Funding Goal:</span>
                <span className="text-gray-900">${(project.fundingGoal / 100).toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
