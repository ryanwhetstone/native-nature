import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { conservationProjects, projectPictures } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

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
    const { title, description, latitude, longitude, fundingGoal, imageUrls } = body;

    if (!title || !description || !latitude || !longitude || !fundingGoal) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert funding goal to cents (assuming input is in dollars)
    const fundingGoalInCents = Math.round(parseFloat(fundingGoal) * 100);

    // Reverse geocode the coordinates
    const locationData = await reverseGeocode(parseFloat(latitude), parseFloat(longitude));

    const [project] = await db.insert(conservationProjects).values({
      userId: session.user.id,
      title,
      description,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      country: locationData?.country || null,
      city: locationData?.city || null,
      region: locationData?.region || null,
      fundingGoal: fundingGoalInCents,
      currentFunding: 0,
      status: 'active',
    }).returning();

    // Save project pictures if any
    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
      const pictureRecords = imageUrls.map((url: string) => ({
        projectId: project.id,
        imageUrl: url,
      }));
      
      await db.insert(projectPictures).values(pictureRecords);
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // If userId is provided, fetch that user's projects, otherwise fetch the logged-in user's projects
    const targetUserId = userId || session.user.id;

    const projects = await db.query.conservationProjects.findMany({
      where: eq(conservationProjects.userId, targetUserId),
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
      orderBy: [desc(conservationProjects.createdAt)],
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
