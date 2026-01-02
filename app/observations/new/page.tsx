import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { observations, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import NewObservationForm from "./NewObservationForm";

export default async function NewObservationPage({
  searchParams,
}: {
  searchParams: Promise<{ speciesId?: string; speciesName?: string; speciesSlug?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/observations/new");
  }

  const params = await searchParams;
  const speciesId = params.speciesId ? parseInt(params.speciesId) : undefined;
  const speciesName = params.speciesName;
  const speciesSlug = params.speciesSlug;

  if (!speciesId) {
    redirect("/");
  }

  // Get user's home location
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  let defaultLocation = undefined;

  // Use home location if it exists
  if (user?.homeLat && user?.homeLng) {
    defaultLocation = {
      lat: parseFloat(user.homeLat),
      lng: parseFloat(user.homeLng),
    };
  } else {
    // Otherwise, get user's last observation location
    const lastObservation = await db.query.observations.findFirst({
      where: eq(observations.userId, session.user.id),
      orderBy: [desc(observations.createdAt)],
    });

    if (lastObservation) {
      defaultLocation = {
        lat: parseFloat(lastObservation.latitude),
        lng: parseFloat(lastObservation.longitude),
      };
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-semibold mb-6">Add New Observation</h1>
      <NewObservationForm 
        speciesId={speciesId} 
        speciesName={speciesName} 
        speciesSlug={speciesSlug}
        lastLocation={defaultLocation}
      />
    </div>
  );
}
