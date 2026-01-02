import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import NewProjectForm from "./NewProjectForm";

export default async function NewProjectPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/account/projects/new");
  }

  // Get user's home location
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  const homeLocation = user?.homeLat && user?.homeLng
    ? {
        lat: parseFloat(user.homeLat),
        lng: parseFloat(user.homeLng),
      }
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-semibold mb-6">Create Conservation Project</h1>
        <NewProjectForm homeLocation={homeLocation} />
      </div>
    </div>
  );
}
