import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { favorites, species } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Add a favorite
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const speciesId = body.speciesId;

    if (!speciesId) {
      return NextResponse.json(
        { error: "Species ID is required" },
        { status: 400 }
      );
    }

    // Check if species exists by taxonId (iNaturalist ID)
    const speciesRecord = await db.query.species.findFirst({
      where: eq(species.taxonId, speciesId),
    });

    if (!speciesRecord) {
      return NextResponse.json(
        { error: "Species not found in database" },
        { status: 404 }
      );
    }

    // Check if already favorited
    const existingFavorite = await db.query.favorites.findFirst({
      where: and(
        eq(favorites.userId, session.user.id),
        eq(favorites.speciesId, speciesRecord.id)
      ),
    });

    if (existingFavorite) {
      return NextResponse.json(
        { message: "Already favorited", favorite: existingFavorite },
        { status: 200 }
      );
    }

    // Add favorite using the database species ID
    const [newFavorite] = await db
      .insert(favorites)
      .values({
        userId: session.user.id,
        speciesId: speciesRecord.id,
      })
      .returning();

    return NextResponse.json(
      { message: "Favorite added", favorite: newFavorite },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add favorite error:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

// Remove a favorite
export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const speciesId = body.speciesId;

    if (!speciesId) {
      return NextResponse.json(
        { error: "Species ID is required" },
        { status: 400 }
      );
    }

    // Get species record by taxonId
    const speciesRecord = await db.query.species.findFirst({
      where: eq(species.taxonId, speciesId),
    });

    if (!speciesRecord) {
      return NextResponse.json(
        { error: "Species not found" },
        { status: 404 }
      );
    }

    // Remove favorite using database species ID
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, session.user.id),
          eq(favorites.speciesId, speciesRecord.id)
        )
      );

    return NextResponse.json(
      { message: "Favorite removed" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Remove favorite error:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}

// Get all favorites for current user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userFavorites = await db.query.favorites.findMany({
      where: eq(favorites.userId, session.user.id),
      with: {
        species: true,
      },
    });

    return NextResponse.json({ favorites: userFavorites }, { status: 200 });
  } catch (error) {
    console.error("Get favorites error:", error);
    return NextResponse.json(
      { error: "Failed to get favorites" },
      { status: 500 }
    );
  }
}
