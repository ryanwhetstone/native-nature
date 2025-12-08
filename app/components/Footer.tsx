import Link from "next/link";
import { db } from "@/db";
import { favorites, observations, species } from "@/db/schema";
import { desc, sql, count } from "drizzle-orm";

export async function Footer() {
  // Get top 8 countries by observation count
  const topCountries = await db
    .select({
      country: observations.country,
      count: count(observations.id),
    })
    .from(observations)
    .where(sql`${observations.country} IS NOT NULL`)
    .groupBy(observations.country)
    .orderBy(desc(count(observations.id)))
    .limit(8);

  // Get top 8 most favorited species
  const topFavorites = await db
    .select({
      species: {
        id: species.id,
        taxonId: species.taxonId,
        name: species.name,
        preferredCommonName: species.preferredCommonName,
      },
      favCount: count(favorites.id),
    })
    .from(favorites)
    .innerJoin(species, sql`${favorites.speciesId} = ${species.id}`)
    .groupBy(species.id, species.taxonId, species.name, species.preferredCommonName)
    .orderBy(desc(count(favorites.id)))
    .limit(8);

  // Get last 8 observed species (most recent unique species)
  const recentObservations = await db
    .selectDistinctOn([species.id], {
      species: {
        id: species.id,
        taxonId: species.taxonId,
        name: species.name,
        preferredCommonName: species.preferredCommonName,
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
            <h3 className="text-white text-lg font-bold mb-4">Native Nature</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Discover and document the incredible biodiversity around you. Track your wildlife observations,
              explore species from around the world, and connect with nature in your local area.
            </p>
          </div>

          {/* Column 2: Top Countries */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wide">
              Countries
            </h3>
            <ul className="space-y-2">
              {topCountries.map((item) => (
                <li key={item.country}>
                  <Link
                    href={`/country/${item.country?.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-sm hover:text-green-400 transition-colors"
                  >
                    {item.country} ({item.count})
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
                    href={`/species/${item.species.taxonId}-${item.species.preferredCommonName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || item.species.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
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
                    href={`/species/${item.species.taxonId}-${item.species.preferredCommonName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || item.species.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
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
