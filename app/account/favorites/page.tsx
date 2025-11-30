import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { FavoriteButton } from "@/app/components/FavoriteButton";

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

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userFavorites.map((favorite) => {
              const species = favorite.species;
              const imageUrl = species.defaultPhotoUrl || '/placeholder-species.jpg';

              return (
                <div key={favorite.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                  <Link href={`/species/${species.taxonId}`} className="block">
                    <div className="relative h-48 bg-gray-200">
                      <Image
                        src={imageUrl}
                        alt={species.preferredCommonName || species.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    </div>
                  </Link>
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Link href={`/species/${species.taxonId}`} className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-green-600 transition-colors truncate">
                          {species.preferredCommonName || species.name}
                        </h3>
                        {species.preferredCommonName && (
                          <p className="text-sm text-gray-500 italic truncate">
                            {species.name}
                          </p>
                        )}
                      </Link>
                      <div className="ml-2 flex-shrink-0">
                        <FavoriteButton speciesId={species.taxonId} />
                      </div>
                    </div>
                    
                    {species.conservationStatus && (
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          species.conservationStatus === 'endangered' 
                            ? 'bg-red-100 text-red-800'
                            : species.conservationStatus === 'threatened'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {species.conservationStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
