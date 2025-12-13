import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { FavoritesGrid } from "./FavoritesGrid";

export default async function FavoritesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Fetch all user's favorite species
  const userFavorites = await db.query.favorites.findMany({
    where: eq(favorites.userId, session.user.id),
    with: {
      species: true,
    },
    orderBy: (favorites, { desc }) => [desc(favorites.createdAt)],
  });

  // Transform favorites into the format expected by SpeciesGrid
  const speciesData = userFavorites.map(fav => ({
    count: 0, // We don't have observation count from favorites
    taxon: {
      id: fav.species.taxonId,
      name: fav.species.name,
      preferred_common_name: fav.species.preferredCommonName || '',
      default_photo: fav.species.defaultPhotoUrl ? {
        medium_url: fav.species.defaultPhotoUrl
      } : undefined,
    }
  }));

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">My Favorites</h1>
          <p className="mt-2 text-gray-600">
            {userFavorites.length === 0 
              ? "You haven't favorited any species yet" 
              : `${userFavorites.length} ${userFavorites.length === 1 ? 'species' : 'species'} saved`}
          </p>
        </div>

        {/* Favorites Grid */}
        {userFavorites.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🤍</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h2>
            <p className="text-gray-600 mb-6">
              Start exploring species and click the heart icon to save your favorites
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Explore Species
            </Link>
          </div>
        ) : (
          <FavoritesGrid species={speciesData} />
        )}

        {/* Back to Dashboard */}
        <div className="mt-8">
          <Link
            href="/account/dashboard"
            className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
