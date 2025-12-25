'use client';

import { useState } from 'react';
import { useToast } from '@/app/components/Toast';
import ProjectUpdateForm from './ProjectUpdateForm';
import Image from 'next/image';

type Update = {
  id: number;
  projectId: number;
  title: string;
  description: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    publicName: string | null;
  };
  pictures: {
    id: number;
    imageUrl: string;
    caption: string | null;
  }[];
};

export default function ManageUpdates({ 
  projectId,
  projectTitle,
  updates 
}: { 
  projectId: number;
  projectTitle: string;
  updates: Update[];
}) {
  const [editingUpdateId, setEditingUpdateId] = useState<number | null>(null);
  const [deletingUpdateId, setDeletingUpdateId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { showToast } = useToast();

  const handleDeleteConfirm = async (updateId: number) => {
    setDeletingUpdateId(updateId);
    setConfirmDeleteId(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/updates/${updateId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete update');
      }

      showToast('Update deleted successfully');
      window.location.reload();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete update';
      showToast(errorMessage, 'error');
      setDeletingUpdateId(null);
    }
  };

  const handleSuccess = () => {
    setEditingUpdateId(null);
    setShowCreateForm(false);
    showToast('Update saved successfully');
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Create New Update Button */}
      <div className="card">
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full btn-primary"
          >
            + Add New Update
          </button>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="heading-4">Create New Update</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
            <ProjectUpdateForm
              projectId={projectId}
              projectTitle={projectTitle}
              onSuccess={handleSuccess}
            />
          </div>
        )}
      </div>

      {/* Existing Updates */}
      <div className="card">
        <h3 className="heading-4 mb-4">
          Project Updates ({updates.length})
        </h3>

        {updates.length === 0 ? (
          <p className="text-muted">No updates yet. Create your first update above!</p>
        ) : (
          <div className="space-y-6">
            {updates.map((update) => (
              <div key={update.id} className="card-bordered">
                {editingUpdateId === update.id ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Edit Update</h4>
                      <button
                        onClick={() => setEditingUpdateId(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                    <ProjectUpdateForm
                      projectId={projectId}
                      projectTitle={projectTitle}
                      existingUpdate={update}
                      onSuccess={handleSuccess}
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{update.title}</h4>
                        <p className="text-small text-gray-500">
                          {new Date(update.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {confirmDeleteId === update.id ? (
                          // Show confirm/cancel buttons
                          <>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="btn-secondary text-sm"
                              disabled={deletingUpdateId === update.id}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDeleteConfirm(update.id)}
                              className="btn-danger text-sm"
                              disabled={deletingUpdateId === update.id}
                            >
                              {deletingUpdateId === update.id ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                          </>
                        ) : (
                          // Show normal edit/delete buttons
                          <>
                            <button
                              onClick={() => setEditingUpdateId(update.id)}
                              className="btn-secondary text-sm"
                              disabled={deletingUpdateId === update.id}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(update.id)}
                              className="btn-danger text-sm"
                              disabled={deletingUpdateId === update.id}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="prose prose-sm max-w-none mb-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{update.description}</p>
                    </div>

                    {/* Images */}
                    {update.pictures.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        {update.pictures.map((picture) => (
                          <div key={picture.id} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={picture.imageUrl}
                              alt={picture.caption || update.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 50vw, 33vw"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
