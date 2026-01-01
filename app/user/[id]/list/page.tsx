import { notFound } from "next/navigation";
import { db } from "@/db";
import { users, observations, favorites, conservationProjects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { getObservationUrl } from "@/lib/observation-url";
import { Metadata } from "next";
import { DownloadCSVButton } from "./DownloadCSVButton";
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
    title: `${displayName}'s Observations | Native Nature`,
    description: `View ${displayName}'s nature observations in a list format.`,
  };
}

export default async function UserObservationsListPage({
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

  // Fetch user's observations
  const userObservations = await db.query.observations.findMany({
    where: eq(observations.userId, id),
    with: {
      species: true,
      pictures: true,
    },
    orderBy: [desc(observations.observedAt)],
  });

  // Fetch counts for nav
  const userFavorites = await db.query.favorites.findMany({
    where: eq(favorites.userId, id),
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
          {/* Header */}
          <div className="flex-gap-xs mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1>{displayName}'s Observations</h1>
                <p className="text-muted">
                  {userObservations.length} {userObservations.length === 1 ? 'observation' : 'observations'} recorded
                </p>
              </div>
              <div className="flex items-center gap-3">
                <DownloadCSVButton
                  observations={userObservations}
                  userName={displayName}
                />
                <Link
                  href={`/user/${id}/observations`}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Grid View
                </Link>
              </div>
            </div>
          </div>

          {/* Observations Table */}
          {userObservations.length > 0 ? (
            <div className="section-card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Common Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scientific Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Observed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userObservations.map((observation) => (
                      <tr key={observation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={getObservationUrl(observation.id, observation.species.name, observation.species.preferredCommonName)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {observation.species.preferredCommonName || observation.species.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-small italic">
                          {observation.species.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-small">
                          {new Date(observation.observedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-small">
                          {[observation.city, observation.region, observation.country].filter(Boolean).join(', ') || 'Location recorded'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="text-6xl mb-4">📍</div>
              <p className="text-muted">No observations yet</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
