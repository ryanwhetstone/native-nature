'use client';

import { useState } from 'react';
import MasonryPhotoGallery from '@/app/components/MasonryPhotoGallery';

interface Photo {
  id: number | string;
  imageUrl: string;
  observation?: {
    id: number;
    observedAt: Date;
    user: {
      publicName: string | null;
      name: string | null;
    };
  };
  species: {
    name: string;
    preferredCommonName: string | null;
    slug?: string;
  };
  caption?: string | null;
  projectId?: number;
  projectTitle?: string;
  createdAt: Date;
}

interface PhotosGalleryWithLoadMoreProps {
  allPhotos: Photo[];
  initialCount?: number;
  loadMoreCount?: number;
}

export default function PhotosGalleryWithLoadMore({
  allPhotos,
  initialCount = 20,
  loadMoreCount = 10,
}: PhotosGalleryWithLoadMoreProps) {
  const [visibleCount, setVisibleCount] = useState(initialCount);

  const visiblePhotos = allPhotos.slice(0, visibleCount);
  const hasMore = visibleCount < allPhotos.length;

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + loadMoreCount, allPhotos.length));
  };

  return (
    <div>
      {allPhotos.length > 0 ? (
        <>
          <MasonryPhotoGallery photos={visiblePhotos} showTypeBadges={true} />
          
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                className="px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Load More ({allPhotos.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-muted">No photos yet</p>
        </div>
      )}
    </div>
  );
}
