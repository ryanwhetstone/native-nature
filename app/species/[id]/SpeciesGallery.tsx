'use client';

import { useState } from 'react';
import { ImageLightbox, LightboxGallery } from './ImageLightbox';
import { FavoriteButton } from '@/app/components/FavoriteButton';
import { AddObservationButton } from '@/app/components/AddObservationButton';
import { BackButton } from './BackButton';

interface TaxonPhoto {
  medium_url: string;
  attribution: string;
  license_code: string;
}

interface Species {
  id: number;
  taxonId: number; // iNaturalist taxon ID
  name: string;
  rank: string;
  preferredCommonName?: string | null;
  wikipediaUrl?: string | null;
  observationsCount?: number | null;
  defaultPhotoUrl?: string | null;
  defaultPhotoAttribution?: string | null;
  defaultPhotoLicense?: string | null;
  taxonPhotos?: any; // JSONB field from database
  wikipediaSummary?: string | null;
  conservationStatus?: string | null;
  conservationStatusName?: string | null;
  kingdom?: string | null;
  phylum?: string | null;
  class?: string | null;
  order?: string | null;
  family?: string | null;
  genus?: string | null;
}

interface SpeciesGalleryProps {
  species: Species;
  slug: string;
}

export function SpeciesGallery({ species, slug }: SpeciesGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Collect all images - convert to format expected by MasonryPhotoGallery
  const allImages: Array<{ src: string; alt: string; attribution: string }> = [];
  
  if (species.defaultPhotoUrl) {
    allImages.push({
      src: species.defaultPhotoUrl,
      alt: species.preferredCommonName || species.name,
      attribution: `${species.defaultPhotoAttribution || 'Unknown'} (${species.defaultPhotoLicense || 'Unknown'})`,
    });
  }

  if (species.taxonPhotos && Array.isArray(species.taxonPhotos)) {
    // Skip first photo (it's the default) and take up to 11 more (total 12)
    species.taxonPhotos.slice(1, Math.min(12, species.taxonPhotos.length)).forEach((item: any, index: number) => {
      allImages.push({
        src: item.photo.medium_url,
        alt: `${species.preferredCommonName || species.name} photo ${allImages.length + 1}`,
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
      {/* Dark section for header and photo gallery */}
      <div className="bg-slate-900 py-8">
        <div className="w-full px-4">
          {/* Header with Back Button and Actions */}
          <div className="flex justify-between items-center mb-8">
            <BackButton />
            <div className="flex items-center gap-3">
              <AddObservationButton 
                speciesId={species.id}
                speciesName={species.preferredCommonName || species.name}
                speciesSlug={slug}
              />
              <FavoriteButton speciesId={species.taxonId} showLabel={true} />
            </div>
          </div>

          {/* Species Info */}
          <div className="max-w-7xl mx-auto mb-8">
            <h1 className="text-4xl font-semibold text-white mb-2">
              {species.preferredCommonName || species.name}
            </h1>
            <p className="text-2xl text-gray-400 italic mb-4">{species.name}</p>
            
            <div className="flex gap-4 mb-4 text-sm">
              <span className="bg-green-600 text-white px-3 py-1 rounded-full">
                {(species.observationsCount || 0).toLocaleString()} observations
              </span>
              {species.conservationStatusName && (
                <span className="bg-yellow-600 text-white px-3 py-1 rounded-full">
                  {species.conservationStatusName}
                </span>
              )}
            </div>
          </div>

          {/* Photo Gallery */}
          {allImages.length > 0 && (
            <div className="mb-8">
              <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => openLightbox(index)}
                    className="group relative w-full break-inside-avoid mb-4 rounded-lg overflow-hidden bg-gray-100 cursor-pointer block"
                  >
                    <div className="relative w-full">
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-auto object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs">
                          {image.attribution}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Light section for content */}
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Taxonomy */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-3">Taxonomy</h2>
            <div className="text-sm text-gray-600 flex flex-wrap gap-1">
              {species.kingdom && <><span className="font-medium">Kingdom:</span> <span>{species.kingdom}</span> <span className="mx-1">›</span></>}
              {species.phylum && <><span className="font-medium">Phylum:</span> <span>{species.phylum}</span> <span className="mx-1">›</span></>}
              {species.class && <><span className="font-medium">Class:</span> <span>{species.class}</span> <span className="mx-1">›</span></>}
              {species.order && <><span className="font-medium">Order:</span> <span>{species.order}</span> <span className="mx-1">›</span></>}
              {species.family && <><span className="font-medium">Family:</span> <span>{species.family}</span> <span className="mx-1">›</span></>}
              {species.genus && <><span className="font-medium">Genus:</span> <span>{species.genus}</span></>}
            </div>
          </div>

          {/* About Section */}
          {species.wikipediaSummary && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-3">About</h2>
              <div 
                className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: species.wikipediaSummary }}
              />
            </div>
          )}
        </div>
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
