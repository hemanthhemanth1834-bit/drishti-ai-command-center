/**
 * STEP 29 — Model display helpers (pure, deterministic, tested).
 * SYNTHETIC-DEMO detection is substring-based and case-insensitive;
 * the banner decision must never be bypassable by casing tricks.
 */

export function isSyntheticDemoKind(dataKind: unknown): boolean {
  if (typeof dataKind !== 'string') return false;
  const k = dataKind.toLowerCase();
  return k.includes('synthet') || k.includes('demo');
}

export type ModelBadge = 'SYNTHETIC-DEMO' | 'OPERATIONAL' | 'UNKNOWN';

export function modelBadge(dataKind: unknown, status: unknown): ModelBadge {
  if (isSyntheticDemoKind(dataKind)) return 'SYNTHETIC-DEMO';
  if (typeof status === 'string' && status.toUpperCase() === 'READY') return 'OPERATIONAL';
  return 'UNKNOWN';
}

export function healthLabel(status: unknown, reachable: boolean): string {
  if (!reachable) return 'MODEL OFFLINE';
  const s = typeof status === 'string' ? status.toUpperCase() : '';
  if (s === 'HEALTHY' || s === 'READY') return 'MODEL HEALTHY';
  if (s === 'NOT_TRAINED') return 'MODEL DEGRADED';
  return 'NOT AVAILABLE';
}

export function metricCell(v: unknown): string {
  return v === undefined || v === null ? 'NOT AVAILABLE' : String(v);
}

export function timelineEntries(input: {
  trainedAt?: unknown;
  evaluatedAt?: unknown;
  retrievedAt: string;
}): { label: string; value: string }[] {
  const fmt = (v: unknown): string => {
    if (typeof v !== 'string' || !v) return 'NOT AVAILABLE';
    const t = Date.parse(v);
    if (Number.isNaN(t)) return 'NOT AVAILABLE';
    return new Date(t).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  };
  return [
    { label: 'TRAINED', value: fmt(input.trainedAt) },
    { label: 'EVALUATED', value: fmt(input.evaluatedAt) },
    { label: 'RETRIEVED', value: fmt(input.retrievedAt) },
  ];
}
