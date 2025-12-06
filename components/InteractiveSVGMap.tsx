"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { getSVGConfigForCountry, getSvgRegionSlugForCountry, getSvgRegionInfoForCountry } from "@/lib/svg-mappings";

interface InteractiveSVGMapProps {
  countrySlug: string;
}

export default function InteractiveSVGMap({ 
  countrySlug
}: InteractiveSVGMapProps) {
  const router = useRouter();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  const config = getSVGConfigForCountry(countrySlug);
  
  if (!config) {
    return <div className="p-4 text-gray-500">Interactive map not available for this country</div>;
  }

  const { svgFileName, regionIdPrefix } = config;

  useEffect(() => {
    // Load the SVG file
    fetch(`/${svgFileName}`)
      .then((response) => response.text())
      .then((svg) => {
        setSvgContent(svg);
      })
      .catch((error) => {
        console.error("Error loading SVG:", error);
      });
  }, [svgFileName]);

  useEffect(() => {
    if (!svgContent || !containerRef.current) return;

    const container = containerRef.current;

    // Use event delegation on the container
    const handleContainerClick = (event: MouseEvent) => {
      const target = event.target as SVGPathElement;
      
      if (target.tagName === 'path' && target.id && target.id.startsWith(regionIdPrefix)) {
        const slug = getSvgRegionSlugForCountry(countrySlug, target.id);
        if (slug) {
          router.push(`/place/${countrySlug}/${slug}`);
        }
      }
    };

    const handleContainerMouseMove = (event: MouseEvent) => {
      const target = event.target as SVGPathElement;
      
      if (target.tagName === 'path' && target.id && target.id.startsWith(regionIdPrefix)) {
        if (hoveredRegion !== target.id) {
          setHoveredRegion(target.id);
        }
      } else if (hoveredRegion !== null) {
        setHoveredRegion(null);
      }
    };

    container.addEventListener("click", handleContainerClick);
    container.addEventListener("mousemove", handleContainerMouseMove);

    return () => {
      container.removeEventListener("click", handleContainerClick);
      container.removeEventListener("mousemove", handleContainerMouseMove);
    };
  }, [svgContent, router, countrySlug, hoveredRegion, regionIdPrefix]);

  if (!svgContent) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <style dangerouslySetInnerHTML={{ __html: `
        #interactive-svg-container path[id^="${regionIdPrefix}"] {
          fill: #d1d5db;
          stroke: #4b5563;
          stroke-width: 1;
          cursor: pointer;
          transition: fill 0.2s ease;
        }
        #interactive-svg-container path[id^="${regionIdPrefix}"]:hover {
          fill: #5a8a60 !important;
        }
        #interactive-svg-container svg {
          max-height: 60vh;
          height: 100%;
        }
      `}} />
      <div
        id="interactive-svg-container"
        ref={containerRef}
        className="w-full h-auto"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      {hoveredRegion && (
        <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded shadow-lg z-10 pointer-events-none">
          <p className="text-sm font-medium">
            {getSvgRegionInfoForCountry(countrySlug, hoveredRegion)?.name || hoveredRegion}
          </p>
        </div>
      )}
    </div>
  );
}
