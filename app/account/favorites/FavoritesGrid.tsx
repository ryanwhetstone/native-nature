'use client';

import Link from 'next/link';
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
            href={`/species/${speciesItem.taxon.id}`}
            className="border border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow block"
          >
            <div className="relative">
              {speciesItem.taxon.default_photo && (
                <img
                  src={speciesItem.taxon.default_photo.medium_url}
                  alt={speciesItem.taxon.preferred_common_name || speciesItem.taxon.name}
                  className="w-full h-48 object-cover"
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
