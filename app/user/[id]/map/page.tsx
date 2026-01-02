import { db } from "@/db";
import { observations, conservationProjects, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { UserProfileHeader } from "../components/UserProfileHeader";
import { getUserCounts } from "../getUserCounts";
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

  // Get counts using shared helper
  const counts = await getUserCounts(id);

  // Get user's observations with locations
  const userObservations = await db.query.observations.findMany({
    where: eq(observations.userId, id),
    with: {
      species: true,
      pictures: true,
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

  // Filter for observations with valid locations
  const observationsWithLocation = userObservations.filter(
    (obs) => obs.latitude !== null && obs.longitude !== null
  );

  // Filter for projects with valid locations
  const projectsWithLocation = userProjects.filter(
    (project) => project.latitude !== null && project.longitude !== null
  );

  return (
    <main className="min-h-screen">
      {/* Dark section for header */}
    <UserProfileHeader
        userId={user.id}
        displayName={user.publicName || user.name || "Anonymous"}
        userImage={user.image}
        userBio={user.bio}
        observationsCount={counts.observationsCount}
        photosCount={counts.photosCount}
        projectsCount={counts.projectsCount}
        favoritesCount={counts.favoritesCount}
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
                {observationsWithLocation.length} observations · {projectsWithLocation.length} projects
              </p>
            </div>
            
            <UserMapView 
              observations={observationsWithLocation.map(obs => ({
                  id: obs.id,
                  latitude: parseFloat(obs.latitude),
                  longitude: parseFloat(obs.longitude),
                  observedAt: obs.observedAt,
                  imageUrl: obs.pictures?.[0]?.imageUrl || null,
                  speciesName: obs.species?.name || 'Unknown',
                  speciesCommonName: obs.species?.preferredCommonName || null,
                  speciesSlug: obs.species?.slug || null,
                }))}
              projects={projectsWithLocation.map(proj => ({
                  id: proj.id,
                  latitude: parseFloat(proj.latitude),
                  longitude: parseFloat(proj.longitude),
                  title: proj.title,
                  imageUrl: proj.pictures?.[0]?.imageUrl || null,
                }))}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
