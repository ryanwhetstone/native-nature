"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface FavoriteButtonProps {
  speciesId: number;
  className?: string;
}

export function FavoriteButton({ speciesId, className = "" }: FavoriteButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      checkFavoriteStatus();
    }
  }, [session, speciesId]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch(`/api/favorites/check?speciesId=${speciesId}`);
      if (response.ok) {
        const data = await response.json();
        setIsFavorited(data.isFavorited);
      }
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const toggleFavorite = async () => {
    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    setLoading(true);

    try {
      const method = isFavorited ? "DELETE" : "POST";
      const response = await fetch("/api/favorites", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speciesId }),
      });

      if (response.ok) {
        setIsFavorited(!isFavorited);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isFavorited
          ? "bg-red-600 text-white hover:bg-red-700"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      } ${className}`}
      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <span className="text-xl">{isFavorited ? "❤️" : "🤍"}</span>
      <span>{loading ? "..." : isFavorited ? "Favorited" : "Favorite"}</span>
    </button>
  );
}
