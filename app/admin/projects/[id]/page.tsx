import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { conservationProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getProjectUrl } from "@/lib/project-url";
import { AdminNav } from "../../components/AdminNav";

export const metadata = {
  title: 'Edit Project | Admin | Native Nature',
  description: 'Edit project details',
};

async function updateProject(formData: FormData) {
  'use server';
  
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const id = Number(formData.get('id'));
  const status = formData.get('status') as string;
  const title = formData.get('title') as string;
  const fundingGoal = Number(formData.get('fundingGoal')) * 100; // Convert to cents

  await db
    .update(conservationProjects)
    .set({
      status,
      title,
      fundingGoal,
      updatedAt: new Date(),
    })
    .where(eq(conservationProjects.id, id));

  revalidatePath('/admin/projects');
  revalidatePath(`/conservation-project/${id}`);
  redirect('/admin/projects');
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const { id } = await params;

  const project = await db.query.conservationProjects.findFirst({
    where: eq(conservationProjects.id, Number(id)),
    with: {
      user: {
        columns: {
          publicName: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!project) {
    redirect('/admin/projects');
  }

  const fundingPercentage = (project.currentFunding / project.fundingGoal) * 100;

  return (
    <main className="min-h-screen bg-light">
      <AdminNav />
      <div className="container-lg">
        <div className="flex items-center justify-between mb-6">
          <h1>Edit Project</h1>
          <div className="flex gap-2">
            <Link href={getProjectUrl(project.id, project.title)} className="btn-secondary">
              View Project →
            </Link>
            <Link href="/admin/projects" className="btn-secondary">
              ← Back to Projects
            </Link>
          </div>
        </div>

        <div className="section-card">
          <form action={updateProject}>
            <input type="hidden" name="id" value={project.id} />
            
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  defaultValue={project.title}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={project.status}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="funded">Funded</option>
                  <option value="completed">Completed</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label htmlFor="fundingGoal" className="block text-sm font-medium text-gray-700 mb-2">
                  Funding Goal ($)
                </label>
                <input
                  type="number"
                  id="fundingGoal"
                  name="fundingGoal"
                  defaultValue={project.fundingGoal / 100}
                  min="0"
                  step="1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Funding
                  </label>
                  <input
                    type="text"
                    value={`$${(project.currentFunding / 100).toLocaleString()}`}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Progress
                  </label>
                  <input
                    type="text"
                    value={`${Math.round(fundingPercentage)}%`}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
                <Link href="/admin/projects" className="btn-secondary">
                  Cancel
                </Link>
              </div>
            </div>
          </form>
        </div>

        <div className="mt-6 section-card bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">Project Information</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Project ID:</dt>
              <dd className="font-mono text-gray-900">{project.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Creator:</dt>
              <dd className="text-gray-900">{project.user.publicName || project.user.name} ({project.user.email})</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Location:</dt>
              <dd className="text-gray-900">{[project.city, project.region, project.country].filter(Boolean).join(', ')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Created:</dt>
              <dd className="text-gray-900">{new Date(project.createdAt).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Updated:</dt>
              <dd className="text-gray-900">{new Date(project.updatedAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  );
}
