/**
 * STEP 25 — Earthquake presentation helpers (pure, deterministic, tested).
 * All values flow from normalized USGS DataRecords. No severity words
 * (minor/major/catastrophic) — magnitudes render as "M x.x" only.
 */
import type { DataRecord } from '../../data/engine/types';
import type { QuakeProperties } from '../../data/engine/adapters';

export type Quake = DataRecord<QuakeProperties>;

export function formatMagnitude(mag: number | null): string {
  return mag == null ? 'M —' : `M ${mag.toFixed(1)}`;
}

export function formatDepth(km: number | null): string {
  return km == null ? 'Depth not available' : `Depth: ${km.toFixed(1)} km`;
}

export function formatCoords(lat: number | null, lon: number | null): string {
  if (lat == null || lon == null) return 'Coordinates not available';
  return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
}

/** Marker radius in px: linear rule radius = 4 + 2.2 * magnitude. */
export function magnitudeRadius(mag: number | null): number {
  if (mag == null) return 5;
  return Math.round((4 + 2.2 * mag) * 10) / 10;
}

/** Depth bucket label — always paired with the numeric km value. */
export function depthBucket(km: number | null): 'SHALLOW' | 'INTERMEDIATE' | 'DEEP' | 'UNKNOWN' {
  if (km == null) return 'UNKNOWN';
  if (km < 70) return 'SHALLOW';
  if (km < 300) return 'INTERMEDIATE';
  return 'DEEP';
}

export function depthColor(km: number | null): string {
  switch (depthBucket(km)) {
    case 'SHALLOW': return '#fb923c';
    case 'INTERMEDIATE': return '#fbbf24';
    case 'DEEP': return '#38bdf8';
    default: return '#64748b';
  }
}

export function timeAgo(iso: string | null, now: number = Date.now()): string {
  if (!iso) return 'time unknown';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'time unknown';
  const mins = Math.max(0, Math.round((now - t) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatUtc(iso: string | null): string {
  if (!iso) return 'NOT AVAILABLE';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'NOT AVAILABLE';
  return new Date(t).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}

/** Newest-first sort by event timestamp; unknown timestamps sink last. */
export function sortByEventTime(quakes: Quake[]): Quake[] {
  return [...quakes].sort((a, b) => {
    const ta = a.timestamp ? Date.parse(a.timestamp) : NaN;
    const tb = b.timestamp ? Date.parse(b.timestamp) : NaN;
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return tb - ta;
  });
}

export interface QuakeSummary {
  count: number;
  strongest: Quake | null;
  latest: Quake | null;
}

export function summarize(quakes: Quake[]): QuakeSummary {
  if (quakes.length === 0) return { count: 0, strongest: null, latest: null };
  let strongest = quakes[0];
  let latest = quakes[0];
  for (const q of quakes) {
    const m = q.properties.magnitude;
    const sm = strongest.properties.magnitude;
    if (m != null && (sm == null || m > sm)) strongest = q;
    const t = q.timestamp ? Date.parse(q.timestamp) : NaN;
    const lt = latest.timestamp ? Date.parse(latest.timestamp) : NaN;
    if (!Number.isNaN(t) && (Number.isNaN(lt) || t > lt)) latest = q;
  }
  return { count: quakes.length, strongest, latest };
}

/** Detail rows for the event dialog — only available fields, else NOT AVAILABLE. */
export function detailRows(q: Quake): [string, string][] {
  const p = q.properties;
  return [
    ['Event ID', p.eventId || 'NOT AVAILABLE'],
    ['Magnitude', p.magnitude != null ? `M ${p.magnitude.toFixed(1)}` : 'NOT AVAILABLE'],
    ['Place', p.place || 'NOT AVAILABLE'],
    ['Latitude', q.coordinates ? q.coordinates.lat.toFixed(4) : 'NOT AVAILABLE'],
    ['Longitude', q.coordinates ? q.coordinates.lon.toFixed(4) : 'NOT AVAILABLE'],
    ['Depth', p.depthKm != null ? `${p.depthKm.toFixed(1)} km (${depthBucket(p.depthKm)})` : 'NOT AVAILABLE'],
    ['Origin time', formatUtc(q.timestamp)],
    ['Retrieved', formatUtc(q.retrievedAt)],
    ['Tsunami flag', p.tsunami ? 'YES (USGS flag set)' : 'No flag'],
    ['Status', q.status],
    ['Freshness', q.freshness],
  ];
}

/** prefers-reduced-motion query (safe default true when unavailable). */
export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true;
  } catch {
    return true;
  }
}
