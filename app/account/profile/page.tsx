import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Fetch full user data
  const userData = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!userData) {
    redirect("/auth/signin");
  }

  const memberSince = new Date(userData.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-green-500 to-emerald-600"></div>
          
          <div className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="flex items-end -mt-16 mb-4">
              {userData.image ? (
                <img
                  src={userData.image}
                  alt={userData.name || "User"}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-green-600 flex items-center justify-center text-white text-4xl font-semibold">
                  {userData.name?.charAt(0).toUpperCase() || userData.email?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              
              <Link
                href="/account/settings"
                className="ml-auto mb-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Edit Profile
              </Link>
            </div>

            {/* User Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">{userData.name || "No name set"}</h1>
                <p className="text-muted">{userData.email}</p>
              </div>

              {userData.bio && (
                <div className="pt-4 border-t border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">Bio</h2>
                  <p className="text-gray-600 whitespace-pre-wrap">{userData.bio}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Member Since</p>
                    <p className="font-semibold text-gray-900">{memberSince}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Account Status</p>
                    <p className="font-semibold text-gray-900">
                      {userData.isActive ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-red-600">Inactive</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity</h2>
          <div className="text-center py-12 text-gray-500">
            <p>No activity yet. Start exploring species to see your activity here!</p>
          </div>
        </div>
      </div>
    </main>
  );
}
