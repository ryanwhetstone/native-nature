import { db } from "@/db";
import { conservationProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getProjectUrl } from "@/lib/project-url";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await db.query.conservationProjects.findFirst({
    where: eq(conservationProjects.id, parseInt(id)),
  });

  if (!project) {
    notFound();
  }

  // Redirect to public URL with slug
  redirect(getProjectUrl(project.id, project.title));
}
