import { redirect } from "next/navigation";
import { auth } from "@/auth";
import NewObservationForm from "./NewObservationForm";

export default async function NewObservationPage({
  searchParams,
}: {
  searchParams: { speciesId?: string; speciesName?: string; speciesSlug?: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/observations/new");
  }

  const speciesId = searchParams.speciesId ? parseInt(searchParams.speciesId) : undefined;
  const speciesName = searchParams.speciesName;
  const speciesSlug = searchParams.speciesSlug;

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
