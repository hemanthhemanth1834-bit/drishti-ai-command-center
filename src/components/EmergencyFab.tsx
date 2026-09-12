'use client';
import Link from 'next/link';
import { Siren } from 'lucide-react';

/** Persistent floating Emergency button — visible on every route. */
export default function EmergencyFab() {
  return (
    <Link
      href="/emergency"
      aria-label="Open Emergency Mode"
      className="fixed bottom-20 md:bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.6)] border border-rose-300/50"
    >
      <Siren className="w-6 h-6" />
    </Link>
  );
}
