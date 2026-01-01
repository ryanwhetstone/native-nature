import Link from "next/link";
import { WorldMap } from "./WorldMap";
import { db } from "@/db";
import { observations, conservationProjects, favorites } from "@/db/schema";
import { desc, and, lt, sql, eq } from "drizzle-orm";
import Image from "next/image";
import MasonryPhotoGallery from "@/app/components/MasonryPhotoGallery";
import ProjectCard from "@/app/components/ProjectCard";
import { getObservationUrl } from "@/lib/observation-url";
import { getProjectUrl } from "@/lib/project-url";
import { countries } from "@/lib/countries";

export default async function Home() {
  // Fetch 5 random observations with images
  const randomObservations = await db.query.observations.findMany({
    with: {
      species: true,
      pictures: true,
      user: true,
    },
    orderBy: sql`RANDOM()`,
    limit: 50, // Get more than needed to filter for pictures
  });

  // Filter observations that have approved pictures and select 5
  // Only include observations where ALL pictures are approved
  const observationsWithPictures = randomObservations
    .filter(obs => 
      obs.pictures.length > 0 && 
      obs.pictures.every(pic => pic.approved === true)
    )
    .slice(0, 5);

  // Fetch 5 random conservation projects with images
  const randomProjects = await db.query.conservationProjects.findMany({
    with: {
      user: {
        columns: {
          publicName: true,
          name: true,
        },
      },
      pictures: true,
      updates: {
        with: {
          pictures: true,
        },
        orderBy: (updates, { desc }) => [desc(updates.createdAt)],
        limit: 1, // Get most recent update with pictures
      },
    },
    orderBy: sql`RANDOM()`,
    limit: 50, // Get more than needed to filter for pictures
  });

  // Filter projects that have approved pictures and select 5
  // Only include projects where ALL pictures are approved
  const projectsWithPictures = randomProjects.filter(proj => {
    const allProjectPicsApproved = proj.pictures.length === 0 || proj.pictures.every(pic => pic.approved === true);
    const allUpdatePicsApproved = !proj.updates?.[0]?.pictures || 
      proj.updates[0].pictures.length === 0 || 
      proj.updates[0].pictures.every(pic => pic.approved === true);
    
    const hasAnyPictures = proj.pictures.length > 0 || (proj.updates?.[0]?.pictures?.length || 0) > 0;
    
    return hasAnyPictures && allProjectPicsApproved && allUpdatePicsApproved;
  }).slice(0, 5);

  // Fetch last 5 favorited species with photos
  const recentFavorites = await db.query.favorites.findMany({
    with: {
      species: true,
    },
    orderBy: [desc(favorites.createdAt)],
    limit: 50, // Get more to filter for those with photos
  });

  // Filter favorites that have default photos and select 5
  const favoritesWithPhotos = recentFavorites.filter(fav => fav.species.defaultPhotoUrl).slice(0, 5);

  // Combine photos from observations, projects, and favorited species for the masonry gallery
  // Only show the first approved image from each observation
  const observationPhotos = observationsWithPictures
    .map((obs) => {
      const approvedPic = obs.pictures.find(pic => pic.approved === true);
      if (!approvedPic) return null;
      
      return {
        ...approvedPic,
        observation: {
          id: obs.id,
          observedAt: obs.observedAt,
          user: {
            publicName: obs.user.publicName,
            name: obs.user.name,
          },
        },
        species: obs.species,
      };
    })
    .filter((photo): photo is NonNullable<typeof photo> => photo !== null);

  const projectPhotos = projectsWithPictures
    .map((proj) => {
      // Try to get approved image from most recent update first
      const updatePic = proj.updates?.[0]?.pictures?.find(pic => pic.approved === true);
      // Fallback to first approved project picture
      const pic = updatePic || proj.pictures.find(pic => pic.approved === true);
      
      if (!pic) return null;
      
      return {
        id: `project-${pic.id}`,
        imageUrl: pic.imageUrl,
        caption: pic.caption,
        createdAt: pic.createdAt,
        observation: {
          id: proj.id,
          observedAt: proj.createdAt,
          user: {
            publicName: proj.user.publicName,
            name: proj.user.name,
          },
        },
        species: {
          name: proj.title,
          preferredCommonName: null,
          slug: '',
        },
        projectId: proj.id,
        projectTitle: proj.title,
      };
    })
    .filter((photo): photo is NonNullable<typeof photo> => photo !== null);

  const speciesPhotos = favoritesWithPhotos.map((fav) => ({
    id: `species-fav-${fav.id}`,
    imageUrl: fav.species.defaultPhotoUrl!,
    caption: fav.species.defaultPhotoAttribution || null,
    createdAt: fav.createdAt,
    species: {
      name: fav.species.name,
      preferredCommonName: fav.species.preferredCommonName,
      slug: fav.species.slug,
    },
    // No observation or projectId - this marks it as a species photo
  }));

  // Combine and shuffle photos
  const allPhotos = [...observationPhotos, ...projectPhotos, ...speciesPhotos].sort(() => Math.random() - 0.5);

  // Select 4 observations to display in cards
  const selectedObservations = observationsWithPictures.slice(0, 4);

  // Fetch unfunded conservation projects (not funded or completed)
  const unfundedProjectsRaw = await db.query.conservationProjects.findMany({
    where: lt(conservationProjects.currentFunding, conservationProjects.fundingGoal),
    with: {
      user: {
        columns: {
          publicName: true,
          name: true,
        },
      },
      pictures: true,
      updates: {
        with: {
          pictures: true,
        },
        orderBy: (updates, { desc }) => [desc(updates.createdAt)],
        limit: 1,
      },
    },
    orderBy: [desc(conservationProjects.createdAt)],
    limit: 20, // Get more to filter for approved images
  });

  // Filter to only projects where ALL images are approved
  const unfundedProjects = unfundedProjectsRaw.filter(proj => {
    const allProjectPicsApproved = proj.pictures.length === 0 || proj.pictures.every(pic => pic.approved === true);
    const allUpdatePicsApproved = !proj.updates?.[0]?.pictures || 
      proj.updates[0].pictures.length === 0 || 
      proj.updates[0].pictures.every(pic => pic.approved === true);
    
    return allProjectPicsApproved && allUpdatePicsApproved;
  }).slice(0, 3);

  // Fetch completed conservation projects
  const completedProjectsRaw = await db.query.conservationProjects.findMany({
    where: eq(conservationProjects.status, 'completed'),
    with: {
      user: {
        columns: {
          publicName: true,
          name: true,
        },
      },
      pictures: true,
      updates: {
        with: {
          pictures: true,
        },
        orderBy: (updates, { desc }) => [desc(updates.createdAt)],
        limit: 1,
      },
    },
    orderBy: [desc(conservationProjects.createdAt)],
    limit: 20, // Get more to filter for approved images
  });

  // Filter to only projects where ALL images are approved
  const completedProjects = completedProjectsRaw.filter(proj => {
    const allProjectPicsApproved = proj.pictures.length === 0 || proj.pictures.every(pic => pic.approved === true);
    const allUpdatePicsApproved = !proj.updates?.[0]?.pictures || 
      proj.updates[0].pictures.length === 0 || 
      proj.updates[0].pictures.every(pic => pic.approved === true);
    
    return allProjectPicsApproved && allUpdatePicsApproved;
  }).slice(0, 3);
  
  return (
    <main className="min-h-screen">
      {/* Hero Section and Recent Observations - Dark */}
      <div className="section bg-dark px-4">
        <div className="container-full">
            {/* Hero/Header */}
            <div className="text-center flex-gap-xs">
              <h1 className="text-white">Native Nature</h1>
              <p className="text-xl text-white">
                Discover and explore native species and conservation projects from around the world
              </p>
            </div>

            {/* Photo Gallery */}
            {allPhotos.length > 0 && (
              <div>
                <MasonryPhotoGallery photos={allPhotos} showTypeBadges={true} />
              </div>
            )}
        </div>
      </div>


      {/* World Map Section */}
      <div className="section bg-white">
        <div className="container-lg gap-2">
          <h2 className="text-center">Explore Species by Location</h2>
          <p className="text-center">
            Click on any country to explore its native species ({Object.keys(countries).length} countries available)
          </p>
          <WorldMap />
        </div>
      </div>


      {/* Conservation Projects Section */}

      {unfundedProjects.length > 0 && (
        <div className="section bg-light">
          <div className="container-lg">
            <h2 className="text-center">Support Conservation Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unfundedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} showFundedBadge={false} />
              ))}
            </div>
            <div className="text-center">
              <Link
                href="/conservation-projects"
                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                View All Projects →
              </Link>
            </div>
          </div>
        </div>
      )}
      

      {/* Recent Observations Row */}
      {selectedObservations.length > 0 && (
        <div className="section bg-slate-200">
          <div className="container-lg">
            <h2 className="text-center">Recent Observations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {selectedObservations.map((observation) => (
                <Link
                  key={`obs-${observation.id}`}
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
            <div className="text-center mt-8 flex gap-4 justify-center">
              <Link
                href="/recent-observations"
                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                View All Observations →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Completed Conservation Projects Section */}
      {completedProjects.length > 0 && (
        <div className="section bg-light">
            <div className="container-lg">
              <div className="flex-gap-xs">
                <h2 className="text-center">Completed Conservation Projects</h2>
                <p className="text-center">
                  Celebrate the success of these conservation efforts that have reached their goals and made a real impact.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} showFundedBadge={true} />
                ))}
              </div>
              <div className="text-center">
                <Link
                  href="/completed-conservation-projects"
                  className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  View All Completed Projects →
                </Link>
              </div>
            </div>
        </div>
      )}

      {/* Features Section */}
      <div className="section bg-white">
          <div className="container-lg">
            <h2 className="text-center">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center card bg-slate-50">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Maps</h3>
              <p className="text-muted">
                Explore species by country and region with interactive maps
              </p>
            </div>
            <div className="text-center card bg-slate-50">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Share Observations</h3>
              <p className="text-muted">
                Document and share your wildlife sightings with the community
              </p>
            </div>
            <div className="text-center card bg-slate-50">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Support Conservation</h3>
              <p className="text-muted">
                Fund projects that protect habitats and native species
              </p>
            </div>
            <div className="text-center card bg-slate-50">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Learn & Discover</h3>
              <p className="text-muted">
                Access detailed species information and conservation status
              </p>
            </div>
          </div>
          </div>

          </div>

    </main>
  );
}
