'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Photo {
  id: number;
  imageUrl: string;
  observation: {
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
  };
}

interface PhotoLightboxProps {
  photos: Photo[];
}

export default function PhotoLightbox({ photos }: PhotoLightboxProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
    document.body.style.overflow = 'unset';
  };

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % photos.length);
    }
  };

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'ArrowLeft') goToPrevious();
  };

  return (
    <>
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => openLightbox(index)}
            className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
          >
            <Image
              src={photo.imageUrl}
              alt={photo.species.preferredCommonName || photo.species.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm font-medium line-clamp-2">
                  {photo.species.preferredCommonName || photo.species.name}
                </p>
                <p className="text-gray-300 text-xs mt-1">
                  {new Date(photo.observation.observedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 text-white hover:text-gray-300 z-50"
              aria-label="Previous"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image Container */}
          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <div className="relative w-full h-[80vh] flex items-center justify-center">
                <Image
                  src={photos[selectedIndex].imageUrl}
                  alt={photos[selectedIndex].species.preferredCommonName || photos[selectedIndex].species.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1400px"
                  priority
                />
              </div>
              
              {/* Image Info */}
              <div className="mt-4 text-center">
                <h3 className="text-white text-xl font-semibold">
                  {photos[selectedIndex].species.preferredCommonName || photos[selectedIndex].species.name}
                </h3>
                <p className="text-gray-300 text-sm mt-1">
                  {photos[selectedIndex].species.name}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {new Date(photos[selectedIndex].observation.observedAt).toLocaleDateString()}
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  Uploaded by {photos[selectedIndex].observation.user.publicName || photos[selectedIndex].observation.user.name || 'Anonymous'}. All rights reserved.
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  {selectedIndex + 1} of {photos.length}
                </p>
              </div>
            </div>
          </div>

          {/* Next Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 text-white hover:text-gray-300 z-50"
              aria-label="Next"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </>
  );
}
