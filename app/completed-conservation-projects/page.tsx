import { db } from '@/db';
import { conservationProjects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { desc } from 'drizzle-orm';
import ProjectCard from '@/app/components/ProjectCard';

export const metadata = {
  title: 'Completed Conservation Projects | Native Nature',
  description: 'Celebrate successful conservation efforts that have reached their goals',
};

export default async function CompletedConservationProjectsPage() {
  // Fetch all completed projects
  const projects = await db.query.conservationProjects.findMany({
    where: eq(conservationProjects.status, 'completed'),
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
          <h1 className="text-4xl font-bold mb-4">Completed Conservation Projects</h1>
          <p className="text-lg text-gray-600">
            These conservation efforts have successfully reached their goals and made a lasting impact on wildlife and their habitats. 
            Thank you to all the supporters who made these projects possible!
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">No completed conservation projects yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} showFundedBadge={false} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
