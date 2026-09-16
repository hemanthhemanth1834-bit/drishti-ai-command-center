'use client';
/** DEMO vs LIVE badge — shown on every ambiguous surface. Never fake live data. */
import { isForceDemo } from '@/nesafe/providers/types';

export default function ModeBadge({ live }: { live?: boolean }) {
  const demo = live ? false : isForceDemo();
  if (demo) {
    return (
      <span className="nesafe-badge nesafe-badge-demo" title="Simulated data — not a government feed">
        DEMO / SIMULATION MODE
      </span>
    );
  }
  return (
    <span className="nesafe-badge nesafe-badge-live">
      LIVE DATA · Last updated {new Date().toLocaleTimeString()}
    </span>
  );
}
