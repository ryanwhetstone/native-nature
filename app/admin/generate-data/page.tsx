import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users, observations, observationPictures, conservationProjects, projectPictures, species, inaturalistPlaces } from "@/db/schema";
import { AdminNav } from "../components/AdminNav";
import { sql, eq } from "drizzle-orm";
const ccs = require('countrycitystatejson');

export const metadata = {
  title: 'Generate Test Data | Admin | Native Nature',
  description: 'Generate fake users, observations, and conservation projects for testing',
};

// Database of major cities with coordinates
const CITIES_DATABASE = [
  // United States
  { name: 'Seattle', state: 'Washington', country: 'United States', lat: 47.6062, lng: -122.3321, countryCode: 'USA' },
  { name: 'Portland', state: 'Oregon', country: 'United States', lat: 45.5152, lng: -122.6784, countryCode: 'USA' },
  { name: 'San Francisco', state: 'California', country: 'United States', lat: 37.7749, lng: -122.4194, countryCode: 'USA' },
  { name: 'Los Angeles', state: 'California', country: 'United States', lat: 34.0522, lng: -118.2437, countryCode: 'USA' },
  { name: 'San Diego', state: 'California', country: 'United States', lat: 32.7157, lng: -117.1611, countryCode: 'USA' },
  { name: 'Sacramento', state: 'California', country: 'United States', lat: 38.5816, lng: -121.4944, countryCode: 'USA' },
  { name: 'Phoenix', state: 'Arizona', country: 'United States', lat: 33.4484, lng: -112.0740, countryCode: 'USA' },
  { name: 'Denver', state: 'Colorado', country: 'United States', lat: 39.7392, lng: -104.9903, countryCode: 'USA' },
  { name: 'Austin', state: 'Texas', country: 'United States', lat: 30.2672, lng: -97.7431, countryCode: 'USA' },
  { name: 'Houston', state: 'Texas', country: 'United States', lat: 29.7604, lng: -95.3698, countryCode: 'USA' },
  { name: 'Dallas', state: 'Texas', country: 'United States', lat: 32.7767, lng: -96.7970, countryCode: 'USA' },
  { name: 'Chicago', state: 'Illinois', country: 'United States', lat: 41.8781, lng: -87.6298, countryCode: 'USA' },
  { name: 'Boston', state: 'Massachusetts', country: 'United States', lat: 42.3601, lng: -71.0589, countryCode: 'USA' },
  { name: 'New York', state: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060, countryCode: 'USA' },
  { name: 'Miami', state: 'Florida', country: 'United States', lat: 25.7617, lng: -80.1918, countryCode: 'USA' },
  { name: 'Atlanta', state: 'Georgia', country: 'United States', lat: 33.7490, lng: -84.3880, countryCode: 'USA' },
  // Canada
  { name: 'Vancouver', state: 'British Columbia', country: 'Canada', lat: 49.2827, lng: -123.1207, countryCode: 'CAN' },
  { name: 'Toronto', state: 'Ontario', country: 'Canada', lat: 43.6532, lng: -79.3832, countryCode: 'CAN' },
  { name: 'Montreal', state: 'Quebec', country: 'Canada', lat: 45.5017, lng: -73.5673, countryCode: 'CAN' },
  { name: 'Calgary', state: 'Alberta', country: 'Canada', lat: 51.0447, lng: -114.0719, countryCode: 'CAN' },
];

// Calculate distance between two lat/lng points in miles
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Offset a lat/lng by a distance and bearing
function offsetLatLng(lat: number, lng: number, distanceMiles = 10, bearingDegrees = 0) {
  const earthRadiusMiles = 3958.8; // Mean Earth radius in miles

  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const toDegrees = (radians: number) => radians * 180 / Math.PI;

  const φ1 = toRadians(lat); // latitude in radians
  const λ1 = toRadians(lng); // longitude in radians
  const δ = distanceMiles / earthRadiusMiles; // angular distance in radians
  const θ = toRadians(bearingDegrees); // bearing in radians

  const sinφ1 = Math.sin(φ1);
  const cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ);
  const cosδ = Math.cos(δ);
  const sinθ = Math.sin(θ);
  const cosθ = Math.cos(θ);

  const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * cosθ;
  const φ2 = Math.asin(sinφ2);

  const y = sinθ * sinδ * cosφ1;
  const x = cosδ - sinφ1 * sinφ2;
  const Δλ = Math.atan2(y, x);

  let newLng = toDegrees(λ1 + Δλ);

  // Normalize longitude to -180 to +180
  newLng = ((newLng + 180) % 360) - 180;

  return {
    lat: toDegrees(φ2),
    lng: newLng,
  };
}

