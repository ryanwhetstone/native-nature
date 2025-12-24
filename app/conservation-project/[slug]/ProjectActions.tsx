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
              className="btn-purple"
            >
              Give an Update
            </button>
            <button
              onClick={() => setShowCompleteModal(true)}
              disabled={isCompleting}
              className="btn-primary-sm btn-disabled"
            >
              Mark as Completed
            </button>
          </>
        )}
        {isCompleted && (
          <button
            onClick={() => setShowUpdateForm(true)}
            className="btn-purple"
          >
            Give an Update
          </button>
        )}
        <Link
          href={`/conservation-project/${projectId}-${projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/questions`}
          className="btn-indigo"
        >
          Manage Q&A
        </Link>
        <Link
          href={`/account/projects/${projectId}/edit`}
          className="btn-blue"
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
          className="modal-overlay"
          onClick={() => !isCompleting && setShowCompleteModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="heading-3 mb-4">Mark Project as Completed?</h2>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Marking a project as completed indicates that all conservation work has been accomplished for this project.
              </p>
              <p className="text-gray-700 mb-3">
                Once marked as completed:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                <li>The project status will change to &quot;Completed&quot;</li>
                <li>You can still post updates about the project</li>
                <li>Donors will see that the work has been successfully finished</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteModal(false)}
                disabled={isCompleting}
                className="btn-secondary flex-1 btn-disabled"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkCompleted}
                disabled={isCompleting}
                className="btn-primary flex-1 btn-disabled"
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
