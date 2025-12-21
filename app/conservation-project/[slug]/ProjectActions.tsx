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
  const [isCompleting, setIsCompleting] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleMarkCompleted = async () => {
    if (!confirm('Are you sure you want to mark this project as completed? This indicates that all work is finished.')) {
      return;
    }

    setIsCompleting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/complete`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to complete project');
      }

      showToast('Project marked as completed! 🎉');
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
              onClick={handleMarkCompleted}
              disabled={isCompleting}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {isCompleting ? 'Completing...' : 'Mark as Completed'}
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
    </>
  );
}
