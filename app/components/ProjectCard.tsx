import Link from 'next/link';
import Image from 'next/image';
import { getProjectUrl } from '@/lib/project-url';

interface ProjectCardProps {
  project: {
    id: number;
    title: string;
    description: string;
    currentFunding: number;
    fundingGoal: number;
    status: string;
    pictures: Array<{ imageUrl: string }>;
    updates?: Array<{
      pictures: Array<{ imageUrl: string }>;
    }>;
    user: {
      publicName: string | null;
      name: string | null;
    };
  };
  showFundedBadge?: boolean;
}

export default function ProjectCard({ project, showFundedBadge = true }: ProjectCardProps) {
  const imageUrl = 
    project.updates?.[0]?.pictures[0]?.imageUrl || 
    project.pictures[0]?.imageUrl;
  const fundingPercentage = Math.min(100, (project.currentFunding / project.fundingGoal) * 100);
  const isFunded = project.status === 'funded';

  return (
    <Link
      href={getProjectUrl(project.id, project.title)}
      className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {imageUrl && (
        <div className="relative w-full aspect-video overflow-hidden">
          <Image
            src={imageUrl}
            alt={project.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {showFundedBadge && isFunded && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Funded
              </span>
            </div>
          )}
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 group-hover:text-green-600 transition-colors">
          {project.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {project.description}
        </p>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">${(project.currentFunding / 100).toLocaleString()} raised</span>
            <span className="font-medium">${(project.fundingGoal / 100).toLocaleString()} goal</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${fundingPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {Math.round(fundingPercentage)}% funded
          </p>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>by {project.user.publicName || project.user.name}</span>
          <span className="text-green-600 font-medium">Learn More →</span>
        </div>
      </div>
    </Link>
  );
}
