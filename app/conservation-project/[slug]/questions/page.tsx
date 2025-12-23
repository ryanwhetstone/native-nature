import { db } from "@/db";
import { conservationProjects, projectQuestions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import ManageQuestions from "../ManageQuestions";

export default async function ManageProjectQuestionsPage({ 
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

  // Fetch all questions for this project
  const questions = await db.query.projectQuestions.findMany({
    where: eq(projectQuestions.projectId, projectId),
    orderBy: [desc(projectQuestions.createdAt)],
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          publicName: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/conservation-project/${slug}`}
            className="inline-flex items-center text-green-600 hover:text-green-700 mb-4"
          >
            ← Back to Project
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Manage Questions</h1>
          <p className="text-gray-600">{project.title}</p>
        </div>

        {/* Questions Management */}
        <ManageQuestions projectId={project.id} questions={questions} />
      </div>
    </main>
  );
}
