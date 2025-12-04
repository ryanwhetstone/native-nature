'use client';

import Link from "next/link";
import { USMap } from "../../USMap";
import { useEffect, useState } from "react";

const states = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming"
];

export default function USAPage() {
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    // Listen for when navigation happens to the current page
    const handleFocus = () => {
      setMapKey(prev => prev + 1);
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto mb-8">
        <Link 
          href="/"
          className="inline-flex items-center text-green-600 hover:text-green-700 font-medium mb-4"
        >
          ← Back to World
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">United States</h1>
        <p className="text-gray-600">Explore native species by state</p>
      </div>

      <USMap key={mapKey} />
      
      <h2 className="text-2xl font-semibold mb-6 text-center">Or select from the list below</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {states.map((state) => (
          <Link
            key={state}
            href={`/country/usa/place/${state.toLowerCase().replace(/\s+/g, "-")}`}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {state}
          </Link>
        ))}
      </div>
    </main>
  );
}
