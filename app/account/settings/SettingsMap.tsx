'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface SettingsMapProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  selectedLocation: { lat: number; lng: number } | null;
}

function SettingsMap({ onLocationSelect, selectedLocation }: SettingsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [webglError, setWebglError] = useState(false);
  const [isClient, setIsClient] = useState(false);

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

    // Use selected location if available, otherwise default to world view
    const initialCenter: [number, number] = selectedLocation 
      ? [selectedLocation.lng, selectedLocation.lat]
      : [0, 0];
    const initialZoom = selectedLocation ? 10 : 2;

    try {
      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCenter,
        zoom: initialZoom,
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setWebglError(true);
      return;
    }

    // Wait for map to load before adding controls
    map.current.on('load', () => {
      if (!map.current) return;

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add geocoder (search) control
      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken || '',
        mapboxgl: mapboxgl as any,
        marker: false,
        placeholder: 'Search for your home location...',
      });

      map.current.addControl(geocoder, 'top-left');

      // Handle geocoder result
      geocoder.on('result', (e) => {
        const { center } = e.result;
        const [lng, lat] = center;
        
        if (marker.current) {
          marker.current.setLngLat([lng, lat]);
        } else {
          marker.current = new mapboxgl.Marker({ 
            color: '#16a34a',
            draggable: true 
          })
            .setLngLat([lng, lat])
            .addTo(map.current!);
          
          marker.current.on('dragend', () => {
            if (marker.current) {
              const lngLat = marker.current.getLngLat();
              onLocationSelect({ lat: lngLat.lat, lng: lngLat.lng });
            }
          });
        }
        
        onLocationSelect({ lat, lng });
        
        map.current?.flyTo({
          center: [lng, lat],
          zoom: 12,
        });
      });

      // Handle map clicks
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        
        if (marker.current) {
          marker.current.setLngLat([lng, lat]);
        } else {
          marker.current = new mapboxgl.Marker({ 
            color: '#16a34a',
            draggable: true 
          })
            .setLngLat([lng, lat])
            .addTo(map.current!);
          
          marker.current.on('dragend', () => {
            if (marker.current) {
              const lngLat = marker.current.getLngLat();
              onLocationSelect({ lat: lngLat.lat, lng: lngLat.lng });
            }
          });
        }
        
        onLocationSelect({ lat, lng });
      });

      // If there's already a selected location, add a marker
      if (selectedLocation) {
        marker.current = new mapboxgl.Marker({ 
          color: '#16a34a',
          draggable: true 
        })
          .setLngLat([selectedLocation.lng, selectedLocation.lat])
          .addTo(map.current!);
        
        marker.current.on('dragend', () => {
          if (marker.current) {
            const lngLat = marker.current.getLngLat();
            onLocationSelect({ lat: lngLat.lat, lng: lngLat.lng });
          }
        });
      }
    });

    // Cleanup
    return () => {
      if (marker.current) {
        marker.current.remove();
      }
      if (map.current) {
        map.current.remove();
      }
    };
  }, [isClient, selectedLocation, onLocationSelect]);

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
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div ref={mapContainer} className="w-full h-96 rounded-lg" />
      <p className="text-sm text-gray-600 mt-2">
        Click on the map to set your home location, or use the search box to find a specific place.
      </p>
    </div>
  );
}

export default dynamic(() => Promise.resolve(SettingsMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center p-6">
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});
