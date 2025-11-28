'use client';

import { useRouter } from 'next/navigation';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    // Fetch the SVG content
    fetch('/us-map.svg')
      .then(response => response.text())
      .then(svgText => setSvgContent(svgText))
      .catch(error => console.error('Error loading SVG:', error));
  }, []);

  useEffect(() => {
    if (!svgContent || !containerRef.current) return;

    const container = containerRef.current;
    const statePaths = container.querySelectorAll('path[class]');
    
    const handlers = new Map<Element, { click: () => void; enter: () => void; leave: () => void }>();

    statePaths.forEach((path) => {
      const classList = (path as SVGPathElement).className.baseVal.split(' ');
      const stateAbbr = classList.find((c: string) => c.length === 2 && stateAbbreviations[c]);
      
      if (stateAbbr && stateAbbreviations[stateAbbr]) {
        const clickHandler = () => {
          router.push(`/states/${stateAbbreviations[stateAbbr]}`);
        };
        
        const enterHandler = () => {
          (path as SVGPathElement).style.fill = '#10b981';
        };
        
        const leaveHandler = () => {
          (path as SVGPathElement).style.fill = '#d1d5db';
        };

        handlers.set(path, { click: clickHandler, enter: enterHandler, leave: leaveHandler });

        (path as SVGPathElement).style.cursor = 'pointer';
        (path as SVGPathElement).style.transition = 'fill 0.2s ease';
        (path as SVGPathElement).style.fill = '#d1d5db';
        (path as SVGPathElement).style.stroke = 'white';
        (path as SVGPathElement).style.strokeWidth = '1';
        
        path.addEventListener('click', clickHandler);
        path.addEventListener('mouseenter', enterHandler);
        path.addEventListener('mouseleave', leaveHandler);
      }
    });

    return () => {
      handlers.forEach((handler, path) => {
        path.removeEventListener('click', handler.click);
        path.removeEventListener('mouseenter', handler.enter);
        path.removeEventListener('mouseleave', handler.leave);
      });
    };
  }, [svgContent, router]);

  return (
    <div className="w-full max-w-6xl mx-auto mb-12">
      {svgContent && (
        <p className="text-center text-sm text-gray-600 mb-4">
          Click on any state to explore its native species
        </p>
      )}
      <div className={`w-full ${!svgContent ? 'min-h-[638px] flex items-center justify-center' : ''}`}>
        {!svgContent && (
          <p className="text-center text-gray-600 text-lg">Loading map...</p>
        )}
        {svgContent && (
          <div 
            ref={containerRef}
            className="w-full"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>
    </div>
  );
}
