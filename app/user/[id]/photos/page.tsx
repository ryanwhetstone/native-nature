import { notFound } from "next/navigation";
import { db } from "@/db";
import { users, observations, favorites, conservationProjects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Metadata } from "next";
import { UserProfileHeader } from "../components/UserProfileHeader";
import PhotosGalleryWithLoadMore from "./PhotosGalleryWithLoadMore";

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
    title: `${displayName}'s Photos | Native Nature`,
    description: `View all photos by ${displayName} including observations, projects, and favorited species.`,
  };
}

export default async function UserPhotosPage({
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

  // Fetch user's observations with photos
  const userObservations = await db.query.observations.findMany({
    where: eq(observations.userId, id),
    with: {
      species: true,
      pictures: true,
    },
    orderBy: [desc(observations.observedAt)],
  });

  // Fetch user's favorites
  const userFavorites = await db.query.favorites.findMany({
    where: eq(favorites.userId, id),
    with: {
      species: true,
    },
    orderBy: [desc(favorites.createdAt)],
  });

  // Fetch user's conservation projects
  const userProjects = await db.query.conservationProjects.findMany({
    where: eq(conservationProjects.userId, id),
    with: {
      pictures: true,
      updates: {
        with: {
          pictures: true,
        },
        orderBy: [desc(conservationProjects.createdAt)],
      },
    },
    orderBy: [desc(conservationProjects.createdAt)],
  });

  // Get observation photos
  const observationPhotos = userObservations.flatMap((obs) =>
    obs.pictures.map((pic) => ({
      ...pic,
      observation: {
        id: obs.id,
        observedAt: obs.observedAt,
        user: {
          publicName: user.publicName,
          name: user.name,
        },
      },
      species: obs.species,
    }))
  );

  // Get project photos (main project photos + update photos)
  const projectPhotos = userProjects.flatMap((proj) => {
    // Get main project photos
    const mainPhotos = proj.pictures.map((pic) => ({
      id: `project-${pic.id}`,
      imageUrl: pic.imageUrl,
      caption: pic.caption,
      createdAt: pic.createdAt,
      observation: {
        id: proj.id,
        observedAt: proj.createdAt,
        user: {
          publicName: user.publicName,
          name: user.name,
        },
      },
      species: {
        name: proj.title,
        preferredCommonName: null,
        slug: '',
      },
      projectId: proj.id,
      projectTitle: proj.title,
    }));

    // Get update photos
    const updatePhotos = proj.updates.flatMap((update) =>
      update.pictures.map((pic) => ({
        id: `project-update-${pic.id}`,
        imageUrl: pic.imageUrl,
        caption: pic.caption,
        createdAt: pic.createdAt,
        observation: {
          id: proj.id,
          observedAt: update.createdAt,
          user: {
            publicName: user.publicName,
            name: user.name,
          },
        },
        species: {
          name: proj.title,
          preferredCommonName: null,
          slug: '',
        },
        projectId: proj.id,
        projectTitle: proj.title,
        updateId: update.id,
        updateTitle: update.title,
      }))
    );

    return [...mainPhotos, ...updatePhotos];
  });

  // Get species photos (favorited species with default photos)
  const speciesPhotos = userFavorites
    .filter((fav) => fav.species.defaultPhotoUrl)
    .map((fav) => ({
      id: `species-fav-${fav.id}`,
      imageUrl: fav.species.defaultPhotoUrl!,
      caption: fav.species.defaultPhotoAttribution || null,
      createdAt: fav.createdAt,
      species: {
        name: fav.species.name,
        preferredCommonName: fav.species.preferredCommonName,
        slug: fav.species.slug,
      },
    }));

  // Combine all photos
  const allPhotos = [...observationPhotos, ...projectPhotos, ...speciesPhotos].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Calculate photos count excluding species photos (only user-uploaded photos)
  const userPhotosCount = observationPhotos.length + projectPhotos.length;

  const displayName = user.publicName || user.name || 'Anonymous User';

  return (
    <main className="min-h-screen">
      <UserProfileHeader
        userId={id}
        displayName={displayName}
        userImage={user.image}
        userBio={user.bio}
        observationsCount={userObservations.length}
        photosCount={userPhotosCount}
        projectsCount={userProjects.length}
        favoritesCount={userFavorites.length}
      />

      <div className="section bg-dark py-0">
        <div className="container-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading-3 text-white">All Photos</h2>
            <p className="text-white">
              {allPhotos.length} {allPhotos.length === 1 ? 'photo' : 'photos'}
            </p>
          </div>
          </div>
      </div>

      <div className="section bg-dark px-4 pt-2">
        <div className="container-full">
          <PhotosGalleryWithLoadMore allPhotos={allPhotos} />
        </div>
      </div>
    </main>
  );
}
