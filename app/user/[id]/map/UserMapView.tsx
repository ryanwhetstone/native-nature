'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Link from 'next/link';
import Image from 'next/image';
import { getObservationUrl } from '@/lib/observation-url';
import { getProjectUrl } from '@/lib/project-url';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Observation {
  id: number;
  latitude: number;
  longitude: number;
  observedAt: Date;
  imageUrl: string | null;
  speciesName: string;
  speciesCommonName: string | null;
  speciesSlug: string | null;
}

interface Project {
  id: number;
  latitude: number;
  longitude: number;
  title: string;
  imageUrl: string | null;
}

interface UserMapViewProps {
  observations: Observation[];
  projects: Project[];
}

function UserMapView({ observations, projects }: UserMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [webglError, setWebglError] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: 'observation' | 'project'; data: Observation | Project } | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapContainer.current || map.current) return;

    // Check for WebGL support
    if (!mapboxgl.supported()) {
      setWebglError(true);
      return;
    }

    // Calculate bounds to fit all markers
    const allPoints = [
      ...observations.map(obs => [obs.longitude, obs.latitude] as [number, number]),
      ...projects.map(proj => [proj.longitude, proj.latitude] as [number, number]),
    ];

    const bounds = new mapboxgl.LngLatBounds();
    allPoints.forEach(point => bounds.extend(point));

    try {
      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: allPoints.length > 0 ? allPoints[0] : [0, 0],
        zoom: allPoints.length > 0 ? 10 : 2,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        if (!map.current) return;

        // Fit map to show all markers
        if (allPoints.length > 0) {
          map.current.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            maxZoom: 15,
          });
        }

        // Add observation markers
        observations.forEach(obs => {
          const el = document.createElement('div');
          el.className = 'observation-marker';
          el.style.width = '24px';
          el.style.height = '24px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = '#3b82f6';
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          el.style.cursor = 'pointer';

          const marker = new mapboxgl.Marker(el)
            .setLngLat([obs.longitude, obs.latitude])
            .addTo(map.current!);

          el.addEventListener('click', () => {
            setSelectedItem({ type: 'observation', data: obs });
          });
        });

        // Add project markers
        projects.forEach(proj => {
          const el = document.createElement('div');
          el.className = 'project-marker';
          el.style.width = '24px';
          el.style.height = '24px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = '#16a34a';
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          el.style.cursor = 'pointer';

          const marker = new mapboxgl.Marker(el)
            .setLngLat([proj.longitude, proj.latitude])
            .addTo(map.current!);

          el.addEventListener('click', () => {
            setSelectedItem({ type: 'project', data: proj });
          });
        });
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setWebglError(true);
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [isClient, observations, projects]);

  if (webglError) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-gray-600 mb-2">
            Unable to load map. Your browser may not support WebGL.
          </p>
          <p className="text-sm text-gray-500">
            Please try using a different browser or enable WebGL in your browser settings.
          </p>
        </div>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="w-full h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapContainer} className="w-full h-[600px] rounded-lg" />
      
      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-4 z-10">
        <h3 className="font-semibold mb-2 text-sm">Legend</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
            <span className="text-sm">Observations ({observations.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-600 border-2 border-white"></div>
            <span className="text-sm">Projects ({projects.length})</span>
          </div>
        </div>
      </div>

      {/* Selected Item Popup */}
      {selectedItem && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 z-10 max-w-sm w-full mx-4">
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {selectedItem.type === 'observation' ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs font-semibold text-gray-500 uppercase">Observation</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {(selectedItem.data as Observation).speciesCommonName || (selectedItem.data as Observation).speciesName}
              </h3>
              {(selectedItem.data as Observation).imageUrl && (
                <div className="relative w-full h-32 mb-2">
                  <Image 
                    src={(selectedItem.data as Observation).imageUrl!} 
                    alt="Observation" 
                    fill
                    className="object-cover rounded"
                  />
                </div>
              )}
              <p className="text-sm text-gray-600 mb-3">
                {new Date((selectedItem.data as Observation).observedAt).toLocaleDateString()}
              </p>
              <Link
                href={getObservationUrl(
                  (selectedItem.data as Observation).id,
                  (selectedItem.data as Observation).speciesSlug || (selectedItem.data as Observation).speciesName
                )}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Observation →
              </Link>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <span className="text-xs font-semibold text-gray-500 uppercase">Project</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {(selectedItem.data as Project).title}
              </h3>
              {(selectedItem.data as Project).imageUrl && (
                <div className="relative w-full h-32 mb-2">
                  <Image 
                    src={(selectedItem.data as Project).imageUrl!} 
                    alt="Project" 
                    fill
                    className="object-cover rounded"
                  />
                </div>
              )}
              <Link
                href={getProjectUrl((selectedItem.data as Project).id, (selectedItem.data as Project).title)}
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                View Project →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(UserMapView), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center p-6">
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});
