/**
 * STEP 27 — Event presentation helpers (pure, deterministic, tested).
 * EONET category terminology preserved verbatim; no severity mapping.
 */
import type { DataRecord } from '../../data/engine/types';
import type { EventProperties } from '../../data/engine/adapters';

export type NatEvent = DataRecord<EventProperties>;

export function sortByEventTime(events: NatEvent[]): NatEvent[] {
  return [...events].sort((a, b) => {
    const ta = a.timestamp ? Date.parse(a.timestamp) : NaN;
    const tb = b.timestamp ? Date.parse(b.timestamp) : NaN;
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return tb - ta;
  });
}

export function categoriesOf(events: NatEvent[]): string[] {
  const out: string[] = [];
  for (const e of events) {
    const c = e.properties.categoryTitle ?? 'Uncategorized';
    if (!out.includes(c)) out.push(c);
  }
  return out.sort();
}

export function filterEvents(events: NatEvent[], category: string, openness: 'all' | 'open' | 'closed'): NatEvent[] {
  return events.filter((e) => {
    if (category !== 'all' && (e.properties.categoryTitle ?? 'Uncategorized') !== category) return false;
    if (openness === 'open' && e.properties.open === false) return false;
    if (openness === 'closed' && e.properties.open !== false) return false;
    return true;
  });
}

export function formatEventTime(iso: string | null): string {
  if (!iso) return 'NOT AVAILABLE';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'NOT AVAILABLE';
  return new Date(t).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}

export function opennessLabel(open: boolean | null): string {
  if (open == null) return 'STATUS NOT SUPPLIED';
  return open ? 'OPEN' : 'CLOSED';
}

export interface EventSummary {
  count: number;
  categories: number;
  withCoords: number;
  withoutCoords: number;
  latest: NatEvent | null;
}

export function summarizeEvents(events: NatEvent[]): EventSummary {
  const sorted = sortByEventTime(events);
  return {
    count: events.length,
    categories: categoriesOf(events).length,
    withCoords: events.filter((e) => e.coordinates != null).length,
    withoutCoords: events.filter((e) => e.coordinates == null).length,
    latest: sorted[0] ?? null,
  };
}

export function detailRows(e: NatEvent): [string, string][] {
  const p = e.properties;
  return [
    ['Title', p.title || 'NOT AVAILABLE'],
    ['Category', p.categoryTitle || 'NOT AVAILABLE'],
    ['Event ID', p.eventId || 'NOT AVAILABLE'],
    ['Source event time', formatEventTime(e.timestamp)],
    ['Location', e.coverage || (e.coordinates ? `${e.coordinates.lat.toFixed(2)}, ${e.coordinates.lon.toFixed(2)}` : 'NOT AVAILABLE')],
    ['Coordinates', e.coordinates ? `${e.coordinates.lat.toFixed(4)}, ${e.coordinates.lon.toFixed(4)}` : 'NOT AVAILABLE'],
    ['Description', p.description || 'NOT AVAILABLE'],
    ['Status', opennessLabel(p.open)],
    ['Closed date', p.closedDate ? formatEventTime(p.closedDate) : p.open === false ? 'NOT AVAILABLE' : '—'],
    ['Sources', p.sourceIds.length > 0 ? p.sourceIds.join(', ') : 'NOT AVAILABLE'],
    ['Retrieved', formatEventTime(e.retrievedAt)],
  ];
}
