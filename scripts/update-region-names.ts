/**
 * Script to update region names in SVG mapping files by extracting from SVG files
 * 
 * Usage: npx tsx scripts/update-region-names.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { countries } from '../lib/countries';

const SVG_MAPPINGS_DIR = path.join(process.cwd(), 'lib', 'svg-mappings');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

/**
 * Convert a name to a URL-friendly slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/\s+/g, '-')      // Replace spaces with -
    .replace(/--+/g, '-')      // Replace multiple - with single -
    .trim();
}

/**
 * Extract region names from SVG file
 * Returns a map of region ID to full name from the name attribute
 */
function extractRegionNamesFromSVG(countryCode3: string): Map<string, string> {
  const svgFilepath = path.join(PUBLIC_DIR, `${countryCode3.toLowerCase()}-map.svg`);
  const regionMap = new Map<string, string>();

  if (!fs.existsSync(svgFilepath)) {
    return regionMap;
  }

  const svgContent = fs.readFileSync(svgFilepath, 'utf-8');
  
  // Match path elements with id and name attributes
  // Example: id="FRHDF" name="Hauts de France"
  const pathRegex = /id="([A-Z]{2}[A-Z0-9]{2,4})"[^>]*name="([^"]+)"/g;
  
  let match;
  while ((match = pathRegex.exec(svgContent)) !== null) {
    const [, regionId, regionName] = match;
    regionMap.set(regionId, regionName);
  }

  return regionMap;
}

/**
 * Update region names in a mapping file
 */
function updateMappingFile(countryCode3: string) {
  const filename = `${countryCode3.toLowerCase()}-svg-mapping.ts`;
  const filepath = path.join(SVG_MAPPINGS_DIR, filename);

  if (!fs.existsSync(filepath)) {
    return false;
  }

  // Extract region names from SVG
  const regionNames = extractRegionNamesFromSVG(countryCode3);
  
  if (regionNames.size === 0) {
    return false;
  }

  let content = fs.readFileSync(filepath, 'utf-8');
  let updated = false;

  // Match all region entries in the format:
  // "USCA": {
  //   "name": "CA",
  //   "slug": "ca"
  // }
  const regionRegex = /"([A-Z]{2,4}[A-Z0-9]{2,3})": \{\s*"name": "([^"]+)",\s*"slug": "([^"]+)"/g;
  
  let match;
  const updates: Array<{ oldText: string; newText: string }> = [];

  while ((match = regionRegex.exec(content)) !== null) {
    const [fullMatch, regionId, currentName, currentSlug] = match;
    
    // Get the full name from the SVG
    const fullName = regionNames.get(regionId);
    
    if (fullName && fullName !== currentName && fullName.length > 3) {
      const newSlug = slugify(fullName);
      const oldText = `"${regionId}": {\n    "name": "${currentName}",\n    "slug": "${currentSlug}"`;
      const newText = `"${regionId}": {\n    "name": "${fullName}",\n    "slug": "${newSlug}"`;
      
      updates.push({ oldText, newText });
      updated = true;
      console.log(`  ${regionId}: "${currentName}" -> "${fullName}"`);
    }
  }

  // Apply all updates
  for (const { oldText, newText } of updates) {
    content = content.replace(oldText, newText);
  }

  if (updated) {
    fs.writeFileSync(filepath, content);
    return true;
  }

  return false;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔄  Updating region names in SVG mapping files...\n');

  let updatedCount = 0;
  let totalCount = 0;

  // Get all country entries
  const countryEntries = Object.entries(countries);

  for (const [code3, countryData] of countryEntries) {
    totalCount++;
    
    const filename = `${code3.toLowerCase()}-svg-mapping.ts`;
    const filepath = path.join(SVG_MAPPINGS_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      continue;
    }

    console.log(`\n📍 ${countryData.name} (${code3})...`);
    const updated = updateMappingFile(code3);
    
    if (updated) {
      updatedCount++;
      console.log(`  ✅ Updated`);
    } else {
      console.log(`  ⏭️  No updates needed`);
    }
  }

  console.log(`\n✅ Complete! Updated ${updatedCount} out of ${totalCount} countries`);
}

main().catch(console.error);
