"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteObservationButtonProps {
  observationId: number;
}

export function DeleteObservationButton({ observationId }: DeleteObservationButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/observations/${observationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete observation");
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting observation:", error);
      alert("Failed to delete observation. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isDeleting ? "Deleting..." : "Confirm Delete"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="w-full px-3 py-2 bg-red-50 text-red-600 text-sm rounded-md hover:bg-red-100 transition-colors"
    >
      Delete Observation
    </button>
  );
}
