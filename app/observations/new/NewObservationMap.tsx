'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface NewObservationMapProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  selectedLocation: { lat: number; lng: number } | null;
  lastLocation?: { lat: number; lng: number };
  onWebGLError?: (hasError: boolean) => void;
}

export default function NewObservationMap({ onLocationSelect, selectedLocation, lastLocation, onWebGLError }: NewObservationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Check for WebGL support
    if (!mapboxgl.supported()) {
      setWebglError(true);
      onWebGLError?.(true);
      return;
    }

    // Use last observation location if available, otherwise default to world view
    const initialCenter: [number, number] = lastLocation 
      ? [lastLocation.lng, lastLocation.lat]
      : [0, 0];
    const initialZoom = lastLocation ? 6 : 2; // Zoom 6 is approximately state level

    try {
      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: initialCenter,
        zoom: initialZoom,
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setWebglError(true);
      onWebGLError?.(true);
      return;
    }

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geocoder (search) control
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken || '',
      mapboxgl: mapboxgl as any,
      marker: false, // We'll handle the marker ourselves
      placeholder: 'Search for a city, state, or address',
    });

    map.current.addControl(geocoder, 'top-left');

    // Handle geocoder result
    geocoder.on('result', (e) => {
      const { center } = e.result;
      const [lng, lat] = center;
      
      // Create or update marker
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        marker.current = new mapboxgl.Marker({ 
          color: '#3b82f6',
          draggable: true 
        })
          .setLngLat([lng, lat])
          .addTo(map.current!);
        
        // Listen for marker drag events
        marker.current.on('dragend', () => {
          if (marker.current) {
            const lngLat = marker.current.getLngLat();
            onLocationSelect({ lat: lngLat.lat, lng: lngLat.lng });
          }
        });
      }
      
      // Update selected location
      onLocationSelect({ lat, lng });
      
      // Fly to the location
      map.current?.flyTo({
        center: [lng, lat],
        zoom: 12,
      });
    });

    // Allow clicking on map to select location
    map.current.on('click', (e) => {
      const { lat, lng } = e.lngLat;
      
      // Create or update marker
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        marker.current = new mapboxgl.Marker({ 
          color: '#3b82f6',
          draggable: true 
        })
          .setLngLat([lng, lat])
          .addTo(map.current!);
        
        // Listen for marker drag events
        marker.current.on('dragend', () => {
          if (marker.current) {
            const lngLat = marker.current.getLngLat();
            onLocationSelect({ lat: lngLat.lat, lng: lngLat.lng });
          }
        });
      }
      
      onLocationSelect({ lat, lng });
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
  }, [onLocationSelect]);

  // Update marker when selected location changes externally
  useEffect(() => {
    if (!selectedLocation || !map.current) return;

    if (marker.current) {
      marker.current.setLngLat([selectedLocation.lng, selectedLocation.lat]);
    } else {
      marker.current = new mapboxgl.Marker({ 
        color: '#3b82f6',
        draggable: true 
      })
        .setLngLat([selectedLocation.lng, selectedLocation.lat])
        .addTo(map.current);
      
      // Listen for marker drag events
      marker.current.on('dragend', () => {
        if (marker.current) {
          const lngLat = marker.current.getLngLat();
          onLocationSelect({ lat: lngLat.lat, lng: lngLat.lng });
        }
      });
    }
  }, [selectedLocation, onLocationSelect]);

  if (webglError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          To mark the location on an interactive map, use a browser that supports WebGL.
        </p>
        <p className="text-sm text-gray-600">
          To get the latitude and longitude coordinates manually, you can go to <a href="https://www.latlong.net/" target="_blank" rel="noopener noreferrer" className="text-green-600 underline">latlong.net</a>, find the location, and copy the coordinates below:
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
              value={selectedLocation?.lat ?? ''}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                if (!isNaN(lat)) {
                  onLocationSelect({ 
                    lat, 
                    lng: selectedLocation?.lng ?? 0 
                  });
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
              value={selectedLocation?.lng ?? ''}
              onChange={(e) => {
                const lng = parseFloat(e.target.value);
                if (!isNaN(lng)) {
                  onLocationSelect({ 
                    lat: selectedLocation?.lat ?? 0, 
                    lng 
                  });
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
      className="w-full h-96 rounded-lg overflow-hidden border border-gray-300"
    />
  );
}
