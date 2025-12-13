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
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          To mark the location on an interactive map, use a browser that supports WebGL.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="manual-lat" className="block text-sm font-medium text-gray-700 mb-1">
              Latitude
            </label>
            <input
              type="number"
              id="manual-lat"
              step="any"
              value={latitude}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                if (!isNaN(lat)) {
                  onLocationChange({ lat, lng: longitude });
                }
              }}
              placeholder="e.g., 40.7128"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label htmlFor="manual-lng" className="block text-sm font-medium text-gray-700 mb-1">
              Longitude
            </label>
            <input
              type="number"
              id="manual-lng"
              step="any"
              value={longitude}
              onChange={(e) => {
                const lng = parseFloat(e.target.value);
                if (!isNaN(lng)) {
                  onLocationChange({ lat: latitude, lng });
                }
              }}
              placeholder="e.g., -74.0060"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
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
