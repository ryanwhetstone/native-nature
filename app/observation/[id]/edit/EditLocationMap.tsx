'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface EditLocationMapProps {
  longitude: number;
  latitude: number;
  onLocationChange: (location: { lat: number; lng: number }) => void;
}

export default function EditLocationMap({ longitude, latitude, onLocationChange }: EditLocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Check for WebGL support
    if (!mapboxgl.supported()) {
      setWebglError(true);
      return;
    }

    try {
      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [longitude, latitude],
        zoom: 13,
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setWebglError(true);
      return;
    }

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Create draggable marker
    marker.current = new mapboxgl.Marker({ 
      color: '#3b82f6',
      draggable: true 
    })
      .setLngLat([longitude, latitude])
      .addTo(map.current);

    // Listen for marker drag events
    marker.current.on('dragend', () => {
      if (marker.current) {
        const lngLat = marker.current.getLngLat();
        onLocationChange({ lat: lngLat.lat, lng: lngLat.lng });
      }
    });

    // Allow clicking on map to move marker
    map.current.on('click', (e) => {
      if (marker.current) {
        marker.current.setLngLat([e.lngLat.lng, e.lngLat.lat]);
        onLocationChange({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      }
    });

    // Clean up on unmount
    return () => {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update marker position when props change
  useEffect(() => {
    if (marker.current) {
      marker.current.setLngLat([longitude, latitude]);
    }
  }, [longitude, latitude]);

  if (webglError) {
    return (
      <div className="w-full rounded-lg border border-gray-300 bg-gray-50 flex flex-col items-center justify-center p-8 text-center" style={{ height: '400px' }}>
        <div className="text-5xl mb-4">🗺️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Map Not Available</h3>
        <p className="text-gray-600 mb-4">
          Your browser doesn&apos;t support WebGL, which is required for the interactive map.
        </p>
        <p className="text-sm text-gray-500">
          The coordinates are saved. You can update them manually if needed.
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      className="w-full rounded-lg overflow-hidden"
      style={{ height: '400px' }}
    />
  );
}
