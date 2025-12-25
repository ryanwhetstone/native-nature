'use client';

import MasonryPhotoGallery from '@/app/components/MasonryPhotoGallery';
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
  // Transform taxon photos into MasonryPhotoGallery format
  const galleryPhotos: any[] = [];
  
  // Add default photo first
  if (species.defaultPhotoUrl) {
    galleryPhotos.push({
      id: `taxon-default`,
      imageUrl: species.defaultPhotoUrl,
      caption: `${species.defaultPhotoAttribution || 'Unknown'} (${species.defaultPhotoLicense || 'Unknown'})`,
      createdAt: new Date(),
      species: {
        name: species.name,
        preferredCommonName: species.preferredCommonName,
        slug: slug,
      },
      // No observation or projectId - this marks it as a species photo
    });
  }

  // Add additional taxon photos
  if (species.taxonPhotos && Array.isArray(species.taxonPhotos)) {
    // Skip first photo (it's the default) and take up to 11 more (total 12)
    species.taxonPhotos.slice(1, Math.min(12, species.taxonPhotos.length)).forEach((item: any, index: number) => {
      galleryPhotos.push({
        id: `taxon-${index}`,
        imageUrl: item.photo.medium_url,
        caption: item.photo.attribution,
        createdAt: new Date(),
        species: {
          name: species.name,
          preferredCommonName: species.preferredCommonName,
          slug: slug,
        },
      });
    });
  }

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
          {galleryPhotos.length > 0 && (
            <div className="mb-8">
              <MasonryPhotoGallery photos={galleryPhotos} currentSpeciesSlug={slug} />
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
    </>
  );
}
