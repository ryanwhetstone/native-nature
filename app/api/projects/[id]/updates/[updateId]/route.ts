import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { projectUpdates, projectUpdatePictures } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { updateId } = await params;
    const body = await request.json();
    const { title, description, imageUrls } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Check if update exists and user owns it
    const existingUpdate = await db.query.projectUpdates.findFirst({
      where: eq(projectUpdates.id, parseInt(updateId)),
      with: {
        project: true,
      },
    });

    if (!existingUpdate) {
      return NextResponse.json(
        { error: 'Update not found' },
        { status: 404 }
      );
    }

    if (existingUpdate.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update the update
    const [update] = await db
      .update(projectUpdates)
      .set({
        title,
        description,
      })
      .where(eq(projectUpdates.id, parseInt(updateId)))
      .returning();

    // Handle images - delete old ones and add new ones if provided
    if (imageUrls !== undefined) {
      // Delete existing images
      await db
        .delete(projectUpdatePictures)
        .where(eq(projectUpdatePictures.updateId, parseInt(updateId)));

      // Add new images if provided
      if (Array.isArray(imageUrls) && imageUrls.length > 0) {
        await db.insert(projectUpdatePictures).values(
          imageUrls.map((imageUrl: string) => ({
            updateId: parseInt(updateId),
            imageUrl,
            caption: null,
          }))
        );
      }
    }

    return NextResponse.json(update);
  } catch (error) {
    console.error('Error updating project update:', error);
    return NextResponse.json(
      { error: 'Failed to update' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { updateId } = await params;

    // Check if update exists and user owns it
    const existingUpdate = await db.query.projectUpdates.findFirst({
      where: eq(projectUpdates.id, parseInt(updateId)),
      with: {
        project: true,
      },
    });

    if (!existingUpdate) {
      return NextResponse.json(
        { error: 'Update not found' },
        { status: 404 }
      );
    }

    if (existingUpdate.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete the update (cascade will delete associated pictures)
    await db
      .delete(projectUpdates)
      .where(eq(projectUpdates.id, parseInt(updateId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project update:', error);
    return NextResponse.json(
      { error: 'Failed to delete update' },
      { status: 500 }
    );
  }
}
