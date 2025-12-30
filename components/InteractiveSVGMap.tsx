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
  const svgFileName = config?.svgFileName;
  const regionIdPrefix = config?.regionIdPrefix;

  useEffect(() => {
    if (!svgFileName) return;
    
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
    if (!svgContent || !containerRef.current || !regionIdPrefix) return;

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

    const handleMouseEnter = (event: Event) => {
      const target = event.target as SVGPathElement;
      
      if (target.tagName === 'path' && target.id && target.id.startsWith(regionIdPrefix)) {
        // Remove hover class from previous region
        if (hoveredRegion) {
          const prevPath = container.querySelector<SVGPathElement>(`path[id="${hoveredRegion}"]`);
          if (prevPath) {
            prevPath.classList.remove('region-hover');
          }
        }
        
        // Add hover class to new region
        target.classList.add('region-hover');
        setHoveredRegion(target.id);
      }
    };

    const handleMouseLeave = (event: Event) => {
      const target = event.target as SVGPathElement;
      
      if (target.tagName === 'path' && target.id && target.id.startsWith(regionIdPrefix)) {
        target.classList.remove('region-hover');
        setHoveredRegion(null);
      }
    };

    container.addEventListener("click", handleContainerClick);
    container.addEventListener("mouseenter", handleMouseEnter, true);
    container.addEventListener("mouseleave", handleMouseLeave, true);

    return () => {
      container.removeEventListener("click", handleContainerClick);
      container.removeEventListener("mouseenter", handleMouseEnter, true);
      container.removeEventListener("mouseleave", handleMouseLeave, true);
    };
  }, [svgContent, router, countrySlug, hoveredRegion, regionIdPrefix]);

  if (!config) {
    return <div className="p-4 text-gray-500">Interactive map not available for this country</div>;
  }

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
        #interactive-svg-container path[id^="${regionIdPrefix || ""}"] {
          fill: #e9edf2;
          stroke: #616e80;
          stroke-width: 1;
          cursor: pointer;
          transition: fill 0.2s ease;
        }
        #interactive-svg-container path.region-hover {
          fill: #5a8a60 !important;
        }
        #interactive-svg-container svg {
          max-height: 60vh;
          height: 100%;
          width: 100%;
        }
      `}} />
      <div
        id="interactive-svg-container"
        ref={containerRef}
        className="w-full h-auto"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      {hoveredRegion && (
        <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-10">
          <div className="bg-green-800 text-white px-3 py-2 rounded shadow-lg">
            <p className="text-sm font-medium text-white">
              {getSvgRegionInfoForCountry(countrySlug, hoveredRegion)?.name || hoveredRegion}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
