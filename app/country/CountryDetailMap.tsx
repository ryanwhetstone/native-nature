'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface CountryDetailMapProps {
  countryCode: string;
  countryName: string;
}

export default function CountryDetailMap({ countryCode, countryName }: CountryDetailMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [0, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    mapRef.current = map;

    // Add base tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Load world countries GeoJSON and zoom to specific country
    map.whenReady(() => {
      fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
        .then(response => response.json())
        .then(data => {
          if (!mapRef.current) return;
          
          let targetCountryLayer: L.Layer | null = null;

          const geoJsonLayer = L.geoJSON(data, {
            style: (feature) => {
              const featureCode = feature?.id || feature?.properties?.id;
              // Highlight the target country
              if (featureCode === countryCode) {
                return {
                  fillColor: '#10b981',
                  weight: 2,
                  opacity: 1,
                  color: '#059669',
                  fillOpacity: 0.6,
                };
              }
              // Show neighboring countries in gray
              return {
                fillColor: '#e5e7eb',
                weight: 1,
                opacity: 1,
                color: '#d1d5db',
                fillOpacity: 0.3,
              };
            },
            onEachFeature: (feature: any, layer: any) => {
              const featureCode = feature.id || feature.properties?.id;
              const featureName = feature.properties?.name || 'Unknown';

              // Add tooltip
              layer.bindTooltip(featureName, {
                permanent: false,
                direction: 'top',
              });

              // Store reference to target country layer
              if (featureCode === countryCode) {
                targetCountryLayer = layer;
              }
            },
          });
          
          if (mapRef.current) {
            geoJsonLayer.addTo(mapRef.current);

            // Zoom to the target country
            if (targetCountryLayer) {
              const bounds = (targetCountryLayer as L.Layer & { getBounds: () => L.LatLngBounds }).getBounds();
              mapRef.current.fitBounds(bounds, { padding: [50, 50] });
            }
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
  }, [countryCode, countryName]);

  return (
    <div className="w-full mb-8">
      <div 
        ref={mapContainerRef} 
        className="w-full h-[400px] rounded-lg border-2 border-gray-300 shadow-lg"
        style={{ zIndex: 0 }}
      />
    </div>
  );
}
