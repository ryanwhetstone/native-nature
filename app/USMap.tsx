'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Mapping of state abbreviations to full state names (kebab-case for URLs)
const stateAbbreviations: Record<string, string> = {
  al: 'alabama', ak: 'alaska', az: 'arizona', ar: 'arkansas', ca: 'california',
  co: 'colorado', ct: 'connecticut', de: 'delaware', fl: 'florida', ga: 'georgia',
  hi: 'hawaii', id: 'idaho', il: 'illinois', in: 'indiana', ia: 'iowa',
  ks: 'kansas', ky: 'kentucky', la: 'louisiana', me: 'maine', md: 'maryland',
  ma: 'massachusetts', mi: 'michigan', mn: 'minnesota', ms: 'mississippi',
  mo: 'missouri', mt: 'montana', ne: 'nebraska', nv: 'nevada', nh: 'new-hampshire',
  nj: 'new-jersey', nm: 'new-mexico', ny: 'new-york', nc: 'north-carolina',
  nd: 'north-dakota', oh: 'ohio', ok: 'oklahoma', or: 'oregon', pa: 'pennsylvania',
  ri: 'rhode-island', sc: 'south-carolina', sd: 'south-dakota', tn: 'tennessee',
  tx: 'texas', ut: 'utah', vt: 'vermont', va: 'virginia', wa: 'washington',
  wv: 'west-virginia', wi: 'wisconsin', wy: 'wyoming'
};

export function USMap() {
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const isInitializedRef = useRef(false);
  const hasSetInnerHTMLRef = useRef(false);

  useEffect(() => {
    // Fetch the SVG content
    fetch('/us-map.svg')
      .then(response => response.text())
      .then(svgText => {
        setSvgContent(svgText);
        hasSetInnerHTMLRef.current = false; // Reset when new content loads
      })
      .catch(error => console.error('Error loading SVG:', error));
  }, []);

  // Set innerHTML once when svgContent changes
  useEffect(() => {
    if (!svgContent || !containerRef.current || hasSetInnerHTMLRef.current) return;
    
    containerRef.current.innerHTML = svgContent;
    hasSetInnerHTMLRef.current = true;
  }, [svgContent]);

  // Separate effect to handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pathname === '/countries/usa') {
        // Force reinitialization when tab becomes visible and we're on USA page
        isInitializedRef.current = false;
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pathname]);

  useEffect(() => {
    if (!svgContent || !containerRef.current) return;
    
    const container = containerRef.current;
    const statePaths = container.querySelectorAll('path[class]');
    
    // Always mark as initialized when this effect runs
    isInitializedRef.current = true;
    
    const handlers = new Map<Element, { click: () => void; enter: () => void; leave: () => void }>();

    statePaths.forEach((path) => {
      const pathElement = path as SVGPathElement;
      const classList = pathElement.className.baseVal.split(' ');
      const stateAbbr = classList.find((c: string) => c.length === 2 && stateAbbreviations[c]);
      
      if (stateAbbr && stateAbbreviations[stateAbbr]) {
        const clickHandler = () => {
          router.push(`/states/${stateAbbreviations[stateAbbr]}`);
        };
        
        const enterHandler = () => {
          pathElement.style.fill = '#10b981';
        };
        
        const leaveHandler = () => {
          pathElement.style.fill = '#d1d5db';
        };

        handlers.set(path, { click: clickHandler, enter: enterHandler, leave: leaveHandler });

        // Reset and set all styles
        pathElement.style.cursor = 'pointer';
        pathElement.style.transition = 'fill 0.2s ease';
        pathElement.style.fill = '#d1d5db';
        pathElement.style.stroke = 'white';
        pathElement.style.strokeWidth = '1';
        pathElement.style.pointerEvents = 'auto';
        
        path.addEventListener('click', clickHandler);
        path.addEventListener('mouseenter', enterHandler);
        path.addEventListener('mouseleave', leaveHandler);
      }
    });

    return () => {
      // Clean up event listeners
      handlers.forEach((handler, path) => {
        path.removeEventListener('click', handler.click);
        path.removeEventListener('mouseenter', handler.enter);
        path.removeEventListener('mouseleave', handler.leave);
      });
      handlers.clear();
    };
  }, [svgContent, router, pathname]);

  return (
    <div className="w-full max-w-6xl mx-auto mb-12 relative">
      {svgContent && (
        <p className="text-center text-sm text-gray-600 mb-4">
          Click on any state to explore its native species
        </p>
      )}
      <div className={`w-full relative ${!svgContent ? 'min-h-[638px] flex items-center justify-center' : ''}`}>
        {!svgContent && (
          <p className="text-center text-gray-600 text-lg">Loading map...</p>
        )}
        {svgContent && (
          <div 
            ref={containerRef}
            className="w-full flex justify-center relative z-10"
            style={{ pointerEvents: 'auto' }}
          />
        )}
      </div>
    </div>
  );
}