// Get real cities within a radius
function getCitiesWithinRadius(baseLat: number, baseLng: number, radiusMiles: number, countryCode: string) {
  const cities: Array<{ name: string; state: string; lat: number; lng: number; country: string }> = [];
  
  for (const city of CITIES_DATABASE) {
    // Filter by country if specified
    if (countryCode && city.countryCode.toUpperCase() !== countryCode.toUpperCase()) {
      continue;
    }
    
    const distance = calculateDistance(baseLat, baseLng, city.lat, city.lng);
    
    if (distance <= radiusMiles) {
      cities.push({
        name: city.name,
        state: city.state,
        lat: city.lat,
        lng: city.lng,
        country: city.country,
      });
    }
  }
  
  return cities;
}

async function generateFakeUsers(formData: FormData) {
  'use server';
  
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const count = Number(formData.get('count')) || 5;
  
  const firstNames = ['Alex', 'Jordan', 'Morgan', 'Taylor', 'Casey', 'Riley', 'Avery', 'Quinn', 'Reese', 'Sage'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const bios = [
    'Wildlife photographer and nature enthusiast',
    'Conservation advocate and birdwatcher',
    'Marine biologist and ocean lover',
    'Backyard naturalist and citizen scientist',
    'Environmental educator and outdoor adventurer',
  ];

  // Get available places for home assignment
  const availablePlaces = await db.select().from(inaturalistPlaces).limit(100);
  
  if (availablePlaces.length === 0) {
    throw new Error('No places found in database. Cannot assign home places to users.');
  }

  // Map country codes to country names for countrycitystatejson
  const countryCodeMap: Record<string, { name: string; shortCode: string }> = {
    'USA': { name: 'United States', shortCode: 'US' },
    'CAN': { name: 'Canada', shortCode: 'CA' },
    'MEX': { name: 'Mexico', shortCode: 'MX' },
    'GBR': { name: 'United Kingdom', shortCode: 'GB' },
    'AUS': { name: 'Australia', shortCode: 'AU' },
    'NZL': { name: 'New Zealand', shortCode: 'NZ' },
  };

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!mapboxToken) {
    throw new Error('NEXT_PUBLIC_MAPBOX_TOKEN environment variable is not set');
  }

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}.${i}@fakeuser.com`;
    const homePlace = availablePlaces[Math.floor(Math.random() * availablePlaces.length)];
    
    let homeLat: string | null = null;
    let homeLng: string | null = null;

    // Try to get a city in the state/region and geocode it
    try {
      const countryInfo = countryCodeMap[homePlace.countryCode.toUpperCase()];
      
      if (countryInfo) {
        // Get cities in the state/province
        const cities = ccs.getCities(countryInfo.shortCode, homePlace.placeName);
        
        if (cities && cities.length > 0) {
          // Pick a random city
          const randomCity = cities[Math.floor(Math.random() * Math.min(cities.length, 10))];
          
          // Geocode the city using Mapbox
          const query = `${randomCity}, ${homePlace.placeName}, ${countryInfo.name}`;
          const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=1&types=place`;
          
          const response = await fetch(geocodeUrl);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
              const [lng, lat] = data.features[0].center;
              homeLat = lat.toFixed(6);
              homeLng = lng.toFixed(6);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting city coordinates:', error);
    }
    
    await db.insert(users).values({
      email,
      name: `${firstName} ${lastName}`,
      publicName: `${firstName} ${lastName}`,
      bio: bios[Math.floor(Math.random() * bios.length)],
      role: 'user',
      homePlaceId: homePlace.id,
      homeLat,
      homeLng,
    });
  }

  revalidatePath('/admin/generate-data');
  revalidatePath('/admin/users');
}

