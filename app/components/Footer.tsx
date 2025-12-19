import Link from "next/link";
import { db } from "@/db";
import { favorites, observations, species, conservationProjects } from "@/db/schema";
import { desc, sql, count } from "drizzle-orm";
import { getSpeciesUrl } from "@/lib/species-url";
import { getObservationUrl } from "@/lib/observation-url";
import { getProjectUrl } from "@/lib/project-url";

export async function Footer() {
  // Get 8 most recent conservation projects
  const recentProjects = await db
    .select({
      id: conservationProjects.id,
      title: conservationProjects.title,
      status: conservationProjects.status,
      createdAt: conservationProjects.createdAt,
    })
    .from(conservationProjects)
    .orderBy(desc(conservationProjects.createdAt))
    .limit(8);

  // Get top 8 most favorited species
  const topFavorites = await db
    .select({
      species: {
        id: species.id,
        taxonId: species.taxonId,
        name: species.name,
        preferredCommonName: species.preferredCommonName,
        slug: species.slug,
      },
      favCount: count(favorites.id),
    })
    .from(favorites)
    .innerJoin(species, sql`${favorites.speciesId} = ${species.id}`)
    .groupBy(species.id, species.taxonId, species.name, species.preferredCommonName, species.slug)
    .orderBy(desc(count(favorites.id)))
    .limit(8);

  // Get last 8 observed species (most recent unique species)
  const recentObservations = await db
    .selectDistinctOn([species.id], {
      observationId: observations.id,
      species: {
        id: species.id,
        taxonId: species.taxonId,
        name: species.name,
        preferredCommonName: species.preferredCommonName,
        slug: species.slug,
      },
      observedAt: observations.observedAt,
    })
    .from(observations)
    .innerJoin(species, sql`${observations.speciesId} = ${species.id}`)
    .orderBy(species.id, desc(observations.observedAt))
    .limit(8);

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: About */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Native Nature</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Discover and document the incredible biodiversity around you. Track your wildlife observations,
              explore species from around the world, and connect with nature in your local area.
            </p>
          </div>

          {/* Column 2: Recent Conservation Projects */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wide">
              Conservation Projects
            </h3>
            <ul className="space-y-2">
              {recentProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={getProjectUrl(project.id, project.title)}
                    className="text-sm hover:text-green-400 transition-colors line-clamp-1"
                  >
                    {project.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Most Favorited Species */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wide">
              Most Favorited
            </h3>
            <ul className="space-y-2">
              {topFavorites.map((item) => (
                <li key={item.species.id}>
                  <Link
                    href={getSpeciesUrl(item.species.slug, item.species.name, item.species.preferredCommonName)}
                    className="text-sm hover:text-green-400 transition-colors line-clamp-1"
                  >
                    {item.species.preferredCommonName || item.species.name} ({item.favCount})
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Recently Observed */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wide">
              <Link
                    href="/recent-observations"
                    >
                        Recent Observations
              </Link>   
            </h3>
            <ul className="space-y-2">
              {recentObservations.map((item) => (
                <li key={item.species.id}>
                  <Link
                    href={getObservationUrl(item.observationId, item.species.name, item.species.preferredCommonName)}
                    className="text-sm hover:text-green-400 transition-colors line-clamp-1"
                  >
                    {item.species.preferredCommonName || item.species.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Native Nature. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
