import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, observations, conservationProjects, observationPictures, projectPictures, projectUpdatePictures, projectUpdates } from "@/db/schema";
import { count, or, ilike, sql, eq } from "drizzle-orm";
import Link from "next/link";
import { Pagination } from "../components/Pagination";
import { SearchBar } from "../components/SearchBar";
import { AdminNav } from "../components/AdminNav";
import { DeleteUserButton } from "./DeleteUserButton";
import { ImpersonateButton } from "./ImpersonateButton";
import { revalidatePath } from "next/cache";

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

  // Get counts for each user
  const userCounts = await Promise.all(
    allUsers.map(async (user) => {
      const [obsCount] = await db.select({ count: count() }).from(observations).where(eq(observations.userId, user.id));
      const [projCount] = await db.select({ count: count() }).from(conservationProjects).where(eq(conservationProjects.userId, user.id));

      // Count photos: observation photos + project photos + project update photos
      const [obsPicCount] = await db.select({ count: count() })
        .from(observationPictures)
        .innerJoin(observations, eq(observationPictures.observationId, observations.id))
        .where(eq(observations.userId, user.id));

      const [projPicCount] = await db.select({ count: count() })
        .from(projectPictures)
        .innerJoin(conservationProjects, eq(projectPictures.projectId, conservationProjects.id))
        .where(eq(conservationProjects.userId, user.id));

      const [updatePicCount] = await db.select({ count: count() })
        .from(projectUpdatePictures)
        .innerJoin(projectUpdates, eq(projectUpdatePictures.updateId, projectUpdates.id))
        .innerJoin(conservationProjects, eq(projectUpdates.projectId, conservationProjects.id))
        .where(eq(conservationProjects.userId, user.id));

      return {
        userId: user.id,
        observationsCount: obsCount?.count || 0,
        projectsCount: projCount?.count || 0,
        photosCount: (obsPicCount?.count || 0) + (projPicCount?.count || 0) + (updatePicCount?.count || 0),
      };
    })
  );

  const userCountsMap = new Map(userCounts.map(c => [c.userId, c]));

  async function deleteUser(userId: string) {
    'use server';
    await db.delete(users).where(eq(users.id, userId));
    revalidatePath('/admin/users');
  }

  return (
    <>
      <AdminNav />
      <div className="section">
        <div className="container-lg">
          <div className="flex items-center justify-between">
            <div className="flex-gap-xs">
              <h1>Manage Users</h1>
              <p className="text-muted">
                {totalCount} total users
              </p>
            </div>
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
                  {allUsers.map((user) => {
                    const counts = userCountsMap.get(user.id) || { observationsCount: 0, projectsCount: 0, photosCount: 0 };
                    return (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link href={`/user/${user.id}/profile`} className="text-blue-600 hover:underline">
                            {user.publicName || user.name || 'Anonymous'}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                          <ImpersonateButton userId={user.id} userName={user.publicName || user.name || 'Anonymous'} />
                          <DeleteUserButton
                            userId={user.id}
                            userName={user.publicName || user.name || 'Anonymous'}
                            email={user.email || ''}
                            observationsCount={counts.observationsCount}
                            projectsCount={counts.projectsCount}
                            photosCount={counts.photosCount}
                            deleteUser={deleteUser}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/admin/users" />
          </div>
        </div>
      </div>
    
      </>
  );
}
