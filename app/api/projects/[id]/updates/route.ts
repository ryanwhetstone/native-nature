import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { conservationProjects, projectUpdates, projectUpdatePictures } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateNoProfanity } from '@/lib/profanity-filter';

export async function POST(
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
    const body = await request.json();
    const { title, description, imageUrls } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Validate for profanity
    try {
      validateNoProfanity(title, 'Title');
      validateNoProfanity(description, 'Description');
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Content contains inappropriate language' },
        { status: 400 }
      );
    }

    // Check if user owns the project
    const project = await db.query.conservationProjects.findFirst({
      where: eq(conservationProjects.id, parseInt(id)),
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Create the update
    const [update] = await db.insert(projectUpdates).values({
      projectId: parseInt(id),
      userId: session.user.id,
      title,
      description,
    }).returning();

    // Add images if provided
    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
      await db.insert(projectUpdatePictures).values(
        imageUrls.map((imageUrl: string) => ({
          updateId: update.id,
          imageUrl,
          caption: null,
        }))
      );
    }

    return NextResponse.json(update);
  } catch (error) {
    console.error('Error creating project update:', error);
    return NextResponse.json(
      { error: 'Failed to create update' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const updates = await db.query.projectUpdates.findMany({
      where: eq(projectUpdates.projectId, parseInt(id)),
      with: {
        pictures: true,
        user: {
          columns: {
            id: true,
            name: true,
            publicName: true,
          },
        },
      },
      orderBy: (projectUpdates, { desc }) => [desc(projectUpdates.createdAt)],
    });

    return NextResponse.json(updates);
  } catch (error) {
    console.error('Error fetching project updates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch updates' },
      { status: 500 }
    );
  }
}
