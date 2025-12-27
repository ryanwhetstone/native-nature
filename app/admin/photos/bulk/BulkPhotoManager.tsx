'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';

type Photo = {
  id: number;
  imageUrl: string;
  type: 'observation' | 'project' | 'project-update';
  approved: boolean | null;
  title: string;
};

type BulkPhotoManagerProps = {
  photos: Photo[];
  bulkUpdateApproval: (photoIds: number[], type: 'observation' | 'project' | 'project-update', approved: boolean) => Promise<void>;
};

export function BulkPhotoManager({ photos, bulkUpdateApproval }: BulkPhotoManagerProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const togglePhoto = (photoKey: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoKey)) {
      newSelected.delete(photoKey);
    } else {
      newSelected.add(photoKey);
    }
    setSelectedPhotos(newSelected);
  };

  const handleBulkApprove = () => {
    if (selectedPhotos.size === 0) return;

    const photosByType = Array.from(selectedPhotos).reduce((acc, key) => {
      const [type, id] = key.split(':');
      if (!acc[type as keyof typeof acc]) {
        acc[type as keyof typeof acc] = [];
      }
      acc[type as keyof typeof acc].push(Number(id));
      return acc;
    }, {} as Record<string, number[]>);

    startTransition(async () => {
      for (const [type, ids] of Object.entries(photosByType)) {
        await bulkUpdateApproval(ids, type as 'observation' | 'project' | 'project-update', true);
      }
      setSelectedPhotos(new Set());
    });
  };

  const handleBulkDisapprove = () => {
    if (selectedPhotos.size === 0) return;

    const photosByType = Array.from(selectedPhotos).reduce((acc, key) => {
      const [type, id] = key.split(':');
      if (!acc[type as keyof typeof acc]) {
        acc[type as keyof typeof acc] = [];
      }
      acc[type as keyof typeof acc].push(Number(id));
      return acc;
    }, {} as Record<string, number[]>);

    startTransition(async () => {
      for (const [type, ids] of Object.entries(photosByType)) {
        await bulkUpdateApproval(ids, type as 'observation' | 'project' | 'project-update', false);
      }
      setSelectedPhotos(new Set());
    });
  };

  const selectAll = () => {
    setSelectedPhotos(new Set(photos.map(p => `${p.type}:${p.id}`)));
  };

  const deselectAll = () => {
    setSelectedPhotos(new Set());
  };

  return (
    <div>
      <div className="section-card mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedPhotos.size} selected
            </span>
            <button
              onClick={selectAll}
              className="text-sm text-blue-600 hover:text-blue-700"
              disabled={isPending}
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="text-sm text-blue-600 hover:text-blue-700"
              disabled={isPending}
            >
              Deselect All
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkApprove}
              disabled={selectedPhotos.size === 0 || isPending}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Processing...' : 'Bulk Approve'}
            </button>
            <button
              onClick={handleBulkDisapprove}
              disabled={selectedPhotos.size === 0 || isPending}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Processing...' : 'Bulk Disapprove'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {photos.map((photo) => {
          const photoKey = `${photo.type}:${photo.id}`;
          const isSelected = selectedPhotos.has(photoKey);
          
          return (
            <div
              key={photoKey}
              className={`relative group cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${
                isSelected ? 'border-blue-500' : 'border-transparent'
              } ${
                photo.approved === true ? 'ring-2 ring-green-500' : 
                photo.approved === false ? 'ring-2 ring-red-500' : ''
              }`}
              onClick={() => togglePhoto(photoKey)}
            >
              <div className="aspect-square relative bg-gray-100">
                <Image
                  src={photo.imageUrl}
                  alt={photo.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                />
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                    ✓
                  </div>
                )}
                {photo.approved === true && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    Approved
                  </div>
                )}
                {photo.approved === false && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    Disapproved
                  </div>
                )}
              </div>
              <div className="p-2 bg-white">
                <p className="text-xs text-gray-600 truncate">{photo.title}</p>
                <p className="text-xs text-gray-400 capitalize">{photo.type.replace('-', ' ')}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
