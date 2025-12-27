import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { observations, species as speciesTable } from "@/db/schema";
import { count, or, ilike, eq } from "drizzle-orm";
import Link from "next/link";
import { getObservationUrl } from "@/lib/observation-url";
import { Pagination } from "../components/Pagination";
import { SearchBar } from "../components/SearchBar";

export const metadata = {
  title: 'Manage Observations | Admin | Native Nature',
  description: 'Manage wildlife observations',
};

const ITEMS_PER_PAGE = 50;

export default async function AdminObservationsPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const currentPage = Number(searchParams.page) || 1;
  const searchTerm = searchParams.search || '';
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // For observations, we need to join with species to search by species name
  let totalCount = 0;
  let allObservations;

  if (searchTerm) {
    // Search with species name filter
    const results = await db
      .select({ 
        observation: observations,
        speciesName: speciesTable.name,
        speciesCommonName: speciesTable.preferredCommonName,
      })
      .from(observations)
      .innerJoin(speciesTable, eq(observations.speciesId, speciesTable.id))
      .where(
        or(
          ilike(speciesTable.name, `%${searchTerm}%`),
          ilike(speciesTable.preferredCommonName, `%${searchTerm}%`),
          ilike(observations.country, `%${searchTerm}%`),
          ilike(observations.region, `%${searchTerm}%`)
        )
      );
    
    totalCount = results.length;
    const observationIds = results.slice(offset, offset + ITEMS_PER_PAGE).map(r => r.observation.id);
    
    // Fetch full observation data with relations
    allObservations = await db.query.observations.findMany({
      where: (obs, { inArray }) => inArray(obs.id, observationIds),
      with: {
        user: {
          columns: {
            publicName: true,
            name: true,
          },
        },
        species: {
          columns: {
            name: true,
            preferredCommonName: true,
          },
        },
        pictures: true,
      },
    });
  } else {
    const [{ count: cnt }] = await db.select({ count: count() }).from(observations);
    totalCount = cnt;
    
    allObservations = await db.query.observations.findMany({
      orderBy: (observations, { desc }) => [desc(observations.createdAt)],
      limit: ITEMS_PER_PAGE,
      offset: offset,
      with: {
        user: {
          columns: {
            publicName: true,
            name: true,
          },
        },
        species: {
          columns: {
            name: true,
            preferredCommonName: true,
          },
        },
        pictures: true,
      },
    });
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <main className="min-h-screen bg-light">
      <div className="container-lg">
        <div className="flex items-center justify-between">
          <div className="flex-gap-xs">
            <h1>Manage Observations</h1>
            <p className="text-muted">
              {totalCount} total observations
            </p>
          </div>
          <Link href="/admin" className="btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="section-card">
          <div className="mb-4">
            <SearchBar placeholder="Search by species or location..." />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Species</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allObservations.map((observation) => (
                  <tr key={observation.id}>
                    <td className="px-6 py-4">
                      <Link 
                        href={getObservationUrl(observation.id, observation.species.name, observation.species.preferredCommonName)} 
                        className="text-blue-600 hover:underline"
                      >
                        {observation.species.preferredCommonName || observation.species.name}
                      </Link>
                      {observation.species.preferredCommonName && (
                        <div className="text-xs text-gray-500 italic">{observation.species.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {observation.user.publicName || observation.user.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {[observation.city, observation.region, observation.country].filter(Boolean).join(', ') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {observation.pictures.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(observation.observedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(observation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/admin/observations/${observation.id}`} className="text-blue-600 hover:text-blue-900">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/admin/observations" />
        </div>
      </div>
    </main>
  );
}
