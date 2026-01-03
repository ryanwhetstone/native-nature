import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { conservationProjects, projectPictures } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { validateNoProfanity } from '@/lib/profanity-filter';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const project = await db.query.conservationProjects.findFirst({
      where: eq(conservationProjects.id, parseInt(id)),
      with: {
        pictures: true,
        user: {
          columns: {
            id: true,
            name: true,
            publicName: true,
            image: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// Reverse geocoding function using Nominatim (OpenStreetMap)
async function reverseGeocode(lat: number, lng: number) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'NativeNature/1.0',
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
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

export async function PUT(
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
    const { title, description, fundingGoal, status, latitude, longitude, newImageUrls, deletedImageIds } = body;

    // Validate title and description for profanity if provided
    if (title) {
      try {
        validateNoProfanity(title, 'Title');
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Title contains inappropriate language' },
          { status: 400 }
        );
      }
    }

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

    // Check if user owns the project
    const existingProject = await db.query.conservationProjects.findFirst({
      where: eq(conservationProjects.id, parseInt(id)),
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (existingProject.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Convert funding goal to cents if provided
    const fundingGoalInCents = fundingGoal ? Math.round(parseFloat(fundingGoal) * 100) : undefined;

    // Determine status: if new funding goal is higher than current funding, set to active
    let projectStatus = status || existingProject.status;
    if (fundingGoalInCents && fundingGoalInCents > existingProject.currentFunding) {
      projectStatus = 'active';
    }

    // Reverse geocode if location changed
    let locationData = null;
    if (latitude && longitude) {
      locationData = await reverseGeocode(parseFloat(latitude), parseFloat(longitude));
    }

    const [updatedProject] = await db
      .update(conservationProjects)
      .set({
        title: title || existingProject.title,
        description: description || existingProject.description,
        fundingGoal: fundingGoalInCents || existingProject.fundingGoal,
        status: projectStatus,
        latitude: latitude || existingProject.latitude,
        longitude: longitude || existingProject.longitude,
        country: locationData?.country || existingProject.country,
        city: locationData?.city || existingProject.city,
        region: locationData?.region || existingProject.region,
        updatedAt: new Date(),
      })
      .where(eq(conservationProjects.id, parseInt(id)))
      .returning();

    // Delete removed images
    if (deletedImageIds && Array.isArray(deletedImageIds) && deletedImageIds.length > 0) {
      await db.delete(projectPictures)
        .where(inArray(projectPictures.id, deletedImageIds));
    }

    // Add new images
    if (newImageUrls && Array.isArray(newImageUrls) && newImageUrls.length > 0) {
      const pictureRecords = newImageUrls.map((url: string) => ({
        projectId: parseInt(id),
        imageUrl: url,
      }));
      
      await db.insert(projectPictures).values(pictureRecords);
    }

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

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

    // Check if user owns the project
    const existingProject = await db.query.conservationProjects.findFirst({
      where: eq(conservationProjects.id, parseInt(id)),
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (existingProject.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete project (pictures will be cascade deleted)
    await db.delete(conservationProjects).where(eq(conservationProjects.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
