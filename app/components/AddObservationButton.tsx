"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface AddObservationButtonProps {
  speciesId: number;
  speciesName?: string;
  speciesSlug?: string;
}

export function AddObservationButton({
  speciesId,
  speciesName,
  speciesSlug,
}: AddObservationButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user) {
    return null;
  }

  const handleClick = () => {
    const params = new URLSearchParams({
      speciesId: speciesId.toString(),
    });
    
    if (speciesName) {
      params.append("speciesName", speciesName);
    }
    
    if (speciesSlug) {
      params.append("speciesSlug", speciesSlug);
    }

    router.push(`/observations/new?${params.toString()}`);
  };

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
    >
      Add Observation
    </button>
  );
}

