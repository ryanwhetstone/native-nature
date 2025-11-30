import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SettingsForm } from "./SettingsForm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Fetch full user data including bio
  const userData = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <SettingsForm user={userData || session.user} />
        </div>
      </div>
    </main>
  );
}
