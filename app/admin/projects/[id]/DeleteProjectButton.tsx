'use client';

import { useState, useTransition } from 'react';

interface DeleteProjectButtonProps {
  projectId: number;
  deleteProject: (formData: FormData) => Promise<void>;
}

export default function DeleteProjectButton({ projectId, deleteProject }: DeleteProjectButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await deleteProject(formData);
    });
  };

  return (
    <form onSubmit={handleDelete}>
      <input type="hidden" name="id" value={projectId} />
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isPending ? 'Deleting...' : 'Delete Project'}
      </button>
    </form>
  );
}
