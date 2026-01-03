import { db } from "@/db";
import { conservationProjects, projectUpdates } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import ManageUpdates from "../ManageUpdates";

export default async function ManageProjectUpdatesPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const session = await auth();
  const { slug } = await params;
  const projectId = parseInt(slug.split('-')[0]);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  if (isNaN(projectId)) {
    notFound();
  }

  const project = await db.query.conservationProjects.findFirst({
    where: eq(conservationProjects.id, projectId),
  });

  if (!project) {
    notFound();
  }

  // Check if user owns this project
  if (project.userId !== session.user.id) {
    notFound();
  }

  // Fetch all updates for this project
  const updates = await db.query.projectUpdates.findMany({
    where: eq(projectUpdates.projectId, projectId),
    orderBy: [desc(projectUpdates.createdAt)],
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          publicName: true,
        },
      },
      pictures: true,
    },
  });

  return (
    <>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/conservation-project/${slug}`}
            className="inline-flex items-center text-green-600 hover:text-green-700 mb-4"
          >
            ← Back to Project
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Manage Updates</h1>
          <p className="text-muted">{project.title}</p>
        </div>

        {/* Updates Management */}
        <ManageUpdates 
          projectId={project.id} 
          projectTitle={project.title}
          updates={updates} 
        />
      </div>
    
      </>
  );
}
