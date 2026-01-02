import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, inaturalistPlaces } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { AdminNav } from "../../components/AdminNav";

export const metadata = {
  title: 'Edit User | Admin | Native Nature',
  description: 'Edit user details',
};

async function updateUser(formData: FormData) {
  'use server';

  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const id = formData.get('id') as string;
  const role = formData.get('role') as string;
  const isActive = formData.get('isActive') === 'on';
  const publicName = formData.get('publicName') as string;

  await db
    .update(users)
    .set({
      role,
      isActive,
      publicName: publicName || null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));

  revalidatePath('/admin/users');
  redirect('/admin/users');
}

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const { id } = await params;

  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      homePlace: true,
    },
  });

  if (!user) {
    redirect('/admin/users');
  }

  return (
    <main className="min-h-screen bg-light">
      <AdminNav />
      <div className="section">
        <div className="container-lg">
          <div className="flex items-center justify-between mb-6">
            <h1>Edit User</h1>
            <Link href="/admin/users" className="btn-secondary">
              ← Back to Users
            </Link>
          </div>

          <div className="section-card">
            <form action={updateUser}>
              <input type="hidden" name="id" value={user.id} />

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="text"
                    value={user.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={user.name || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  />
                </div>

                <div>
                  <label htmlFor="publicName" className="block text-sm font-medium text-gray-700 mb-2">
                    Public Name
                  </label>
                  <input
                    type="text"
                    id="publicName"
                    name="publicName"
                    defaultValue={user.publicName || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    defaultValue={user.role || 'user'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    defaultChecked={user.isActive}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Active Account
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                  <Link href="/admin/users" className="btn-secondary">
                    Cancel
                  </Link>
                </div>
              </div>
            </form>
          </div>

          <div className="mt-6 section-card bg-gray-50">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">User ID:</dt>
                <dd className="font-mono text-gray-900">{user.id}</dd>
              </div>
              {user.homePlace && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Home Place:</dt>
                  <dd className="text-gray-900">
                    {user.homePlace.displayName || user.homePlace.placeName} ({user.homePlace.countryCode})
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-600">Created:</dt>
                <dd className="text-gray-900">{new Date(user.createdAt).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Updated:</dt>
                <dd className="text-gray-900">{new Date(user.updatedAt).toLocaleString()}</dd>
              </div>
              {user.lastLoginAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Last Login:</dt>
                  <dd className="text-gray-900">{new Date(user.lastLoginAt).toLocaleString()}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </main>
  );
}
