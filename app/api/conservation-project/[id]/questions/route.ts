import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projectQuestions } from "@/db/schema";
import { auth } from "@/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { question, askerName } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const session = await auth();
    const userId = session?.user?.id || null;

    // If not logged in and no askerName provided, require a name
    if (!userId && (!askerName || askerName.trim().length === 0)) {
      return NextResponse.json(
        { error: "Name is required for anonymous questions" },
        { status: 400 }
      );
    }

    // Create the question
    const [newQuestion] = await db
      .insert(projectQuestions)
      .values({
        projectId,
        userId,
        askerName: userId ? null : askerName,
        question: question.trim(),
      })
      .returning();

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Failed to submit question" },
      { status: 500 }
    );
  }
}
