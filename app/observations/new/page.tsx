import { redirect } from "next/navigation";
import { auth } from "@/auth";
import NewObservationForm from "./NewObservationForm";

export default async function NewObservationPage({
  searchParams,
}: {
  searchParams: Promise<{ speciesId?: string; speciesName?: string; speciesSlug?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/observations/new");
  }

  const params = await searchParams;
  const speciesId = params.speciesId ? parseInt(params.speciesId) : undefined;
  const speciesName = params.speciesName;
  const speciesSlug = params.speciesSlug;

  if (!speciesId) {
    redirect("/");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Add New Observation</h1>
      <NewObservationForm speciesId={speciesId} speciesName={speciesName} speciesSlug={speciesSlug} />
    </div>
  );
}
