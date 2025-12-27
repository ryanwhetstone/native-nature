import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { species } from "@/db/schema";
import { count, or, ilike } from "drizzle-orm";
import Link from "next/link";
import { getSpeciesUrl } from "@/lib/species-url";
import { Pagination } from "../components/Pagination";
import { SearchBar } from "../components/SearchBar";

export const metadata = {
  title: 'Manage Species | Admin | Native Nature',
  description: 'Manage species database',
};

const ITEMS_PER_PAGE = 50;

export default async function AdminSpeciesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const searchTerm = params.search || '';
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Build where clause for search
  const searchConditions = searchTerm
    ? or(
        ilike(species.name, `%${searchTerm}%`),
        ilike(species.preferredCommonName, `%${searchTerm}%`)
      )
    : undefined;

  const [{ count: totalCount }] = await db
    .select({ count: count() })
    .from(species)
    .where(searchConditions);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const allSpecies = await db.query.species.findMany({
    where: searchConditions,
    orderBy: (species, { desc }) => [desc(species.createdAt)],
    limit: ITEMS_PER_PAGE,
    offset: offset,
  });

  return (
    <main className="min-h-screen bg-light">
      <div className="container-lg">
        <div className="flex items-center justify-between">
          <div className="flex-gap-xs">
            <h1>Manage Species</h1>
            <p className="text-muted">
              {totalCount} total species
            </p>
          </div>
          <Link href="/admin" className="btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="section-card">
          <div className="mb-4">
            <SearchBar placeholder="Search by scientific or common name..." />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Common Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scientific Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Native To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allSpecies.map((sp) => (
                  <tr key={sp.id}>
                    <td className="px-6 py-4">
                      <Link href={getSpeciesUrl(sp.slug || sp.id, sp.name, sp.preferredCommonName)} className="text-blue-600 hover:underline">
                        {sp.preferredCommonName || 'N/A'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 italic">
                      {sp.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sp.rank || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sp.conservationStatus && (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          sp.conservationStatus.includes('CR') || sp.conservationStatus.includes('EN') ? 'bg-red-100 text-red-800' :
                          sp.conservationStatus.includes('VU') || sp.conservationStatus.includes('NT') ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {sp.conservationStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {sp.nativeTo || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sp.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/admin/species/${sp.id}`} className="text-blue-600 hover:text-blue-900">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/admin/species" />
        </div>
      </div>
    </main>
  );
}
