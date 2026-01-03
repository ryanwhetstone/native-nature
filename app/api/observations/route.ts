import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { observations, observationPictures } from '@/db/schema';
import { getSpeciesByTaxonId } from '@/db/queries';
import { validateNoProfanity } from '@/lib/profanity-filter';

// Reverse geocoding function using Mapbox
async function reverseGeocode(lat: number, lng: number) {
  try {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox token not found');
      return null;
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=postcode,place,region,country`
    );

    if (!response.ok) {
      console.error('Mapbox geocoding failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      console.error('No geocoding results found');
      return null;
    }

    // Extract location data from Mapbox response
    let country = null;
    let city = null;
    let region = null;
    let zipcode = null;

    // Mapbox returns features in order of specificity
    for (const feature of data.features) {
      const placeType = feature.place_type?.[0];
      
      if (placeType === 'country' && !country) {
        country = feature.text;
      } else if (placeType === 'region' && !region) {
        region = feature.text;
      } else if (placeType === 'place' && !city) {
        city = feature.text;
      } else if (placeType === 'postcode' && !zipcode) {
        zipcode = feature.text;
      }
    }
    
    return {
      country,
      city,
      region,
      zipcode,
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { speciesId, latitude, longitude, observedAt, description, imageUrls } = body;

    console.log('Observation data:', { speciesId, latitude, longitude, observedAt, description, imageUrls });

    if (!speciesId || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate description for profanity
    if (description) {
      try {
        validateNoProfanity(description, 'Description');
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Description contains inappropriate language' },
          { status: 400 }
        );
      }
    }

    const parsedSpeciesId = typeof speciesId === 'string' ? parseInt(speciesId) : speciesId;

    // Reverse geocode the coordinates
    const locationData = await reverseGeocode(parseFloat(latitude), parseFloat(longitude));
    console.log('Reverse geocoded location:', locationData);

    // Species ID should be the database ID, not taxon ID
    const [observation] = await db.insert(observations).values({
      userId: session.user.id,
      speciesId: parsedSpeciesId,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      country: locationData?.country || null,
      city: locationData?.city || null,
      region: locationData?.region || null,
      zipcode: locationData?.zipcode || null,
      description: description || null,
      observedAt: observedAt ? new Date(observedAt) : new Date(),
    }).returning();

    // Save observation pictures if any
    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
      const pictureRecords = imageUrls.map((url: string) => ({
        observationId: observation.id,
        speciesId: parsedSpeciesId,
        imageUrl: url,
      }));
      
      await db.insert(observationPictures).values(pictureRecords);
    }

    return NextResponse.json(observation);
  } catch (error) {
    console.error('Error creating observation:', error);
    return NextResponse.json(
      { error: 'Failed to create observation' },
      { status: 500 }
    );
  }
}
