'use client';

import { useState, useEffect } from 'react';

interface ImageData {
  src: string;
  alt: string;
  attribution: string;
}

interface ImageLightboxProps {
  images: ImageData[];
  currentIndex: number;
  onOpen: () => void;
  className?: string;
}

interface LightboxGalleryProps {
  images: ImageData[];
  isOpen: boolean;
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function LightboxGallery({ images, isOpen, currentIndex, onClose, onNavigate }: LightboxGalleryProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const handlePrevious = () => {
    onNavigate(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  };

  const handleNext = () => {
    onNavigate(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  };

  if (!isOpen) return null;

  const currentImage = images[currentIndex];
  const largeSrc = currentImage.src.replace('/medium.', '/large.');

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        aria-label="Close lightbox"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Previous Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePrevious();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10"
        aria-label="Previous image"
      >
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10"
        aria-label="Next image"
      >
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
        <img
          src={largeSrc}
          alt={currentImage.alt}
          className="max-w-full max-h-[85vh] object-contain"
        />
        <div className="text-white text-sm mt-4 text-center">
          <p>{currentImage.attribution}</p>
          <p className="text-gray-400 mt-2">
            {currentIndex + 1} / {images.length}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ImageLightbox({ images, currentIndex, onOpen, className }: ImageLightboxProps) {
  const currentImage = images[currentIndex];
  
  return (
    <img
      src={currentImage.src}
      alt={currentImage.alt}
      className={`${className} cursor-pointer hover:opacity-90 transition-opacity`}
      onClick={onOpen}
    />
  );
}

export { LightboxGallery };
