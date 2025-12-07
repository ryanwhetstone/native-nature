import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { observations, observationPictures } from '@/db/schema';
import { getSpeciesByTaxonId } from '@/db/queries';

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
    const { speciesId, latitude, longitude, locationName, observedAt, imageUrls } = body;

    console.log('Observation data:', { speciesId, latitude, longitude, locationName, observedAt, imageUrls });

    if (!speciesId || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const parsedSpeciesId = typeof speciesId === 'string' ? parseInt(speciesId) : speciesId;

    // Species ID should be the database ID, not taxon ID
    const [observation] = await db.insert(observations).values({
      userId: session.user.id,
      speciesId: parsedSpeciesId,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      locationName: locationName || null,
      observedAt: observedAt ? new Date(observedAt) : new Date(),
    }).returning();

    // Save observation pictures if any
    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
      const pictureRecords = imageUrls.map((url: string) => ({
        observationId: observation.id,
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