async function generateFakeObservations(formData: FormData) {
  'use server';
  
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const count = Number(formData.get('count')) || 5;
  
  // Get random fake users with their home places and coordinates
  const fakeUsers = await db.select({
    id: users.id,
    email: users.email,
    homePlaceId: users.homePlaceId,
    homeLat: users.homeLat,
    homeLng: users.homeLng,
  }).from(users).where(sql`${users.email} LIKE '%@fakeuser.com'`).limit(20);
  
  if (fakeUsers.length === 0) {
    throw new Error('No fake users found. Generate fake users first.');
  }

  // Get random species
  const allSpecies = await db.select().from(species).limit(100);
  
  if (allSpecies.length === 0) {
    throw new Error('No species found in database.');
  }

  // Get all places for coordinate mapping
  const places = await db.select().from(inaturalistPlaces);
  const placesMap = new Map(places.map(p => [p.id, p]));

  // Approximate coordinate ranges for different regions (center lat/lng with variance)
  const getCoordinatesForPlace = (place: typeof places[0]) => {
    // Default coordinates (central USA)
    let baseLat = 39.8283;
    let baseLng = -98.5795;
    let latVariance = 5;
    let lngVariance = 10;

    // Use country code and place name to estimate coordinates
    const country = place.countryCode.toLowerCase();
    const placeName = place.placeName.toLowerCase();

    // North American coordinates
    if (country === 'usa') {
      if (placeName.includes('california')) {
        baseLat = 36.7783; baseLng = -119.4179;
      } else if (placeName.includes('texas')) {
        baseLat = 31.9686; baseLng = -99.9018;
      } else if (placeName.includes('florida')) {
        baseLat = 27.9944; baseLng = -81.7603;
      } else if (placeName.includes('new york')) {
        baseLat = 43.2994; baseLng = -74.2179;
      } else if (placeName.includes('washington')) {
        baseLat = 47.7511; baseLng = -120.7401;
      } else if (placeName.includes('oregon')) {
        baseLat = 43.8041; baseLng = -120.5542;
      } else if (placeName.includes('colorado')) {
        baseLat = 39.5501; baseLng = -105.7821;
      } else if (placeName.includes('arizona')) {
        baseLat = 34.0489; baseLng = -111.0937;
      }
    } else if (country === 'can') {
      baseLat = 56.1304; baseLng = -106.3468;
      if (placeName.includes('ontario')) {
        baseLat = 51.2538; baseLng = -85.3232;
      } else if (placeName.includes('british columbia')) {
        baseLat = 53.7267; baseLng = -127.6476;
      } else if (placeName.includes('quebec')) {
        baseLat = 52.9399; baseLng = -73.5491;
      } else if (placeName.includes('alberta')) {
        baseLat = 53.9333; baseLng = -116.5765;
      }
    } else if (country === 'mex') {
      baseLat = 23.6345; baseLng = -102.5528;
    } else if (country === 'gbr') {
      baseLat = 55.3781; baseLng = -3.4360;
    } else if (country === 'aus') {
      baseLat = -25.2744; baseLng = 133.7751;
    } else if (country === 'nzl') {
      baseLat = -40.9006; baseLng = 174.8860;
    }

    // Add some randomness around the base coordinates
    const lat = (baseLat + (Math.random() - 0.5) * latVariance).toFixed(6);
    const lng = (baseLng + (Math.random() - 0.5) * lngVariance).toFixed(6);
    
    return { lat, lng, placeName: place.placeName, country: place.countryCode };
  };

  const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!unsplashAccessKey) {
    throw new Error('UNSPLASH_ACCESS_KEY environment variable is not set');
  }

  for (let i = 0; i < count; i++) {
    const user = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
    const selectedSpecies = allSpecies[Math.floor(Math.random() * allSpecies.length)];
    
    // Get coordinates based on user's home coordinates or home place
    let latitude = (Math.random() * 60 + 20).toFixed(6);
    let longitude = (Math.random() * -120 - 60).toFixed(6);
    let city = 'Unknown';
    let region = '';
    let country = 'United States';
    
    // Use user's home coordinates if available
    if (user.homeLat && user.homeLng) {
      const baseLat = parseFloat(user.homeLat);
      const baseLng = parseFloat(user.homeLng);
      
      // Generate random observation within 50 miles of home
      const randomDistance = Math.random() * 50; // 0-50 miles
      const randomBearing = Math.random() * 360; // 0-360 degrees
      const offset = offsetLatLng(baseLat, baseLng, randomDistance, randomBearing);
      
      latitude = offset.lat.toFixed(6);
      longitude = offset.lng.toFixed(6);
      
      // Try to find real cities within 50 miles for city name
      const nearbyCities = getCitiesWithinRadius(baseLat, baseLng, 50, 'USA');
      
      if (nearbyCities.length > 0) {
        // Use a random nearby city name
        const selectedCity = nearbyCities[Math.floor(Math.random() * nearbyCities.length)];
        city = selectedCity.name;
        region = selectedCity.state;
        country = selectedCity.country;
      }
    } else if (user.homePlaceId && placesMap.has(user.homePlaceId)) {
      // Fallback to old method if no home coordinates
      const place = placesMap.get(user.homePlaceId)!;
      const coords = getCoordinatesForPlace(place);
      const baseLat = parseFloat(coords.lat);
      const baseLng = parseFloat(coords.lng);
      
      // Generate random observation within 50 miles
      const randomDistance = Math.random() * 50;
      const randomBearing = Math.random() * 360;
      const offset = offsetLatLng(baseLat, baseLng, randomDistance, randomBearing);
      
      latitude = offset.lat.toFixed(6);
      longitude = offset.lng.toFixed(6);
      
      // Try to find real cities within 50 miles
      const nearbyCities = getCitiesWithinRadius(baseLat, baseLng, 50, coords.country);
      
      if (nearbyCities.length > 0) {
        // Use a random nearby city name
        const selectedCity = nearbyCities[Math.floor(Math.random() * nearbyCities.length)];
        city = selectedCity.name;
        region = selectedCity.state;
        country = selectedCity.country;
      } else {
        // No cities in database, use region from place
        region = coords.placeName;
        const countryMap: Record<string, string> = {
          'USA': 'United States',
          'CAN': 'Canada',
          'MEX': 'Mexico',
          'GBR': 'United Kingdom',
          'AUS': 'Australia',
          'NZL': 'New Zealand',
        };
        country = countryMap[coords.country.toUpperCase()] || coords.country;
      }
    }
    
    const [observation] = await db.insert(observations).values({
      userId: user.id,
      speciesId: selectedSpecies.id,
      latitude,
      longitude,
      city,
      region,
      country,
      description: `Observed this ${selectedSpecies.preferredCommonName || selectedSpecies.name} during a nature walk. Great sighting!`,
      observedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
    }).returning();

    // Fetch images from Unsplash based on species name
    const searchQuery = (selectedSpecies.preferredCommonName || selectedSpecies.name).toLowerCase();
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=10&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${unsplashAccessKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const numImages = Math.min(Math.floor(Math.random() * 3) + 1, data.results.length);
        
        for (let j = 0; j < numImages; j++) {
          const photo = data.results[j];
          await db.insert(observationPictures).values({
            observationId: observation.id,
            speciesId: selectedSpecies.id,
            imageUrl: photo.urls.regular,
            caption: `${selectedSpecies.preferredCommonName || selectedSpecies.name} - Photo by ${photo.user.name} on Unsplash`,
            approved: null, // Start as pending
          });
        }
      } else {
        // Fallback to placeholder if Unsplash fails
        const imageId = Math.floor(Math.random() * 1000);
        await db.insert(observationPictures).values({
          observationId: observation.id,
          speciesId: selectedSpecies.id,
          imageUrl: `https://picsum.photos/seed/${imageId}/800/600`,
          caption: `Photo of ${selectedSpecies.preferredCommonName || selectedSpecies.name}`,
          approved: null,
        });
      }
    } catch (error) {
      console.error('Unsplash API error:', error);
      // Fallback to placeholder
      const imageId = Math.floor(Math.random() * 1000);
      await db.insert(observationPictures).values({
        observationId: observation.id,
        speciesId: selectedSpecies.id,
        imageUrl: `https://picsum.photos/seed/${imageId}/800/600`,
        caption: `Photo of ${selectedSpecies.preferredCommonName || selectedSpecies.name}`,
        approved: null,
      });
    }
  }

  revalidatePath('/admin/generate-data');
  revalidatePath('/admin/observations');
  revalidatePath('/recent-observations');
}

