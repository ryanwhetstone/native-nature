"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface FavoriteButtonProps {
  speciesId: number;
  className?: string;
  showLabel?: boolean;
}

export function FavoriteButton({ speciesId, className = "", showLabel = false }: FavoriteButtonProps) {
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
      className={`${showLabel ? 'flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm' : ''} transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <span className={showLabel ? "text-xl" : "text-2xl drop-shadow-lg"}>{isFavorited ? "❤️" : "🤍"}</span>
      {showLabel && <span className="text-gray-700">{loading ? "..." : isFavorited ? "Favorited" : "Favorite"}</span>}
    </button>
  );
}
