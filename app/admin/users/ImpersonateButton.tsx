'use client';

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ImpersonateButton({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleImpersonate = async () => {
    if (!confirm(`Impersonate ${userName}? You'll see the site as this user does.`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to impersonate user');
      }

      startTransition(() => {
        router.push('/');
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <>
      <button
        onClick={handleImpersonate}
        disabled={isPending}
        className="text-indigo-600 hover:text-indigo-900 ml-4 disabled:opacity-50"
      >
        {isPending ? 'Starting...' : 'Impersonate'}
      </button>
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg">
          {error}
        </div>
      )}
    </>
  );
}