async function generateFakeProjects(formData: FormData) {
  'use server';
  
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const count = Number(formData.get('count')) || 3;
  
  // Get random fake users with their home places and coordinates
  const fakeUsers = await db.select({
    id: users.id,
    email: users.email,
    homePlaceId: users.homePlaceId,
    homeLat: users.homeLat,
    homeLng: users.homeLng,
  }).from(users).where(sql`${users.email} LIKE '%@fakeuser.com'`).limit(20);
  
  if (fakeUsers.length === 0) {
    throw new Error('No fake users found. Generate fake users first.');
  }

  // Get all places for coordinate mapping
  const places = await db.select().from(inaturalistPlaces);
  const placesMap = new Map(places.map(p => [p.id, p]));

  // Approximate coordinate ranges for different regions (center lat/lng with variance)
  const getCoordinatesForPlace = (place: typeof places[0]) => {
    // Default coordinates (central USA)
    let baseLat = 39.8283;
    let baseLng = -98.5795;
    let latVariance = 5;
    let lngVariance = 10;

    // Use country code and place name to estimate coordinates
    const country = place.countryCode.toLowerCase();
    const placeName = place.placeName.toLowerCase();

    // North American coordinates
    if (country === 'usa') {
      if (placeName.includes('california')) {
        baseLat = 36.7783; baseLng = -119.4179;
      } else if (placeName.includes('texas')) {
        baseLat = 31.9686; baseLng = -99.9018;
      } else if (placeName.includes('florida')) {
        baseLat = 27.9944; baseLng = -81.7603;
      } else if (placeName.includes('new york')) {
        baseLat = 43.2994; baseLng = -74.2179;
      } else if (placeName.includes('washington')) {
        baseLat = 47.7511; baseLng = -120.7401;
      } else if (placeName.includes('oregon')) {
        baseLat = 43.8041; baseLng = -120.5542;
      } else if (placeName.includes('colorado')) {
        baseLat = 39.5501; baseLng = -105.7821;
      } else if (placeName.includes('arizona')) {
        baseLat = 34.0489; baseLng = -111.0937;
      }
    } else if (country === 'can') {
      baseLat = 56.1304; baseLng = -106.3468;
      if (placeName.includes('ontario')) {
        baseLat = 51.2538; baseLng = -85.3232;
      } else if (placeName.includes('british columbia')) {
        baseLat = 53.7267; baseLng = -127.6476;
      } else if (placeName.includes('quebec')) {
        baseLat = 52.9399; baseLng = -73.5491;
      } else if (placeName.includes('alberta')) {
        baseLat = 53.9333; baseLng = -116.5765;
      }
    } else if (country === 'mex') {
      baseLat = 23.6345; baseLng = -102.5528;
    } else if (country === 'gbr') {
      baseLat = 55.3781; baseLng = -3.4360;
    } else if (country === 'aus') {
      baseLat = -25.2744; baseLng = 133.7751;
    } else if (country === 'nzl') {
      baseLat = -40.9006; baseLng = 174.8860;
    }

    // Add some randomness around the base coordinates
    const lat = (baseLat + (Math.random() - 0.5) * latVariance).toFixed(6);
    const lng = (baseLng + (Math.random() - 0.5) * lngVariance).toFixed(6);
    
    return { lat, lng, placeName: place.placeName, country: place.countryCode };
  };

  const projectTypes = [
    { title: 'Restore Wetland Habitat', keywords: 'wetland marsh restoration' },
    { title: 'Protect Endangered Bird Species', keywords: 'bird wildlife sanctuary' },
    { title: 'Coastal Marine Sanctuary', keywords: 'ocean coral reef marine' },
    { title: 'Urban Pollinator Garden', keywords: 'butterfly bee pollinator garden' },
    { title: 'Forest Restoration Initiative', keywords: 'forest trees reforestation' },
    { title: 'River Cleanup and Conservation', keywords: 'river stream water conservation' },
    { title: 'Wildlife Corridor Development', keywords: 'wildlife habitat corridor' },
    { title: 'Native Plant Nursery', keywords: 'native plants nursery restoration' },
  ];

  const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!unsplashAccessKey) {
    throw new Error('UNSPLASH_ACCESS_KEY environment variable is not set');
  }

  for (let i = 0; i < count; i++) {
    const user = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
    const projectType = projectTypes[Math.floor(Math.random() * projectTypes.length)];
    
    let latitude = (Math.random() * 60 + 20).toFixed(6);
    let longitude = (Math.random() * -120 - 60).toFixed(6);
    let city = 'Unknown';
    let region = '';
    let country = 'United States';
    
    // Use user's home coordinates if available
    if (user.homeLat && user.homeLng) {
      const baseLat = parseFloat(user.homeLat);
      const baseLng = parseFloat(user.homeLng);
      
      // Generate random project within 20 miles of home
      const randomDistance = Math.random() * 20; // 0-20 miles
      const randomBearing = Math.random() * 360; // 0-360 degrees
      const offset = offsetLatLng(baseLat, baseLng, randomDistance, randomBearing);
      
      latitude = offset.lat.toFixed(6);
      longitude = offset.lng.toFixed(6);
      
      // Try to find real cities within 20 miles for city name
      const nearbyCities = getCitiesWithinRadius(baseLat, baseLng, 20, 'USA');
      
      if (nearbyCities.length > 0) {
        // Use a random nearby city name
        const selectedCity = nearbyCities[Math.floor(Math.random() * nearbyCities.length)];
        city = selectedCity.name;
        region = selectedCity.state;
        country = selectedCity.country;
      }
    } else if (user.homePlaceId && placesMap.has(user.homePlaceId)) {
      // Fallback to old method if no home coordinates
      const place = placesMap.get(user.homePlaceId)!;
      const coords = getCoordinatesForPlace(place);
      const baseLat = parseFloat(coords.lat);
      const baseLng = parseFloat(coords.lng);
      
      // Generate random project within 20 miles
      const randomDistance = Math.random() * 20;
      const randomBearing = Math.random() * 360;
      const offset = offsetLatLng(baseLat, baseLng, randomDistance, randomBearing);
      
      latitude = offset.lat.toFixed(6);
      longitude = offset.lng.toFixed(6);
      
      // Try to find real cities within 20 miles
      const nearbyCities = getCitiesWithinRadius(baseLat, baseLng, 20, coords.country);
      
      if (nearbyCities.length > 0) {
        // Use a random nearby city name
        const selectedCity = nearbyCities[Math.floor(Math.random() * nearbyCities.length)];
        city = selectedCity.name;
        region = selectedCity.state;
        country = selectedCity.country;
      } else {
        // No cities in database, use region from place
        region = coords.placeName;
        const countryMap: Record<string, string> = {
          'USA': 'United States',
          'CAN': 'Canada',
          'MEX': 'Mexico',
          'GBR': 'United Kingdom',
          'AUS': 'Australia',
          'NZL': 'New Zealand',
        };
        country = countryMap[coords.country.toUpperCase()] || coords.country;
      }
    }
    
    const fundingGoal = Math.floor(Math.random() * 100000) + 10000; // $10k to $110k
    const currentFunding = Math.floor(Math.random() * fundingGoal * 0.7); // 0-70% funded
    
    const [project] = await db.insert(conservationProjects).values({
      userId: user.id,
      title: `${projectType.title} - ${city}`,
      description: `This project aims to protect and restore critical habitat for native wildlife in the ${city} area. Through community engagement and scientific restoration practices, we will create a sustainable ecosystem that benefits both wildlife and local communities.`,
      latitude,
      longitude,
      city,
      region,
      country,
      fundingGoal,
      currentFunding,
      status: currentFunding >= fundingGoal ? 'completed' : 'active',
    }).returning();

    // Fetch images from Unsplash based on project keywords
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(projectType.keywords)}&per_page=10&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${unsplashAccessKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const numImages = Math.min(Math.floor(Math.random() * 2) + 1, data.results.length);
        
        for (let j = 0; j < numImages; j++) {
          const photo = data.results[j];
          await db.insert(projectPictures).values({
            projectId: project.id,
            imageUrl: photo.urls.regular,
            caption: `${projectType.title} - Photo by ${photo.user.name} on Unsplash`,
            approved: null, // Start as pending
          });
        }
      } else {
        // Fallback to placeholder if Unsplash fails
        const imageId = Math.floor(Math.random() * 1000) + 1000;
        await db.insert(projectPictures).values({
          projectId: project.id,
          imageUrl: `https://picsum.photos/seed/${imageId}/800/600`,
          caption: `${projectType.title} project site`,
          approved: null,
        });
      }
    } catch (error) {
      console.error('Unsplash API error:', error);
      // Fallback to placeholder
      const imageId = Math.floor(Math.random() * 1000) + 1000;
      await db.insert(projectPictures).values({
        projectId: project.id,
        imageUrl: `https://picsum.photos/seed/${imageId}/800/600`,
        caption: `${projectType.title} project site`,
        approved: null,
      });
    }
  }

  revalidatePath('/admin/generate-data');
  revalidatePath('/admin/projects');
  revalidatePath('/conservation-projects');
}

