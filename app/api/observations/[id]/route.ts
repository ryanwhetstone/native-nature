import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { observations, observationPictures } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '@/lib/s3';
import { validateNoProfanity } from '@/lib/profanity-filter';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const observationId = parseInt(id);

    if (isNaN(observationId)) {
      return NextResponse.json(
        { error: 'Invalid observation ID' },
        { status: 400 }
      );
    }

    // First, get the observation with its pictures to verify ownership and get S3 keys
    const observation = await db.query.observations.findFirst({
      where: and(
        eq(observations.id, observationId),
        eq(observations.userId, session.user.id)
      ),
      with: {
        pictures: true,
      },
    });

    if (!observation) {
      return NextResponse.json(
        { error: 'Observation not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete images from S3
    if (observation.pictures && observation.pictures.length > 0) {
      const deletePromises = observation.pictures.map(async (picture) => {
        try {
          // Extract the S3 key from the full URL
          const url = new URL(picture.imageUrl);
          const key = url.pathname.substring(1); // Remove leading slash
          
          const deleteCommand = new DeleteObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
          });
          
          await s3Client.send(deleteCommand);
          console.log(`Deleted S3 object: ${key}`);
        } catch (error) {
          console.error(`Failed to delete S3 object for picture ${picture.id}:`, error);
          // Continue even if S3 deletion fails
        }
      });

      await Promise.all(deletePromises);
    }

    // Delete the observation (cascade will delete observation_pictures records)
    await db
      .delete(observations)
      .where(eq(observations.id, observationId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting observation:', error);
    return NextResponse.json(
      { error: 'Failed to delete observation' },
      { status: 500 }
    );
  }
}

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const observationId = parseInt(id);

    if (isNaN(observationId)) {
      return NextResponse.json(
        { error: 'Invalid observation ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { latitude, longitude, observedAt, description, newImageUrls, deletedImageIds } = body;

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

    // Verify ownership
    const observation = await db.query.observations.findFirst({
      where: and(
        eq(observations.id, observationId),
        eq(observations.userId, session.user.id)
      ),
      with: {
        pictures: true,
      },
    });

    if (!observation) {
      return NextResponse.json(
        { error: 'Observation not found or unauthorized' },
        { status: 404 }
      );
    }

    // Reverse geocode if location changed
    let locationData = null;
    if (latitude && longitude && 
        (latitude !== observation.latitude || longitude !== observation.longitude)) {
      locationData = await reverseGeocode(parseFloat(latitude), parseFloat(longitude));
      console.log('Reverse geocoded location:', locationData);
    }

    // Update observation
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (latitude) updateData.latitude = latitude.toString();
    if (longitude) updateData.longitude = longitude.toString();
    if (observedAt) updateData.observedAt = new Date(observedAt);
    if (description !== undefined) updateData.description = description;
    if (locationData) {
      updateData.country = locationData.country;
      updateData.city = locationData.city;
      updateData.region = locationData.region;
      updateData.zipcode = locationData.zipcode;
    }

    await db
      .update(observations)
      .set(updateData)
      .where(eq(observations.id, observationId));

    // Delete specified images from S3 and database
    if (deletedImageIds && Array.isArray(deletedImageIds) && deletedImageIds.length > 0) {
      const picturesToDelete = observation.pictures.filter((p) =>
        deletedImageIds.includes(p.id)
      );

      // Delete from S3
      const deletePromises = picturesToDelete.map(async (picture) => {
        try {
          const url = new URL(picture.imageUrl);
          const key = url.pathname.substring(1);
          
          const deleteCommand = new DeleteObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
          });
          
          await s3Client.send(deleteCommand);
          console.log(`Deleted S3 object: ${key}`);
        } catch (error) {
          console.error(`Failed to delete S3 object for picture ${picture.id}:`, error);
        }
      });

      await Promise.all(deletePromises);

      // Delete from database
      await db
        .delete(observationPictures)
        .where(
          and(
            eq(observationPictures.observationId, observationId),
            // @ts-ignore - inArray type issue
            eq(observationPictures.id, deletedImageIds[0])
          )
        );

      // Delete each individually since drizzle doesn't have a simple inArray for delete
      for (const pictureId of deletedImageIds) {
        await db
          .delete(observationPictures)
          .where(eq(observationPictures.id, pictureId));
      }
    }

    // Add new images
    if (newImageUrls && Array.isArray(newImageUrls) && newImageUrls.length > 0) {
      // Filter out any empty or null URLs
      const validUrls = newImageUrls.filter((url: string) => url && url.trim());
      
      if (validUrls.length > 0) {
        const pictureRecords = validUrls.map((url: string) => ({
          observationId: observationId,
          speciesId: observation.speciesId,
          imageUrl: url,
        }));
        
        await db.insert(observationPictures).values(pictureRecords);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating observation:', error);
    return NextResponse.json(
      { error: 'Failed to update observation' },
      { status: 500 }
    );
  }
}
