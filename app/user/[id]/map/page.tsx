import { db } from "@/db";
import { observations, conservationProjects, users, favorites } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { UserProfileHeader } from "../components/UserProfileHeader";
import UserMapView from "./UserMapView";

export default async function UserMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Get user information
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!user) {
    notFound();
  }

  // Get user's observations with locations
  const userObservations = await db.query.observations.findMany({
    where: eq(observations.userId, id),
    with: {
      species: true,
    },
    orderBy: [desc(observations.observedAt)],
    limit: 1000,
  });

  // Get user's projects with locations
  const userProjects = await db.query.conservationProjects.findMany({
    where: eq(conservationProjects.userId, id),
    with: {
      pictures: true,
    },
  });

  // Get user's favorites
  const userFavorites = await db.query.favorites.findMany({
    where: eq(favorites.userId, id),
  });

  // Count photos from observations
  const userPhotosCount = userObservations.reduce((count, obs) => {
    return count + (obs.pictures?.length || 0);
  }, 0);

  return (
    <main className="min-h-screen">
      {/* Dark section for header */}
    <UserProfileHeader
        userId={user.id}
        displayName={user.publicName || user.name || "Anonymous"}
        userImage={user.image}
        userBio={user.bio}
        observationsCount={userObservations.length}
        photosCount={userPhotosCount}
        projectsCount={userProjects.length}
        favoritesCount={userFavorites.length}
    />

      {/* Light section for map */}
      <div className="section bg-light">
        <div className="container-md">
          <div className="section-card">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                {user.publicName || user.name || "User"}&apos;s Map
              </h2>
              <p className="text-muted">
                {userObservations.length} observations · {userProjects.length} projects
              </p>
            </div>
            
            <UserMapView 
              observations={userObservations
                .filter(obs => obs.latitude && obs.longitude)
                .map(obs => ({
                  id: obs.id,
                  latitude: parseFloat(obs.latitude),
                  longitude: parseFloat(obs.longitude),
                  observedAt: obs.observedAt,
                  imageUrl: obs.imageUrl,
                  speciesName: obs.species?.name || 'Unknown',
                  speciesCommonName: obs.species?.preferredCommonName || null,
                  speciesSlug: obs.species?.slug || null,
                }))}
              projects={userProjects
                .filter(proj => proj.latitude && proj.longitude)
                .map(proj => ({
                  id: proj.id,
                  latitude: parseFloat(proj.latitude),
                  longitude: parseFloat(proj.longitude),
                  title: proj.title,
                  imageUrl: proj.imageUrl,
                }))}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
