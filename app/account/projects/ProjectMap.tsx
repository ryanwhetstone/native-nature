'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface ProjectMapProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  selectedLocation: { lat: number; lng: number } | null;
  initialLocation?: { lat: number; lng: number };
  onWebGLError?: (hasError: boolean) => void;
}

export default function ProjectMap({ onLocationSelect, selectedLocation, initialLocation, onWebGLError }: ProjectMapProps) {
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

    // Use initial location if available, otherwise default to world view
    const initialCenter: [number, number] = initialLocation 
      ? [initialLocation.lng, initialLocation.lat]
      : [0, 20];
    const initialZoom = initialLocation ? 6 : 2;

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
          color: '#16a34a',
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
          color: '#16a34a',
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
        color: '#16a34a',
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
      <div className="w-full h-96 bg-gray-100 rounded-lg flex flex-col items-center justify-center p-6 text-center">
        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="text-gray-600 mb-2">Interactive map is not available in your browser.</p>
        <p className="text-sm text-gray-500">Please enter coordinates manually or use a browser with WebGL support.</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-96 rounded-lg overflow-hidden border border-gray-300"
      style={{ minHeight: '400px' }}
    />
  );
}
