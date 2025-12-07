import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { observations, observationPictures } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '@/lib/s3';

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
