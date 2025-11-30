import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ isFavorited: false }, { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const speciesId = searchParams.get("speciesId");

    if (!speciesId) {
      return NextResponse.json(
        { error: "Species ID is required" },
        { status: 400 }
      );
    }

    const favorite = await db.query.favorites.findFirst({
      where: and(
        eq(favorites.userId, session.user.id),
        eq(favorites.speciesId, parseInt(speciesId))
      ),
    });

    return NextResponse.json({ isFavorited: !!favorite }, { status: 200 });
  } catch (error) {
    console.error("Check favorite error:", error);
    return NextResponse.json(
      { error: "Failed to check favorite status" },
      { status: 500 }
    );
  }
}
