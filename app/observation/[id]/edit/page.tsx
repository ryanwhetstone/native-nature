import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { observations } from "@/db/schema";
import { eq } from "drizzle-orm";
import EditObservationForm from "./EditObservationForm";

export default async function EditObservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const observation = await db.query.observations.findFirst({
    where: eq(observations.id, parseInt(id)),
    with: {
      species: true,
      pictures: true,
    },
  });

  if (!observation) {
    notFound();
  }

  // Only allow owner to edit
  if (observation.userId !== session.user.id) {
    redirect(`/observation/${id}`);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Edit Observation</h1>
      <EditObservationForm observation={observation} />
    </div>
  );
}
