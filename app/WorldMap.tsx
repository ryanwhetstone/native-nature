'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { countries } from '@/lib/countries';

// Dynamically import the map component to avoid SSR issues with Leaflet
const LeafletWorldMap = dynamic<{ onCountryClick: (countryCode: string) => void }>(
  () => import('./LeafletWorldMap'), 
  {
    ssr: false,
    loading: () => (
      <div className="w-full relative">
        <div className="w-full relative min-h-[500px] flex items-center justify-center bg-gray-100 rounded-lg">
          <p className="text-center text-gray-600 text-lg">Loading map...</p>
        </div>
      </div>
    ),
  }
);

export function WorldMap() {
  const router = useRouter();

  const handleCountryClick = (countryCode: string) => {
    const country = countries[countryCode];
    if (country) {
      router.push(`/country/${country.slug}`);
    }
  };

  return <LeafletWorldMap onCountryClick={handleCountryClick} />;
}
