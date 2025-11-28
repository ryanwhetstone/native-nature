'use client';

import { useState } from 'react';
import { ImageLightbox, LightboxGallery } from './ImageLightbox';

interface TaxonPhoto {
  medium_url: string;
  attribution: string;
  license_code: string;
}

interface Species {
  id: number;
  name: string;
  rank: string;
  preferred_common_name?: string;
  wikipedia_url?: string;
  observations_count: number;
  default_photo?: TaxonPhoto;
  taxon_photos?: Array<{ photo: TaxonPhoto }>;
  wikipedia_summary?: string;
  conservation_status?: {
    status: string;
    status_name: string;
  };
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
}

interface SpeciesGalleryProps {
  species: Species;
}

export function SpeciesGallery({ species }: SpeciesGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Collect all images
  const allImages: Array<{ src: string; alt: string; attribution: string }> = [];
  
  if (species.default_photo) {
    allImages.push({
      src: species.default_photo.medium_url,
      alt: species.preferred_common_name || species.name,
      attribution: `${species.default_photo.attribution} (${species.default_photo.license_code})`,
    });
  }

  if (species.taxon_photos && species.taxon_photos.length > 0) {
    // Skip first photo (it's the default) and take up to 9 more
    species.taxon_photos.slice(1, Math.min(10, species.taxon_photos.length)).forEach((item, index) => {
      allImages.push({
        src: item.photo.medium_url,
        alt: `${species.preferred_common_name || species.name} photo ${allImages.length + 1}`,
        attribution: item.photo.attribution,
      });
    });
  }

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {species.default_photo && (
          <div className="mb-8">
            <ImageLightbox
              images={allImages}
              currentIndex={0}
              onOpen={() => openLightbox(0)}
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
            <p className="text-xs text-gray-500 mt-2">
              Photo: {species.default_photo.attribution} ({species.default_photo.license_code})
            </p>
          </div>
        )}

        <h1 className="text-4xl font-bold mb-2">
          {species.preferred_common_name || species.name}
        </h1>
        <p className="text-2xl text-gray-600 italic mb-4">{species.name}</p>
        
        <div className="mb-6">
          <div className="text-sm text-gray-600 flex flex-wrap gap-1">
            {species.kingdom && <><span className="font-medium">Kingdom:</span> <span>{species.kingdom}</span> <span className="mx-1">›</span></>}
            {species.phylum && <><span className="font-medium">Phylum:</span> <span>{species.phylum}</span> <span className="mx-1">›</span></>}
            {species.class && <><span className="font-medium">Class:</span> <span>{species.class}</span> <span className="mx-1">›</span></>}
            {species.order && <><span className="font-medium">Order:</span> <span>{species.order}</span> <span className="mx-1">›</span></>}
            {species.family && <><span className="font-medium">Family:</span> <span>{species.family}</span> <span className="mx-1">›</span></>}
            {species.genus && <><span className="font-medium">Genus:</span> <span>{species.genus}</span></>}
          </div>
        </div>
        
        <div className="flex gap-4 mb-6 text-sm">
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
            {species.observations_count.toLocaleString()} observations
          </span>
          {species.conservation_status && (
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
              {species.conservation_status.status_name}
            </span>
          )}
        </div>

        {species.wikipedia_summary && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-3">About</h2>
            <div 
              className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: species.wikipedia_summary }}
            />
          </div>
        )}

        {species.wikipedia_url && (
          <div className="mb-6">
            <a
              href={species.wikipedia_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View on Wikipedia →
            </a>
          </div>
        )}

        {species.taxon_photos && species.taxon_photos.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-3">More Photos</h2>
            <div className="grid grid-cols-3 gap-4">
              {species.taxon_photos.slice(1, Math.min(10, species.taxon_photos.length)).map((item, index) => (
                <div key={index} className="rounded-lg overflow-hidden">
                  <ImageLightbox
                    images={allImages}
                    currentIndex={index + 1}
                    onOpen={() => openLightbox(index + 1)}
                    className="w-full h-48 object-cover"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {item.photo.attribution}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <LightboxGallery
        images={allImages}
        isOpen={lightboxOpen}
        currentIndex={currentImageIndex}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setCurrentImageIndex}
      />
    </>
  );
}
