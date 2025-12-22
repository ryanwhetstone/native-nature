import Link from "next/link";
import { WorldMap } from "./WorldMap";
import { db } from "@/db";
import { observations, conservationProjects } from "@/db/schema";
import { desc, and, lt } from "drizzle-orm";
import Image from "next/image";
import MasonryPhotoGallery from "@/app/components/MasonryPhotoGallery";
import { getObservationUrl } from "@/lib/observation-url";

export default async function Home() {
  // Fetch recent observations with images
  const recentObservations = await db.query.observations.findMany({
    with: {
      species: true,
      pictures: true,
      user: true,
    },
    orderBy: [desc(observations.createdAt)],
    limit: 20,
  });

  // Filter observations that have pictures and select 4
  const observationsWithPictures = recentObservations.filter(obs => obs.pictures.length > 0);
  const selectedObservations = observationsWithPictures.slice(0, 4);

  // Get all observation photos for the masonry gallery
  const allPhotos = selectedObservations.flatMap((obs) =>
    obs.pictures.map((pic) => ({
      ...pic,
      observation: {
        id: obs.id,
        observedAt: obs.observedAt,
        user: {
          publicName: obs.user.publicName,
          name: obs.user.name,
        },
      },
      species: obs.species,
    }))
  );

  // Fetch unfunded conservation projects (not funded or completed)
  const unfundedProjects = await db.query.conservationProjects.findMany({
    where: lt(conservationProjects.currentFunding, conservationProjects.fundingGoal),
    with: {
      user: {
        columns: {
          publicName: true,
          name: true,
        },
      },
      pictures: {
        limit: 1,
      },
    },
    orderBy: [desc(conservationProjects.createdAt)],
    limit: 6,
  });
  
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section and Recent Observations - Dark */}
      <div className="bg-slate-900 py-8">
        <div className="w-full px-4">
          {/* Hero/Header */}
          <div className="max-w-7xl mx-auto mb-8 text-center">
            <h1 className="text-5xl font-semibold mb-4 text-white">Native Nature</h1>
            <p className="text-xl text-gray-300">
              Discover and explore native species from around the world
            </p>
          </div>

          {/* Photo Gallery */}
          {allPhotos.length > 0 && (
            <div className="mb-8">
              <div className="max-w-7xl mx-auto mb-4">
                <h2 className="text-2xl font-semibold text-white">Recent Observations</h2>
              </div>
              <MasonryPhotoGallery photos={allPhotos} />
            </div>
          )}

          {/* Observations Row */}
          {selectedObservations.length > 0 && (
            <div className="max-w-7xl mx-auto mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {selectedObservations.map((observation) => (
                  <Link
                    key={observation.id}
                    href={getObservationUrl(observation.id, observation.species.name, observation.species.preferredCommonName)}
                    className="bg-slate-800 rounded-lg overflow-hidden group hover:bg-slate-700 transition-all"
                  >
                    <div className="relative aspect-video bg-slate-700">
                      {observation.pictures && observation.pictures.length > 0 && (
                        <Image
                          src={observation.pictures[0].imageUrl}
                          alt={observation.species.preferredCommonName || observation.species.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      )}
                      {observation.pictures && observation.pictures.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                          +{observation.pictures.length - 1} more
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white group-hover:text-green-400 mb-1 line-clamp-1">
                        {observation.species.preferredCommonName || observation.species.name}
                      </h3>
                      <p className="text-sm text-gray-400 italic mb-2 line-clamp-1">
                        {observation.species.name}
                      </p>
                      <div className="text-sm text-gray-400">
                        <div className="flex items-center mb-1">
                          <span className="mr-2">👤</span>
                          <span className="line-clamp-1">{observation.user.publicName || observation.user.name || 'Anonymous'}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">📍</span>
                          <span className="line-clamp-1">
                            {[observation.city, observation.region, observation.country].filter(Boolean).join(', ') || 'Location recorded'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link
                  href="/recent-observations"
                  className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  View All Observations →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* World Map Section */}
      <div className="py-16 px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto mb-8">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4 text-center">Explore by Location</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto">
            Click on any country to discover native species in that region
          </p>
        </div>
        <WorldMap />
      </div>

      {/* Conservation Projects Section */}
      {unfundedProjects.length > 0 && (
        <div className="py-16 px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">Support Conservation Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unfundedProjects.map((project) => {
                const fundingPercentage = Math.min(100, (project.currentFunding / project.fundingGoal) * 100);
                return (
                  <Link
                    key={project.id}
                    href={`/conservation-project/${project.id}-${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    className="group block bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-green-500 hover:shadow-lg transition-all"
                  >
                    {project.pictures.length > 0 && (
                      <div className="relative h-48 w-full overflow-hidden">
                        <Image
                          src={project.pictures[0].imageUrl}
                          alt={project.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-green-600 mb-2 line-clamp-2">
                        {project.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {project.description}
                      </p>
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>${(project.currentFunding / 100).toLocaleString()} raised</span>
                          <span>${(project.fundingGoal / 100).toLocaleString()} goal</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${fundingPercentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-green-600 group-hover:text-green-700 font-medium text-sm">
                        Support this project →
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/conservation-efforts"
                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                View All Projects →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="bg-gray-50 py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-semibold text-gray-900 mb-12 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Maps</h3>
              <p className="text-gray-600">
                Explore species by country and region with interactive maps
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Share Observations</h3>
              <p className="text-gray-600">
                Document and share your wildlife sightings with the community
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Support Conservation</h3>
              <p className="text-gray-600">
                Fund projects that protect habitats and native species
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Learn & Discover</h3>
              <p className="text-gray-600">
                Access detailed species information and conservation status
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
