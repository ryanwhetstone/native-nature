'use client';

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ImpersonationBanner({ userName, userId }: { userName: string; userId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleStopImpersonating = async () => {
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to stop impersonating');
      }

      startTransition(() => {
        router.push('/admin/users');
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <>
      <div className="bg-yellow-500 text-black py-2 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <span className="font-semibold">
            ⚠️ Viewing as: {userName}
          </span>
          <button
            onClick={handleStopImpersonating}
            disabled={isPending}
            className="bg-black text-white px-4 py-1 rounded hover:bg-gray-800 disabled:opacity-50 text-sm font-medium"
          >
            {isPending ? 'Stopping...' : 'Stop Impersonating'}
          </button>
        </div>
      </div>
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {error}
        </div>
      )}
    </>
  );
}
