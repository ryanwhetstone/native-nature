import { redirect } from "next/navigation";
import { auth } from "@/auth";
import NewProjectForm from "./NewProjectForm";

export default async function NewProjectPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/account/projects/new");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-semibold mb-6">Create Conservation Project</h1>
        <NewProjectForm />
      </div>
    </div>
  );
}
