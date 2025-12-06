/**
 * Script to download SVG maps from SimpleMaps and generate region mappings
 * 
 * Usage: npx tsx scripts/download-country-svgs.ts [country-code]
 * Example: npx tsx scripts/download-country-svgs.ts usa
 * Or download all: npx tsx scripts/download-country-svgs.ts all
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { countries } from '../lib/countries';
// @ts-ignore
import ccsjson from 'countrycitystatejson';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const SVG_MAPPINGS_DIR = path.join(process.cwd(), 'lib', 'svg-mappings');

interface RegionMapping {
  [regionId: string]: {
    name: string;
    slug: string;
  };
}

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
 * Download SVG from SimpleMaps
 */
async function downloadSVG(countryCode2: string, countryCode3: string): Promise<string | null> {
  const url = `https://simplemaps.com/static/svg/country/${countryCode2.toLowerCase()}/admin1/${countryCode2.toLowerCase()}.svg`;
  
  console.log(`Downloading SVG for ${countryCode2.toUpperCase()}: ${url}`);
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.error(`  ❌ Failed to download: ${res.statusCode} ${res.statusMessage}`);
        resolve(null);
        return;
      }
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Save SVG to public directory using 3-letter code
          const filename = `${countryCode3.toLowerCase()}-map.svg`;
          const filepath = path.join(PUBLIC_DIR, filename);
          fs.writeFileSync(filepath, data);
          
          console.log(`  ✅ Saved to: ${filename} (${(data.length / 1024).toFixed(1)} KB)`);
          resolve(data);
        } catch (error) {
          console.error(`  ❌ Error saving file: ${error}`);
          resolve(null);
        }
      });
    }).on('error', (error) => {
      console.error(`  ❌ Error downloading: ${error.message}`);
      resolve(null);
    });
  });
}

/**
 * Parse SVG and extract region IDs
 */
function extractRegionIds(svg: string, countryCode2: string): string[] {
  const regionIds: string[] = [];
  const prefix = countryCode2.toUpperCase();
  
  // Match path elements with id attributes
  const pathRegex = /<path[^>]*id="([^"]*)"[^>]*>/g;
  let match;
  
  while ((match = pathRegex.exec(svg)) !== null) {
    const id = match[1];
    if (id.startsWith(prefix)) {
      regionIds.push(id);
    }
  }
  
  return regionIds;
}

/**
 * Generate region mapping by matching SVG IDs to state names
 */
function generateRegionMapping(
  regionIds: string[],
  countryCode2: string,
  countryCode3: string
): RegionMapping {
  const mapping: RegionMapping = {};
  
  // Get states from ccsjson
  const countryInfo = ccsjson.getCountryByShort(countryCode2.toUpperCase());
  const states = countryInfo?.states || {};
  const stateNames = Object.keys(states).filter(name => name.length > 2);
  
  // Create a reverse lookup: 2-letter code -> full name
  const codeToName: { [code: string]: string } = {};
  
  // Common state/province abbreviations
  const commonAbbreviations: { [key: string]: { [code: string]: string } } = {
    US: {
      AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
      CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
      HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
      KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
      MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
      MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
      NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
      OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
      SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
      VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
      DC: 'District of Columbia'
    },
    CA: {
      AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
      NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', NT: 'Northwest Territories',
      NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec',
      SK: 'Saskatchewan', YT: 'Yukon'
    },
    AU: {
      NSW: 'New South Wales', QLD: 'Queensland', SA: 'South Australia', TAS: 'Tasmania',
      VIC: 'Victoria', WA: 'Western Australia', NT: 'Northern Territory', ACT: 'Australian Capital Territory'
    },
    MX: {
      AGU: 'Aguascalientes', BCN: 'Baja California', BCS: 'Baja California Sur', CAM: 'Campeche',
      CHP: 'Chiapas', CHH: 'Chihuahua', COA: 'Coahuila', COL: 'Colima', DIF: 'Mexico City',
      DUR: 'Durango', GUA: 'Guanajuato', GRO: 'Guerrero', HID: 'Hidalgo', JAL: 'Jalisco',
      MEX: 'Mexico', MIC: 'Michoacán', MOR: 'Morelos', NAY: 'Nayarit', NLE: 'Nuevo León',
      OAX: 'Oaxaca', PUE: 'Puebla', QUE: 'Querétaro', ROO: 'Quintana Roo', SLP: 'San Luis Potosí',
      SIN: 'Sinaloa', SON: 'Sonora', TAB: 'Tabasco', TAM: 'Tamaulipas', TLA: 'Tlaxcala',
      VER: 'Veracruz', YUC: 'Yucatán', ZAC: 'Zacatecas'
    }
  };
  
  // Build the code to name lookup
  const countryAbbr = commonAbbreviations[countryCode2.toUpperCase()] || {};
  Object.assign(codeToName, countryAbbr);
  
  console.log(`  Found ${regionIds.length} regions in SVG, ${stateNames.length} states in database`);
  
  for (const regionId of regionIds) {
    // Extract state code from region ID (e.g., "USCA" -> "CA", "CABC" -> "BC")
    const stateCode = regionId.replace(countryCode2.toUpperCase(), '');
    
    // Try to get the full name from our abbreviations lookup
    let stateName = codeToName[stateCode] || stateCode;
    
    // Verify it exists in the database
    if (!stateNames.includes(stateName)) {
      // Fallback: try to find a close match
      const match = stateNames.find(name => 
        name.toLowerCase().includes(stateName.toLowerCase()) ||
        stateName.toLowerCase().includes(name.toLowerCase())
      );
      if (match) {
        stateName = match;
      }
    }
    
    mapping[regionId] = {
      name: stateName,
      slug: slugify(stateName)
    };
  }
  
  return mapping;
}

