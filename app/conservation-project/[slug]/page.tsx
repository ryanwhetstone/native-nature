import { db } from "@/db";
import { conservationProjects, donations, projectUpdates, projectQuestions } from "@/db/schema";
import { eq, desc, isNotNull } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import MasonryPhotoGallery from "@/app/components/MasonryPhotoGallery";
import type { Metadata } from "next";
import { parseProjectSlug } from "@/lib/project-url";
import ProjectDisplayMap from "./ProjectDisplayMap";
import DonateButton from "./DonateButton";
import ThankYouModal from "./ThankYouModal";
import ProjectActions from "./ProjectActions";
import UpdateImage from "./UpdateImage";
import Image from "next/image";
import AskQuestionForm from "./AskQuestionForm";
import ShareButtons from "@/app/components/ShareButtons";

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

  // Fetch donations for this project
  const projectDonations = await db.query.donations.findMany({
    where: eq(donations.projectId, projectId),
    orderBy: [desc(donations.completedAt)],
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          publicName: true,
        },
      },
    },
  });

  // Filter only completed donations
  const completedDonations = projectDonations.filter(d => d.status === 'completed');

  // Fetch project updates
  const updates = await db.query.projectUpdates.findMany({
    where: eq(projectUpdates.projectId, projectId),
    orderBy: [desc(projectUpdates.createdAt)],
    with: {
      pictures: true,
      user: {
        columns: {
          id: true,
          name: true,
          publicName: true,
        },
      },
    },
  });

  // Fetch answered questions
  const answeredQuestions = await db.query.projectQuestions.findMany({
    where: eq(projectQuestions.projectId, projectId),
    orderBy: [desc(projectQuestions.createdAt)],
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          publicName: true,
        },
      },
    },
  });

  // Filter to only show questions that have responses
  const questionsWithAnswers = answeredQuestions.filter(q => q.response);

  const isOwner = session?.user?.id === project.userId;
  const fundingPercentage = (project.currentFunding / project.fundingGoal) * 100;

  // Combine update pictures and project pictures for the gallery
  // Update pictures come first
  type GalleryPhoto = {
    id: number | string;
    imageUrl: string;
    caption: string | null;
    createdAt: Date;
    observation: {
      id: number;
      observedAt: Date;
      user: {
        publicName: string | null;
        name: string | null;
      };
    };
    species: {
      name: string;
      preferredCommonName: string | null;
      slug: string;
    };
    updateId?: number;
    updatePictureId?: number;
  };

  const allPhotos: GalleryPhoto[] = [
    // Map update pictures to gallery format
    ...updates.flatMap(update =>
      update.pictures.map(pic => ({
        id: `update-${pic.id}`,
        imageUrl: pic.imageUrl,
        caption: `${update.title}: ${pic.caption || ''}`.trim(),
        createdAt: pic.createdAt,
        observation: {
          id: project.id,
          observedAt: update.createdAt,
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
        updateId: update.id,
        updatePictureId: pic.id,
        projectId: project.id,
        projectTitle: project.title,
      }))
    ),
    // Then add project pictures
    ...project.pictures.map(pic => ({
      id: `project-${pic.id}`,
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
      projectId: project.id,
      projectTitle: project.title,
    }))
  ];

  return (
    <main className="min-h-screen bg-light">
      <ThankYouModal />
      {/* Dark section for header and photos */}
      <div className="section bg-dark pt-3 sm:pt-4 px-4">
        <div className="container-full">
          {/* Header */}
          <div className="max-w-7xl mx-auto flex-gap-md">
            <div className="flex justify-end">
              {/* Owner Actions */}
              <ProjectActions
                projectId={project.id}
                projectTitle={project.title}
                projectStatus={project.status}
                isOwner={isOwner}
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-sm rounded-full ${project.status === 'active' ? 'bg-green-600 text-white' :
                      project.status === 'funded' ? 'bg-blue-600 text-white' :
                        project.status === 'completed' ? 'bg-emerald-600 text-white' :
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

                <div className="flex-gap-xs">
                  <h1 className="text-white">
                    {project.title}
                  </h1>
                  <p className="whitespace-pre-wrap text-white text-lg lg:pr-64">{project.description}</p>
                </div>

              </div>
            </div>
          </div>

          {/* Photos Gallery */}
          {allPhotos.length > 0 && (
            <div id="photo-gallery">
              <MasonryPhotoGallery
                photos={allPhotos as any[]}
                columns={{ default: 1, md: 2, lg: 3 }}
                isProjectGallery={true}
                currentProjectId={project.id}
              />
            </div>
          )}
        </div>
      </div>


      {/* Light section for additional details */}
      <div className="section bg-light">
        <div className="container-sm">


          {/* Project Updates Section */}
          {updates.length > 0 && (
            <div className="section-card">
              <h2>Project Updates</h2>
              <div className="space-y-8">
                {updates.map((update) => (
                  <div key={update.id} className="border-b border-gray-200 last:border-0 pb-8 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{update.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(update.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap mb-4">{update.description}</p>

                    {/* Update Pictures */}
                    {update.pictures.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {update.pictures.map((picture) => (
                          <UpdateImage
                            key={picture.id}
                            imageUrl={picture.imageUrl}
                            caption={picture.caption}
                            updatePictureId={picture.id}
                            allPhotos={allPhotos}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Funding Progress Card */}
          <div className="section-card">
            <h2>Funding Progress</h2>
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <h3 className="heading-2">
                  ${(project.currentFunding / 100).toLocaleString()}
                </h3>
                <span className="text-muted">
                  of ${(project.fundingGoal / 100).toLocaleString()} goal
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div
                  className="bg-green-600 h-4 rounded-full transition-all"
                  style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
                />
              </div>
              <p className="text-small">
                {fundingPercentage >= 100 ? 'Fully funded' : `${fundingPercentage.toFixed(1)}% funded`}
              </p>
            </div>

            {/* Donate Button */}
            <DonateButton
              projectId={project.id}
              projectTitle={project.title}
              currentFunding={project.currentFunding}
              fundingGoal={project.fundingGoal}
              status={project.status}
            />
          </div>
          {/* Location Map */}
          <div className="section-card">
            <div className="flex items-baseline justify-between">
              <h2 className="mr-8">Location</h2>
              {(project.city || project.region || project.country) && (
                <p className="text-muted">
                  {[project.city, project.region, project.country].filter(Boolean).join(', ')}
                </p>
              )}
              <p>
                <span className="text-gray-600 w-32 flex-shrink-0">Coordinates:</span>
                <span className="text-muted">
                  {parseFloat(project.latitude).toFixed(6)}, {parseFloat(project.longitude).toFixed(6)}
                </span>
              </p>
            </div>

            {/* Map */}
            <div>
              <ProjectDisplayMap
                longitude={parseFloat(project.longitude)}
                latitude={parseFloat(project.latitude)}
              />
            </div>
          </div>

          {/* Project Details Card */}
          <div className="section-card">
            <h2>Project Details</h2>
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

          {/* Donors Section */}
          {completedDonations.length > 0 && (
            <div className="section-card">
              <h2>
                Thank you to the following donors! 🌿
              </h2>
              <div className="space-y-3">
                {completedDonations.map((donation) => {
                  let displayName = 'Anonymous Donor';

                  // If donation is tied to a user account, use their public name
                  if (donation.user) {
                    displayName = donation.user.publicName || donation.user.name || 'Anonymous Donor';
                  }
                  // Otherwise, format the donor name from Stripe (first name + last initial)
                  else if (donation.donorName) {
                    const nameParts = donation.donorName.trim().split(' ');
                    if (nameParts.length > 1) {
                      const firstName = nameParts[0];
                      const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
                      displayName = `${firstName} ${lastInitial}.`;
                    } else {
                      displayName = donation.donorName;
                    }
                  }

                  return (
                    <div key={donation.id} className="py-3 border-b border-gray-100 last:border-0">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">❤️</span>
                            {donation.user ? (
                              <Link
                                href={`/user/${donation.user.id}/profile`}
                                className="text-gray-900 font-medium hover:text-blue-600 transition-colors"
                              >
                                {displayName}
                              </Link>
                            ) : (
                              <span className="text-gray-900 font-medium">{displayName}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 ml-7 mt-1">
                            {new Date(donation.completedAt || donation.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <span className="text-gray-600 font-semibold">
                          ${(donation.projectAmount / 100).toLocaleString()}
                        </span>
                      </div>
                      {donation.message && (
                        <p className="text-gray-600 text-sm ml-7 mt-1 italic">
                          &quot;{donation.message}&quot;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">Total contributions:</span>
                  <span className="text-green-600 font-bold text-lg">
                    ${(completedDonations.reduce((sum, d) => sum + d.projectAmount, 0) / 100).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {completedDonations.length} {completedDonations.length === 1 ? 'donation' : 'donations'}
                </p>
              </div>
            </div>
          )}

          {/* Q&A Section */}
          {/* Display answered questions */}
          {questionsWithAnswers.length > 0 && (
            <div className="section-card">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Questions & Answers</h2>
              <div className="space-y-6">
                {questionsWithAnswers.map((qa) => {
                  const askerName = qa.user
                    ? (qa.user.publicName || qa.user.name || 'Anonymous')
                    : (qa.askerName || 'Anonymous');

                  return (
                    <div key={qa.id} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                      {/* Question */}
                      <div className="mb-4">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-blue-600 text-lg">Q:</span>
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium">{qa.question}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Asked by {qa.user ? (
                                <Link
                                  href={`/user/${qa.user.id}/profile`}
                                  className="text-blue-600 hover:underline"
                                >
                                  {askerName}
                                </Link>
                              ) : (
                                <span>{askerName}</span>
                              )} on {new Date(qa.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Answer */}
                      {qa.response && (
                        <div className="ml-6 bg-green-50 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <span className="text-green-600 text-lg font-semibold">A:</span>
                            <div className="flex-1">
                              <p className="text-gray-900 whitespace-pre-wrap">{qa.response}</p>
                              {qa.respondedAt && (
                                <p className="text-sm text-gray-600 mt-2">
                                  Answered by {project.user.publicName || project.user.name} on {new Date(qa.respondedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="section-card">
            <AskQuestionForm projectId={project.id} />

          </div>
        </div>
      </div>
      
      {/* Share Buttons */}
      <ShareButtons
        title={project.title}
        description={project.description}
        type="Share Project"
      />
    </main>
  );
}
