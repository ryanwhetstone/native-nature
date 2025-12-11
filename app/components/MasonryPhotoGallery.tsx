'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getObservationUrl } from '@/lib/observation-url';

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

interface MasonryPhotoGalleryProps {
  photos: Photo[];
  columns?: {
    default: number;
    md?: number;
    lg?: number;
  };
}

export default function MasonryPhotoGallery({ 
  photos, 
  columns = { default: 2, md: 3, lg: 4 }
}: MasonryPhotoGalleryProps) {
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

  // Build proper Tailwind classes based on column configuration
  const getColumnClasses = () => {
    let classes = '';
    
    // Default columns
    if (columns.default === 1) classes += 'columns-1';
    else if (columns.default === 2) classes += 'columns-2';
    else if (columns.default === 3) classes += 'columns-3';
    else if (columns.default === 4) classes += 'columns-4';
    
    // Medium breakpoint
    if (columns.md === 1) classes += ' md:columns-1';
    else if (columns.md === 2) classes += ' md:columns-2';
    else if (columns.md === 3) classes += ' md:columns-3';
    else if (columns.md === 4) classes += ' md:columns-4';
    
    // Large breakpoint
    if (columns.lg === 1) classes += ' lg:columns-1';
    else if (columns.lg === 2) classes += ' lg:columns-2';
    else if (columns.lg === 3) classes += ' lg:columns-3';
    else if (columns.lg === 4) classes += ' lg:columns-4';
    
    return classes;
  };

  return (
    <>
      {/* Masonry Photo Grid */}
      <div className={`${getColumnClasses()} gap-4 space-y-4`}>
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => openLightbox(index)}
            className="group relative w-full break-inside-avoid mb-4 rounded-lg overflow-hidden bg-gray-100 cursor-pointer block"
          >
            <div className="relative w-full">
              <Image
                src={photo.imageUrl}
                alt={photo.species.preferredCommonName || photo.species.name}
                width={500}
                height={500}
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform"
              />
            </div>
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
                <p className="text-gray-400 text-sm mt-1">
                  <Link 
                    href={getObservationUrl(
                      photos[selectedIndex].observation.id,
                      photos[selectedIndex].species.name,
                      photos[selectedIndex].species.preferredCommonName
                    )}
                    className="hover:text-blue-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeLightbox();
                    }}
                    scroll={true}
                  >
                    Observed on {new Date(photos[selectedIndex].observation.observedAt).toLocaleDateString()}
                  </Link>
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
