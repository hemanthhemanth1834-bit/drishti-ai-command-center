'use client';
import { useEffect } from 'react';

// Global error boundary: readable failure state with recovery actions.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    try {
      console.error('DRISHTI-X route error:', error.message);
    } catch {
      /* logging unavailable */
    }
  }, [error]);

  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono flex items-center justify-center p-4">
      <div className="max-w-md w-full p-6 rounded-xl bg-[#051424] border border-rose-500/40 text-center">
        <div className="text-4xl">⚠️</div>
        <h1 className="mt-2 text-lg font-extrabold text-white">SOMETHING FAILED TO LOAD</h1>
        <p className="mt-1 text-[12px] text-slate-400">
          This panel hit an error. Your data and other routes are unaffected.
        </p>
        <div className="mt-4 flex gap-2 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-[#00d2ff] text-black text-sm font-bold"
          >
            TRY AGAIN
          </button>
          <a
            href="/safety"
            className="px-4 py-2 rounded-lg border border-[#1b314b] text-sm text-slate-200"
          >
            GO TO SAFETY
          </a>
        </div>
      </div>
    </main>
  );
}
