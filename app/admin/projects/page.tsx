import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { conservationProjects } from "@/db/schema";
import { count, or, ilike } from "drizzle-orm";
import Link from "next/link";
import { getProjectUrl } from "@/lib/project-url";
import { Pagination } from "../components/Pagination";
import { SearchBar } from "../components/SearchBar";

export const metadata = {
  title: 'Manage Projects | Admin | Native Nature',
  description: 'Manage conservation projects',
};

const ITEMS_PER_PAGE = 50;

export default async function AdminProjectsPage({
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

  // Build where clause for search
  const searchConditions = searchTerm
    ? or(
        ilike(conservationProjects.title, `%${searchTerm}%`),
        ilike(conservationProjects.country, `%${searchTerm}%`),
        ilike(conservationProjects.region, `%${searchTerm}%`),
        ilike(conservationProjects.city, `%${searchTerm}%`)
      )
    : undefined;

  const [{ count: totalCount }] = await db
    .select({ count: count() })
    .from(conservationProjects)
    .where(searchConditions);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const allProjects = await db.query.conservationProjects.findMany({
    where: searchConditions,
    orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    limit: ITEMS_PER_PAGE,
    offset: offset,
    with: {
      user: {
        columns: {
          publicName: true,
          name: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-light">
      <div className="container-lg">
        <div className="flex items-center justify-between">
          <div className="flex-gap-xs">
            <h1>Manage Projects</h1>
            <p className="text-muted">
              {totalCount} total projects
            </p>
          </div>
          <Link href="/admin" className="btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="section-card">
          <div className="mb-4">
            <SearchBar placeholder="Search by title or location..." />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funding</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allProjects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4">
                      <Link href={getProjectUrl(project.id, project.title)} className="text-blue-600 hover:underline">
                        {project.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.user.publicName || project.user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        project.status === 'active' ? 'bg-green-100 text-green-800' :
                        project.status === 'funded' ? 'bg-blue-100 text-blue-800' :
                        project.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${(project.currentFunding / 100).toLocaleString()} / ${(project.fundingGoal / 100).toLocaleString()}
                      <div className="text-xs text-gray-400">
                        {Math.round((project.currentFunding / project.fundingGoal) * 100)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {[project.city, project.region, project.country].filter(Boolean).join(', ') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/admin/projects/${project.id}`} className="text-blue-600 hover:text-blue-900">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/admin/projects" />
        </div>
      </div>
    </main>
  );
}
