import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { count, or, ilike, sql } from "drizzle-orm";
import Link from "next/link";
import { Pagination } from "../components/Pagination";
import { SearchBar } from "../components/SearchBar";

export const metadata = {
  title: 'Manage Users | Admin | Native Nature',
  description: 'Manage site users',
};

const ITEMS_PER_PAGE = 50;

export default async function AdminUsersPage({
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
        ilike(users.name, `%${searchTerm}%`),
        ilike(users.email, `%${searchTerm}%`),
        ilike(users.publicName, `%${searchTerm}%`)
      )
    : undefined;

  const [{ count: totalCount }] = await db
    .select({ count: count() })
    .from(users)
    .where(searchConditions);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const allUsers = await db.query.users.findMany({
    where: searchConditions,
    orderBy: (users, { desc }) => [desc(users.createdAt)],
    limit: ITEMS_PER_PAGE,
    offset: offset,
    columns: {
      id: true,
      name: true,
      email: true,
      publicName: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  return (
    <main className="min-h-screen bg-light">
      <div className="container-lg">
        <div className="flex items-center justify-between">
          <div className="flex-gap-xs">
            <h1>Manage Users</h1>
            <p className="text-muted">
              {totalCount} total users
            </p>
          </div>
          <Link href="/admin" className="btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="section-card">
          <div className="mb-4">
            <SearchBar placeholder="Search by name or email..." />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/user/${user.id}/profile`} className="text-blue-600 hover:underline">
                        {user.publicName || user.name || 'Anonymous'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/admin/users/${user.id}`} className="text-blue-600 hover:text-blue-900">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/admin/users" />
        </div>
      </div>
    </main>
  );
}
