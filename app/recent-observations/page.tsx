import { db } from "@/db";
import { observations } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import MasonryPhotoGallery from "@/app/components/MasonryPhotoGallery";
import { getObservationUrl } from "@/lib/observation-url";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recent Observations | Native Nature",
  description: "Explore the latest wildlife and nature observations from our global community. View recent sightings, photos, and discoveries from around the world.",
};

const ITEMS_PER_PAGE = 12;

export default async function RecentObservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  
  // Fetch recent observations with species and pictures
  const allObservations = await db.query.observations.findMany({
    with: {
      species: true,
      pictures: true,
      user: true,
    },
    orderBy: [desc(observations.createdAt)],
    limit: 200, // Get more to filter for approved
  });

  // Filter to only observations where ALL pictures are approved
  const filteredObservations = allObservations.filter(obs => 
    obs.pictures.length > 0 && 
    obs.pictures.every(pic => pic.approved === true)
  );

  // Calculate pagination
  const totalObservations = filteredObservations.length;
  const totalPages = Math.ceil(totalObservations / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const recentObservations = filteredObservations.slice(startIndex, endIndex);

  // Get one photo per observation for the masonry gallery
  const allPhotos = recentObservations
    .filter(obs => obs.pictures.length > 0)
    .map((obs) => ({
      ...obs.pictures[0],
      observation: {
        id: obs.id,
        observedAt: obs.observedAt,
        user: {
          publicName: obs.user.publicName,
          name: obs.user.name,
        },
      },
      species: obs.species,
    }));

  return (
    <>
      {/* Dark section for header and photo gallery */}
      <div className="section bg-dark">
        <div className="container-md">
          <div className="flex-gap-xs">

            <h1 className="heading-2 text-white">Recent Observations</h1>
            <p className="mt-2 text-gray-300">
              Latest wildlife sightings from the community
            </p>
          </div>
          </div>
          </div>
        <div className="section bg-dark px-4 pt-0">

          {/* Photo Gallery */}
          {allPhotos.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Recent Photos</h2>
              <MasonryPhotoGallery photos={allPhotos} />
            </div>
          )}
        </div>

      {/* Light section for observations list */}
      <div className="section bg-light">
          {/* Observations List Header */}
          <div className="container-lg">
            <h2 className="heading-3">Observations</h2>

          {/* Observations Grid */}
        {recentObservations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentObservations.map((observation) => (
              <div
                key={observation.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
              >
                <Link href={getObservationUrl(observation.id, observation.species.name, observation.species.preferredCommonName)}>
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
                    {observation.pictures && observation.pictures.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        +{observation.pictures.length - 1} more
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 mb-1">
                      {observation.species.preferredCommonName || observation.species.name}
                    </h3>
                    <p className="text-sm text-gray-500 italic mb-3">
                      {observation.species.name}
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="mr-2">👤</span>
                        <span>{observation.user.publicName || observation.user.name || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">📅</span>
                        <span>Observed: {new Date(observation.observedAt).toLocaleDateString()}</span>
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
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="text-6xl mb-4">📍</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No observations yet</h2>
            <p className="text-muted">
              Be the first to record a wildlife observation!
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            {currentPage > 1 && (
              <Link
                href={`/recent-observations?page=${currentPage - 1}`}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Previous
              </Link>
            )}
            
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage = 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1);
                
                const showEllipsis = 
                  (page === currentPage - 2 && currentPage > 3) ||
                  (page === currentPage + 2 && currentPage < totalPages - 2);

                if (showEllipsis) {
                  return <span key={page} className="px-2">...</span>;
                }

                if (!showPage) {
                  return null;
                }

                return (
                  <Link
                    key={page}
                    href={`/recent-observations?page=${page}`}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      page === currentPage
                        ? 'bg-green-600 text-white font-semibold'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </Link>
                );
              })}
            </div>

            {currentPage < totalPages && (
              <Link
                href={`/recent-observations?page=${currentPage + 1}`}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}
        </div>
      </div>
    
      </>
  );
}
