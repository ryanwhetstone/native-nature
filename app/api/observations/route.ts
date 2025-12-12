import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { observations, observationPictures } from '@/db/schema';
import { getSpeciesByTaxonId } from '@/db/queries';

// Reverse geocoding function using Nominatim (OpenStreetMap)
async function reverseGeocode(lat: number, lng: number) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'NativeNature/1.0', // Required by Nominatim
        },
      }
    );

    if (!response.ok) {
      console.error('Geocoding failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    return {
      country: data.address?.country || null,
      city: data.address?.city || 
            data.address?.town || 
            data.address?.village || 
            data.address?.municipality || 
            null,
      region: data.address?.state || 
              data.address?.province || 
              data.address?.region || 
              null,
      zipcode: data.address?.postcode || null,
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
