'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProjectUpdateForm from './ProjectUpdateForm';
import { useToast } from '@/app/components/Toast';
import { DeleteProjectButton } from '@/app/account/projects/DeleteProjectButton';

interface ProjectActionsProps {
  projectId: number;
  projectTitle: string;
  projectStatus: string;
  isOwner: boolean;
}

export default function ProjectActions({ projectId, projectTitle, projectStatus, isOwner }: ProjectActionsProps) {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleMarkCompleted = async () => {
    setIsCompleting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/complete`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to complete project');
      }

      showToast('Project marked as completed! 🎉');
      setShowCompleteModal(false);
      router.refresh();
    } catch (error) {
      console.error('Error completing project:', error);
      showToast('Failed to complete project. Please try again.', 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  if (!isOwner) return null;

  const isFunded = projectStatus === 'funded';
  const isCompleted = projectStatus === 'completed';

  return (
    <>
      <div className="flex-shrink-0 flex gap-2">
        {isFunded && !isCompleted && (
          <>
            <button
              onClick={() => setShowUpdateForm(true)}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors whitespace-nowrap"
            >
              Give an Update
            </button>
            <button
              onClick={() => setShowCompleteModal(true)}
              disabled={isCompleting}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              Mark as Completed
            </button>
          </>
        )}
        {isCompleted && (
          <button
            onClick={() => setShowUpdateForm(true)}
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors whitespace-nowrap"
          >
            Give an Update
          </button>
        )}
        <Link
          href={`/conservation-project/${projectId}-${projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/questions`}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          Manage Q&A
        </Link>
        <Link
          href={`/account/projects/${projectId}/edit`}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          Edit
        </Link>
        <DeleteProjectButton projectId={projectId} />
      </div>

      {showUpdateForm && (
        <ProjectUpdateForm
          projectId={projectId}
          projectTitle={projectTitle}
          onClose={() => setShowUpdateForm(false)}
        />
      )}

      {/* Complete Project Modal */}
      {showCompleteModal && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={() => !isCompleting && setShowCompleteModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mark Project as Completed?</h2>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Marking a project as completed indicates that all conservation work has been accomplished for this project.
              </p>
              <p className="text-gray-700 mb-3">
                Once marked as completed:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                <li>The project status will change from &quot;Funded&quot; to &quot;Completed&quot;</li>
                <li>You can still post updates about the project</li>
                <li>Donors will see that the work has been successfully finished</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteModal(false)}
                disabled={isCompleting}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkCompleted}
                disabled={isCompleting}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
              >
                {isCompleting ? 'Completing...' : 'Mark as Completed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
