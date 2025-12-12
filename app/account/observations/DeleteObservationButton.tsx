"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/app/components/Toast";

interface DeleteObservationButtonProps {
  observationId: number;
}

export function DeleteObservationButton({ observationId }: DeleteObservationButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
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

      showToast("Observation deleted successfully");

      // If we're on the observation detail page, go to dashboard
      // Otherwise just refresh the current page
      if (pathname?.startsWith('/observation/')) {
        router.push('/account/dashboard');
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting observation:", error);
      showToast("Failed to delete observation. Please try again.", "error");
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
          className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isDeleting ? "Deleting..." : "Confirm"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-md hover:bg-red-100 transition-colors whitespace-nowrap"
    >
      Delete
    </button>
  );
}
