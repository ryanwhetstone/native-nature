'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { countries } from '@/lib/countries';

interface LeafletWorldMapProps {
  onCountryClick: (countryCode: string) => void;
}

export default function LeafletWorldMap({ onCountryClick }: LeafletWorldMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Get all available country ISO codes
  const availableCountries = Object.keys(countries);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 5,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    mapRef.current = map;

    // Add base tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Load world countries GeoJSON after map is ready
    map.whenReady(() => {
      fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
        .then(response => response.json())
        .then(data => {
          if (!mapRef.current) return; // Check if map still exists
          
          const geoJsonLayer = L.geoJSON(data, {
            style: () => ({
              fillColor: '#d1d5db',
              weight: 1,
              opacity: 1,
              color: '#ffffff',
              fillOpacity: 0.5,
            }),
            onEachFeature: (feature: any, layer: any) => {
              const countryName = feature.properties?.name || 'Unknown';
              const countryCode = feature.id || feature.properties?.id;

              // Add tooltip
              layer.bindTooltip(countryName, {
                permanent: false,
                direction: 'top',
              });

              // Hover effects
              layer.on({
                mouseover: (e: any) => {
                  const target = e.target;
                  // Highlight all available countries
                  if (availableCountries.includes(countryCode)) {
                    target.setStyle({
                      weight: 3,
                      color: '#10b981',
                      fillOpacity: 0.7,
                      fillColor: '#10b981',
                    });
                  } else {
                    target.setStyle({
                      weight: 2,
                      color: '#9ca3af',
                      fillOpacity: 0.6,
                    });
                  }
                },
                mouseout: (e: any) => {
                  const target = e.target;
                  target.setStyle({
                    weight: 1,
                    color: '#ffffff',
                    fillOpacity: 0.5,
                    fillColor: '#d1d5db',
                  });
                },
                click: () => {
                  // Check if country is available
                  if (availableCountries.includes(countryCode)) {
                    onCountryClick(countryCode);
                  }
                },
              });

              // Set cursor based on availability
              const element = (layer as any).getElement?.();
              if (element) {
                if (availableCountries.includes(countryCode)) {
                  element.style.cursor = 'pointer';
                } else {
                  element.style.cursor = 'not-allowed';
                }
              }
            },
          });
          
          if (mapRef.current) {
            geoJsonLayer.addTo(mapRef.current);
          }
        })
        .catch(error => console.error('Error loading GeoJSON:', error));
    });

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onCountryClick, availableCountries]);

  return (
      <div 
        ref={mapContainerRef} 
        className="w-full h-[500px] rounded-lg border-2 border-gray-300 shadow-lg"
        style={{ zIndex: 0 }}
      />
  );
}
