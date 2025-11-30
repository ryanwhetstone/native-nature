'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { FavoriteButton } from '@/app/components/FavoriteButton';

type FilterType = 'all' | 'native' | 'invasive';

interface Species {
  count: number;
  taxon: {
    id: number;
    name: string;
    preferred_common_name: string;
    default_photo?: {
      medium_url: string;
    };
    establishment_means?: {
      establishment_means: string;
      place: {
        id: number;
        name: string;
      };
    };
  };
}

interface SpeciesGridProps {
  initialPlants: Species[];
  placeId: number;
  taxonId: number;
}

export default function SpeciesGrid({ initialPlants, placeId, taxonId }: SpeciesGridProps) {
  const [species, setSpecies] = useState<Species[]>(initialPlants);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const getFilterParam = () => {
    if (filter === 'native') return '&native=true';
    if (filter === 'invasive') return '&introduced=true';
    return '';
  };

  const loadMoreSpecies = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/species/list?placeId=${placeId}&taxonId=${taxonId}&page=${page + 1}&filter=${filter}`
      );
      const data = await response.json();
      
      if (data.results.length === 0) {
        setHasMore(false);
      } else {
        setSpecies(prev => [...prev, ...data.results]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading more species:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (newFilter: FilterType) => {
    setFilter(newFilter);
    setLoading(true);
    setPage(1);
    setHasMore(true);

    try {
      const response = await fetch(
        `/api/species/list?placeId=${placeId}&taxonId=${taxonId}&page=1&filter=${newFilter}`
      );
      const data = await response.json();
      setSpecies(data.results);
    } catch (error) {
      console.error('Error filtering species:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMoreSpecies();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, page, filter]);

  return (
    <>
      <div className="flex gap-2 mb-6">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange('native')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'native'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Native
          </button>
          <button
            onClick={() => handleFilterChange('invasive')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'invasive'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
          Invasive
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {species.map((speciesItem) => {
          const isIntroduced = speciesItem.taxon.establishment_means?.establishment_means === 'introduced';
          
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
                {isIntroduced && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-600 text-white">
                      Invasive
                    </span>
                  </div>
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
                <p className="text-xs text-gray-500 mt-2">{speciesItem.count.toLocaleString()} observations</p>
              </div>
            </Link>
          );
        })}
      </div>
      
      <div ref={loadMoreRef} className="mt-8 text-center py-4">
        {loading && <p className="text-gray-600">Loading more species...</p>}
        {!hasMore && <p className="text-gray-500">No more species to load</p>}
      </div>
    </>
  );
}
