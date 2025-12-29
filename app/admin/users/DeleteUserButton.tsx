'use client';

import { useState, useTransition } from 'react';

type UserDeleteInfo = {
  userId: string;
  userName: string;
  email: string;
  observationsCount: number;
  projectsCount: number;
  photosCount: number;
  deleteUser: (userId: string) => Promise<void>;
};

export function DeleteUserButton({ userId, userName, email, observationsCount, projectsCount, photosCount, deleteUser }: UserDeleteInfo) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteUser(userId);
      setIsModalOpen(false);
    });
  };

  const hasContent = observationsCount > 0 || projectsCount > 0 || photosCount > 0;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-red-600 hover:text-red-900 ml-3"
        disabled={isPending}
      >
        Delete
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Delete User</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">
                Are you sure you want to delete this user?
              </p>
              <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-3">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-gray-600">{email}</p>
              </div>

              {hasContent && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm font-semibold text-red-800 mb-2">
                    ⚠️ The following will also be permanently deleted:
                  </p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {observationsCount > 0 && (
                      <li>• {observationsCount} observation{observationsCount !== 1 ? 's' : ''}</li>
                    )}
                    {projectsCount > 0 && (
                      <li>• {projectsCount} conservation project{projectsCount !== 1 ? 's' : ''}</li>
                    )}
                    {photosCount > 0 && (
                      <li>• {photosCount} photo{photosCount !== 1 ? 's' : ''}</li>
                    )}
                  </ul>
                  <p className="text-xs text-red-600 mt-2 font-medium">
                    This action cannot be undone.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isPending}
              >
                {isPending ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
