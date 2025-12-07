import https from 'https';
import { countries } from '../lib/countries';

interface RegionMapping {
  [regionCode: string]: string;
}

function fetchSimpleMapsPage(countryCode: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Fetch the mapdata.js file which contains the region mappings
    const url = `https://simplemaps.com/static/svg/country/${countryCode.toLowerCase()}/admin1/mapdata.js`;
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/javascript,text/javascript,*/*',
      }
    };
    
    https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`  Received ${data.length} bytes`);
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function extractRegionMapping(jsCode: string): RegionMapping | null {
  // The mapdata.js file contains: var simplemaps_countrymap_mapdata = { ... }
  // We need to extract the state_specific object which has the region codes and names
  
  try {
    // Extract the state_specific section
    const stateSpecificMatch = jsCode.match(/state_specific:\s*\{([^}]+(?:\}[^}]+)*)\}/);
    
    if (!stateSpecificMatch) {
      console.log('  Could not find state_specific section');
      return null;
    }
    
    // Extract individual state entries
    // Patterns: ARA: { name: "Salta", ... } or AT1: { name: "Burgenland", ... }
    // Match 2-3 letters followed by optional digits
    const statePattern = /([A-Z]{2,3}\d*):\s*\{\s*name:\s*"([^"]+)"/g;
    const mapping: RegionMapping = {};
    
    let match;
    while ((match = statePattern.exec(jsCode)) !== null) {
      const code = match[1];
      const name = match[2];
      mapping[code] = name;
    }
    
    if (Object.keys(mapping).length === 0) {
      console.log('  No region codes found');
      return null;
    }
    
    return mapping;
    
  } catch (e) {
    console.error('  Failed to parse JavaScript:', e);
    return null;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchMappingsForCountry(countryCode: string, countryName: string) {
  try {
    console.log(`\nFetching mappings for ${countryName} (${countryCode})...`);
    
    const jsCode = await fetchSimpleMapsPage(countryCode);
    const mapping = extractRegionMapping(jsCode);
    
    if (!mapping) {
      console.log(`  ❌ No mapping found for ${countryName}`);
      return null;
    }
    
    console.log(`  ✓ Found ${Object.keys(mapping).length} regions`);
    
    // Format the mapping
    const formattedMapping: any = {};
    for (const [code, name] of Object.entries(mapping)) {
      formattedMapping[code] = {
        name: name,
        slug: slugify(name)
      };
    }
    
    return {
      countryCode,
      countryName,
      mapping: formattedMapping
    };
    
  } catch (error) {
    console.log(`  ❌ Error fetching ${countryName}: ${error}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npm run fetch:mappings <country-code> [country-code2] ...');
    console.log('Example: npm run fetch:mappings pan mex col');
    console.log('\nOr use "all" to check all countries:');
    console.log('npm run fetch:mappings all');
    return;
  }
  
  let countriesToFetch: Array<{ code: string; name: string }> = [];
  
  if (args[0] === 'all') {
    // Fetch all countries
    countriesToFetch = Object.values(countries).map((c: any) => ({
      code: c.isoCode2.toLowerCase(),
      name: c.name
    }));
  } else {
    // Fetch specified countries
    for (const code of args) {
      const country = Object.values(countries).find((c: any) => 
        c.isoCode.toLowerCase() === code.toLowerCase() ||
        c.isoCode2.toLowerCase() === code.toLowerCase()
      );
      
      if (country) {
        countriesToFetch.push({
          code: country.isoCode2.toLowerCase(),
          name: country.name
        });
      } else {
        console.log(`⚠️  Country not found: ${code}`);
      }
    }
  }
  
  console.log(`\nFetching mappings for ${countriesToFetch.length} countries...\n`);
  
  const results = [];
  for (const country of countriesToFetch) {
    const result = await fetchMappingsForCountry(country.code, country.name);
    if (result) {
      results.push(result);
    }
    // Add a small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n\n=== Summary ===`);
  console.log(`Successfully fetched: ${results.length}/${countriesToFetch.length}`);
  
  if (results.length > 0) {
    console.log('\n=== Mappings ===\n');
    for (const result of results) {
      console.log(`\n// ${result.countryName} (${result.countryCode.toUpperCase()})`);
      console.log(JSON.stringify(result.mapping, null, 2));
    }
  }
}

main();
