import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projectQuestions, conservationProjects } from "@/db/schema";
import { auth } from "@/auth";
import { eq, and } from "drizzle-orm";
import { validateNoProfanity } from "@/lib/profanity-filter";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, questionId } = await params;
    const projectId = parseInt(id);
    const qId = parseInt(questionId);

    if (isNaN(projectId) || isNaN(qId)) {
      return NextResponse.json(
        { error: "Invalid project or question ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { response } = body;

    if (!response || response.trim().length === 0) {
      return NextResponse.json(
        { error: "Response is required" },
        { status: 400 }
      );
    }

    // Validate for profanity
    try {
      validateNoProfanity(response, 'Response');
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Response contains inappropriate language' },
        { status: 400 }
      );
    }

    // Verify the user owns the project
    const project = await db.query.conservationProjects.findFirst({
      where: eq(conservationProjects.id, projectId),
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to respond to questions for this project" },
        { status: 403 }
      );
    }

    // Update the question with the response
    const [updatedQuestion] = await db
      .update(projectQuestions)
      .set({
        response: response.trim(),
        respondedAt: new Date(),
      })
      .where(
        and(
          eq(projectQuestions.id, qId),
          eq(projectQuestions.projectId, projectId)
        )
      )
      .returning();

    if (!updatedQuestion) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error("Error responding to question:", error);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, questionId } = await params;
    const projectId = parseInt(id);
    const qId = parseInt(questionId);

    if (isNaN(projectId) || isNaN(qId)) {
      return NextResponse.json(
        { error: "Invalid project or question ID" },
        { status: 400 }
      );
    }

    // Verify the user owns the project
    const project = await db.query.conservationProjects.findFirst({
      where: eq(conservationProjects.id, projectId),
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete responses for this project" },
        { status: 403 }
      );
    }

    // Delete the response by setting it to null
    const [updatedQuestion] = await db
      .update(projectQuestions)
      .set({
        response: null,
        respondedAt: null,
      })
      .where(
        and(
          eq(projectQuestions.id, qId),
          eq(projectQuestions.projectId, projectId)
        )
      )
      .returning();

    if (!updatedQuestion) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting response:", error);
    return NextResponse.json(
      { error: "Failed to delete response" },
      { status: 500 }
    );
  }
}
