'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

export function DeleteProjectButton({ projectId }: { projectId: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      showToast('Project deleted successfully');

      // If we're on the project detail page, go to projects list
      // Otherwise just refresh the current page
      if (pathname?.startsWith('/conservation-project/')) {
        router.push('/account/projects');
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast('Failed to delete project. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isDeleting ? 'Deleting...' : 'Confirm'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="btn-danger"
    >
      Delete
    </button>
  );
}