export default async function GenerateDataPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  return (
    <main className="min-h-screen bg-light">
      <AdminNav />
      <div className="container-lg">
        <h1>Generate Test Data</h1>
        <p className="text-muted mb-6">
          Create fake users, observations, and conservation projects for testing purposes.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Generate Fake Users */}
          <div className="section-card">
            <h2 className="text-xl font-semibold mb-2">Fake Users</h2>
            <p className="text-sm text-gray-600 mb-4">
              Generate fake user accounts with random names and bios.
            </p>
            <form action={generateFakeUsers}>
              <div className="mb-4">
                <label htmlFor="user-count" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Users
                </label>
                <input
                  type="number"
                  id="user-count"
                  name="count"
                  min="1"
                  max="50"
                  defaultValue="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Generate Users
              </button>
            </form>
          </div>

          {/* Generate Fake Observations */}
          <div className="section-card">
            <h2 className="text-xl font-semibold mb-2">Fake Observations</h2>
            <p className="text-sm text-gray-600 mb-4">
              Generate fake observations with images from Lorem Picsum. Requires fake users.
            </p>
            <form action={generateFakeObservations}>
              <div className="mb-4">
                <label htmlFor="observation-count" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Observations
                </label>
                <input
                  type="number"
                  id="observation-count"
                  name="count"
                  min="1"
                  max="50"
                  defaultValue="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Generate Observations
              </button>
            </form>
          </div>

          {/* Generate Fake Projects */}
          <div className="section-card">
            <h2 className="text-xl font-semibold mb-2">Fake Conservation Projects</h2>
            <p className="text-sm text-gray-600 mb-4">
              Generate fake conservation projects with images. Requires fake users.
            </p>
            <form action={generateFakeProjects}>
              <div className="mb-4">
                <label htmlFor="project-count" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Projects
                </label>
                <input
                  type="number"
                  id="project-count"
                  name="count"
                  min="1"
                  max="20"
                  defaultValue="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Generate Projects
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 section-card bg-yellow-50 border-yellow-200">
          <h3 className="text-lg font-semibold mb-2">⚠️ Important Notes</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>Fake users have emails ending in <code>@fakeuser.com</code></li>
            <li>All generated images are from Lorem Picsum (placeholder images)</li>
            <li>All generated photos start with <code>approved: null</code> (pending review)</li>
            <li>You can approve them in the Bulk Photo Management page</li>
            <li>Generate users first before creating observations or projects</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
