import { auth } from "@/auth";
import { db } from "@/db";
import { conservationProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import EditProjectForm from "./EditProjectForm";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  
  const project = await db.query.conservationProjects.findFirst({
    where: eq(conservationProjects.id, parseInt(id)),
  });

  if (!project) {
    return {
      title: 'Project Not Found | Native Nature',
    };
  }

  return {
    title: `Edit ${project.title} | Native Nature`,
  };
}

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { id } = await params;

  const project = await db.query.conservationProjects.findFirst({
    where: eq(conservationProjects.id, parseInt(id)),
    with: {
      pictures: true,
    },
  });

  if (!project) {
    notFound();
  }

  // Check if current user is the owner
  if (project.userId !== session.user.id) {
    redirect(`/account/projects/${id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-semibold mb-6">Edit Conservation Project</h1>
        <EditProjectForm project={project} />
      </div>
    </div>
  );
}
