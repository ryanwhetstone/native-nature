import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateNoProfanity } from "@/lib/profanity-filter";

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, publicName, bio, homeLat, homeLng } = await request.json();

    // Validate for profanity
    if (bio) {
      try {
        validateNoProfanity(bio, 'Bio');
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Bio contains inappropriate language' },
          { status: 400 }
        );
      }
    }

    if (name) {
      try {
        validateNoProfanity(name, 'Name');
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Name contains inappropriate language' },
          { status: 400 }
        );
      }
    }

    if (publicName) {
      try {
        validateNoProfanity(publicName, 'Public name');
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Public name contains inappropriate language' },
          { status: 400 }
        );
      }
    }

    // Update user profile
    await db
      .update(users)
      .set({
        name,
        publicName,
        bio,
        homeLat: homeLat || null,
        homeLng: homeLng || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json(
      { message: "Profile updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
