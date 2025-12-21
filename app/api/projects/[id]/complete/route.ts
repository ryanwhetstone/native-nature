import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { conservationProjects } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

    // Update project status to completed
    const [updatedProject] = await db
      .update(conservationProjects)
      .set({
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(conservationProjects.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error completing project:', error);
    return NextResponse.json(
      { error: 'Failed to complete project' },
      { status: 500 }
    );
  }
}