/**
 * Generate TypeScript mapping file
 */
function generateMappingFile(
  countryCode2: string,
  countryCode3: string,
  countryName: string,
  mapping: RegionMapping
): void {
  const filename = `${countryCode3.toLowerCase()}-svg-mapping.ts`;
  const filepath = path.join(SVG_MAPPINGS_DIR, filename);
  
  const content = `// SVG region mapping for ${countryName}
// Generated by scripts/download-country-svgs.ts

export interface RegionMapping {
  [regionId: string]: {
    name: string;
    slug: string;
  };
}

export const ${countryCode3.toLowerCase()}SvgToSlugMapping: RegionMapping = ${JSON.stringify(mapping, null, 2)};

export function getSvgRegionSlug(regionId: string): string | undefined {
  return ${countryCode3.toLowerCase()}SvgToSlugMapping[regionId]?.slug;
}

export function getSvgRegionInfo(regionId: string): { name: string; slug: string } | undefined {
  return ${countryCode3.toLowerCase()}SvgToSlugMapping[regionId];
}
`;
  
  fs.writeFileSync(filepath, content);
  console.log(`  ✅ Generated mapping file: ${filename}`);
}

/**
 * Update the central registry index.ts
 */
function updateRegistry(processedCountries: Array<{ code2: string; code3: string; name: string }>): void {
  console.log('\nUpdating central registry...');
  
  const indexPath = path.join(SVG_MAPPINGS_DIR, 'index.ts');
  
  // Read existing file to preserve other entries
  let existingCountries: Array<{ code2: string; code3: string; name: string }> = [];
  
  if (fs.existsSync(indexPath)) {
    const existingContent = fs.readFileSync(indexPath, 'utf-8');
    
    // Extract existing mappings from the registry
    const mappingRegex = /(\w+):\s*{\s*svgFileName:\s*"(\w+)-map\.svg"/g;
    let match;
    
    while ((match = mappingRegex.exec(existingContent)) !== null) {
      const code3 = match[1]; // e.g., "usa", "can", "mex"
      const code2 = match[2]; // e.g., "us", "ca", "mx"
      
      // Don't add if it's being reprocessed
      if (!processedCountries.some(c => c.code3.toLowerCase() === code3.toLowerCase())) {
        existingCountries.push({ code2, code3, name: '' });
      }
    }
  }
  
  // Combine existing and new countries
  const allCountries = [...existingCountries, ...processedCountries];
  
  const imports = allCountries.map(c => 
    `import { ${c.code3.toLowerCase()}SvgToSlugMapping } from "./${c.code3.toLowerCase()}-svg-mapping";`
  ).join('\n');
  
  const mappingEntries = allCountries.map(c => `  ${c.code3.toLowerCase()}: {
    svgFileName: "${c.code3.toLowerCase()}-map.svg",
    regionIdPrefix: "${c.code2.toUpperCase()}",
    regionMapping: ${c.code3.toLowerCase()}SvgToSlugMapping,
  },`).join('\n');
  
  const content = `// Central registry for all country SVG mappings
// Auto-generated by scripts/download-country-svgs.ts

export interface RegionMapping {
  [regionId: string]: {
    name: string;
    slug: string;
  };
}

export interface CountrySVGConfig {
  svgFileName: string;
  regionIdPrefix: string;
  regionMapping: RegionMapping;
}

// Import individual country mappings
${imports}

// Central registry
const svgMappings: { [countrySlug: string]: CountrySVGConfig } = {
${mappingEntries}
};

export function getSVGConfigForCountry(countrySlug: string): CountrySVGConfig | undefined {
  return svgMappings[countrySlug.toLowerCase()];
}

export function getSvgRegionSlugForCountry(countrySlug: string, regionId: string): string | undefined {
  const config = getSVGConfigForCountry(countrySlug);
  return config?.regionMapping[regionId]?.slug;
}

export function getSvgRegionInfoForCountry(countrySlug: string, regionId: string): { name: string; slug: string } | undefined {
  const config = getSVGConfigForCountry(countrySlug);
  return config?.regionMapping[regionId];
}
`;
  
  fs.writeFileSync(indexPath, content);
  console.log('  ✅ Updated lib/svg-mappings/index.ts');
}

/**
 * Process a single country
 */
async function processCountry(countryCode3: string): Promise<{ code2: string; code3: string; name: string } | null> {
  const country = countries[countryCode3.toUpperCase()];
  
  if (!country) {
    console.error(`❌ Country not found: ${countryCode3}`);
    return null;
  }
  
  console.log(`\n📍 Processing ${country.name} (${country.isoCode2})...`);
  
  // Download SVG
  const svg = await downloadSVG(country.isoCode2, country.isoCode);
  if (!svg) {
    return null;
  }
  
  // Extract region IDs
  const regionIds = extractRegionIds(svg, country.isoCode2);
  if (regionIds.length === 0) {
    console.log(`  ⚠️  No regions found in SVG`);
    return null;
  }
  
  // Generate mapping
  const mapping = generateRegionMapping(regionIds, country.isoCode2, country.isoCode);
  
  // Generate mapping file
  generateMappingFile(country.isoCode2, country.isoCode, country.name, mapping);
  
  return {
    code2: country.isoCode2,
    code3: country.isoCode,
    name: country.name
  };
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const countryArg = args[0];
  
  if (!countryArg) {
    console.log('Usage: npx tsx scripts/download-country-svgs.ts [country-code]');
    console.log('Example: npx tsx scripts/download-country-svgs.ts usa');
    console.log('Or: npx tsx scripts/download-country-svgs.ts all');
    console.log('Or: npx tsx scripts/download-country-svgs.ts simplemaps-all');
    process.exit(1);
  }
  
  // Ensure directories exist
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }
  if (!fs.existsSync(SVG_MAPPINGS_DIR)) {
    fs.mkdirSync(SVG_MAPPINGS_DIR, { recursive: true });
  }
  
  console.log('🗺️  SimpleMaps SVG Downloader\n');
  
  const processedCountries: Array<{ code2: string; code3: string; name: string }> = [];
  
  if (countryArg.toLowerCase() === 'simplemaps-all') {
    console.log('Processing all SimpleMaps available countries...\n');
    
    // Load the SimpleMaps available countries list
    const simplemapsListPath = path.join(process.cwd(), 'scripts', 'simplemaps-available-countries.json');
    const simplemapsCountries = JSON.parse(fs.readFileSync(simplemapsListPath, 'utf-8'));
    
    console.log(`Found ${simplemapsCountries.length} countries in SimpleMaps list\n`);
    
    for (const smCountry of simplemapsCountries) {
      // Find matching country in our countries list by 2-letter code
      const matchingCountry = Object.values(countries).find(
        c => c.isoCode2.toLowerCase() === smCountry.code2.toLowerCase()
      );
      
      if (matchingCountry) {
        const result = await processCountry(matchingCountry.isoCode);
        if (result) {
          processedCountries.push(result);
        }
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`⚠️  No match found for ${smCountry.name} (${smCountry.code2})`);
      }
    }
  } else if (countryArg.toLowerCase() === 'all') {
    console.log('Processing priority countries...\n');
    
    // Process a subset first (major countries with states/provinces)
    const priorityCountries = ['USA', 'CAN', 'AUS', 'BRA', 'MEX', 'IND', 'CHN', 'RUS', 'DEU', 'FRA', 'GBR', 'ITA', 'ESP', 'JPN'];
    
    for (const code of priorityCountries) {
      const result = await processCountry(code);
      if (result) {
        processedCountries.push(result);
      }
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } else {
    const result = await processCountry(countryArg);
    if (result) {
      processedCountries.push(result);
    }
  }
  
  // Update central registry
  if (processedCountries.length > 0) {
    updateRegistry(processedCountries);
    console.log(`\n✅ Successfully processed ${processedCountries.length} countries`);
  } else {
    console.log('\n❌ No countries were successfully processed');
  }
}

main().catch(console.error);
