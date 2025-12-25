import { db } from '@/db';
import { conservationProjects } from '@/db/schema';
import { ne } from 'drizzle-orm';
import { desc } from 'drizzle-orm';
import ProjectCard from '@/app/components/ProjectCard';

export const metadata = {
  title: 'Conservation Projects | Native Nature',
  description: 'Support conservation efforts around the world',
};

export default async function ConservationProjectsPage() {
  // Fetch all projects that are not completed
  const projects = await db.query.conservationProjects.findMany({
    where: ne(conservationProjects.status, 'completed'),
    with: {
      user: {
        columns: {
          publicName: true,
          name: true,
        },
      },
      pictures: {
        limit: 1,
      },
      updates: {
        with: {
          pictures: {
            limit: 1,
          },
        },
        orderBy: (updates, { desc }) => [desc(updates.createdAt)],
        limit: 1,
      },
    },
    orderBy: [desc(conservationProjects.createdAt)],
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Conservation Projects</h1>
          <p className="text-lg text-gray-600">
            Support conservation efforts around the world. Every contribution helps protect wildlife and their habitats.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">No active conservation projects at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
