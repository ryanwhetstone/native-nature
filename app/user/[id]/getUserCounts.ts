import { db } from "@/db";
import { observations, conservationProjects, favorites } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserCounts(userId: string) {
  // Get user's observations with pictures
  const userObservations = await db.query.observations.findMany({
    where: eq(observations.userId, userId),
    with: {
      pictures: true,
    },
  });

  // Get user's projects with pictures and updates
  const userProjects = await db.query.conservationProjects.findMany({
    where: eq(conservationProjects.userId, userId),
    with: {
      pictures: true,
      updates: {
        with: {
          pictures: true,
        },
      },
    },
  });

  // Get user's favorites
  const userFavorites = await db.query.favorites.findMany({
    where: eq(favorites.userId, userId),
  });

  // Count photos from observations
  const observationPhotosCount = userObservations.reduce((count, obs) => {
    return count + (obs.pictures?.length || 0);
  }, 0);

  // Count photos from projects (main photos + update photos)
  const projectPhotosCount = userProjects.reduce((count, proj) => {
    const mainPhotos = proj.pictures?.length || 0;
    const updatePhotos = proj.updates?.reduce((updateCount, update) => {
      return updateCount + (update.pictures?.length || 0);
    }, 0) || 0;
    return count + mainPhotos + updatePhotos;
  }, 0);

  return {
    observationsCount: userObservations.length,
    photosCount: observationPhotosCount + projectPhotosCount,
    projectsCount: userProjects.length,
    favoritesCount: userFavorites.length,
  };
}
