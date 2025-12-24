'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

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
        style: 'mapbox://styles/mapbox/streets-v12',
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
      
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
        onLocationChange({ lat, lng });
        
        // Fly to the location
        map.current?.flyTo({
          center: [lng, lat],
          zoom: 12,
        });
      }
    });

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
  }, [latitude, longitude, onLocationChange]);

  // Update marker position when props change
  useEffect(() => {
    if (marker.current) {
      marker.current.setLngLat([longitude, latitude]);
    }
  }, [longitude, latitude]);

  if (webglError) {
    return (
      <div className="space-y-4">
        <p className="text-small">
          To mark the location on an interactive map, use a browser that supports WebGL.
        </p>
        <p className="text-small">
          To get the latitude and longitude coordinates manually, you can go to <a href="https://www.latlong.net/" target="_blank" rel="noopener noreferrer" className="text-green-600 underline">latlong.net</a>, find the location, and copy the coordinates below:
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="manual-lat" className="form-label">
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
            <label htmlFor="manual-lng" className="form-label">
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
