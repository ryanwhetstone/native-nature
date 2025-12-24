'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FavoriteButton } from '@/app/components/FavoriteButton';

interface Species {
  count: number;
  taxon: {
    id: number;
    name: string;
    preferred_common_name: string;
    default_photo?: {
      medium_url: string;
    };
  };
}

interface FavoritesGridProps {
  species: Species[];
}

export function FavoritesGrid({ species }: FavoritesGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {species.map((speciesItem) => {
        return (
          <Link 
            key={speciesItem.taxon.id} 
            href={`/species/${speciesItem.taxon.id}-${speciesItem.taxon.preferred_common_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || speciesItem.taxon.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
            className="border border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow block"
          >
            <div className="relative h-48">
              {speciesItem.taxon.default_photo && (
                <Image
                  src={speciesItem.taxon.default_photo.medium_url}
                  alt={speciesItem.taxon.preferred_common_name || speciesItem.taxon.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}
              <div className="absolute bottom-2 right-2" onClick={(e) => e.preventDefault()}>
                <FavoriteButton speciesId={speciesItem.taxon.id} className="!px-2 !py-1 text-sm" />
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1">
                {speciesItem.taxon.preferred_common_name || speciesItem.taxon.name}
              </h3>
              <p className="text-sm text-gray-600 italic">{speciesItem.taxon.name}</p>
              {speciesItem.count > 0 && (
                <p className="text-xs text-gray-500 mt-2">{speciesItem.count.toLocaleString()} observations</p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
