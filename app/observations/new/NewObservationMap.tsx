'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface NewObservationMapProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  selectedLocation: { lat: number; lng: number } | null;
  lastLocation?: { lat: number; lng: number };
}

export default function NewObservationMap({ onLocationSelect, selectedLocation, lastLocation }: NewObservationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Use last observation location if available, otherwise default to world view
    const initialCenter: [number, number] = lastLocation 
      ? [lastLocation.lng, lastLocation.lat]
      : [0, 0];
    const initialZoom = lastLocation ? 6 : 2; // Zoom 6 is approximately state level

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: initialCenter,
      zoom: initialZoom,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

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

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-96 rounded-lg overflow-hidden border border-gray-300"
    />
  );
}
