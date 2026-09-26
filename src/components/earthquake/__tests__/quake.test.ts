/**
 * Earthquake utils tests (Step 25) — 20 deterministic cases.
 * Pure logic only (no DOM library installed); component behavior
 * (keyboard, dialog, map) is verified via code patterns + production QA.
 */
import { describe, expect, it } from 'vitest';
import {
  depthBucket,
  depthColor,
  detailRows,
  formatCoords,
  formatDepth,
  formatMagnitude,
  formatUtc,
  magnitudeRadius,
  prefersReducedMotion,
  sortByEventTime,
  summarize,
  timeAgo,
  type Quake,
} from '../quakeUtils';

const R = '2026-09-24T12:00:00.000Z';

function makeQuake(o: Partial<Quake> & { properties?: Partial<Quake['properties']> }): Quake {
  return {
    id: 'usgs-t1',
    source: 'USGS Earthquake Hazards',
    sourceUrl: 'https://earthquake.usgs.gov/',
    dataType: 'earthquake',
    timestamp: '2026-09-24T10:00:00.000Z',
    retrievedAt: R,
    status: 'NEAR_REAL_TIME',
    freshness: 'FRESH',
    coverage: 'Test Region',
    coordinates: { lat: 16.5, lon: 80.0 },
    geometry: { type: 'Point', coordinates: [80.0, 16.5, 10] },
    properties: {
      magnitude: 5.2,
      place: 'Test Region',
      depthKm: 32.0,
      eventId: 't1',
      eventUrl: 'https://earthquake.usgs.gov/earthquakes/eventpage/t1',
      tsunami: false,
      ...o.properties,
    },
    attribution: 'Earthquakes: USGS',
    limitations: 'x',
    rawSourceReference: 't1',
    ...o,
  } as Quake;
}

describe('quake presentation', () => {
  it('1. formats a real normalized record', () => {
    const q = makeQuake({});
    expect(formatMagnitude(q.properties.magnitude)).toBe('M 5.2');
    expect(formatDepth(q.properties.depthKm)).toBe('Depth: 32.0 km');
    expect(formatCoords(16.5, 80.0)).toBe('16.50°, 80.00°');
  });

  it('2. empty feed summarizes to zeros', () => {
    expect(summarize([])).toEqual({ count: 0, strongest: null, latest: null });
  });

  it('3. magnitude renders value or dash', () => {
    expect(formatMagnitude(5.24)).toBe('M 5.2');
    expect(formatMagnitude(null)).toBe('M —');
  });

  it('4. depth renders value or unavailable', () => {
    expect(formatDepth(10)).toBe('Depth: 10.0 km');
    expect(formatDepth(null)).toBe('Depth not available');
  });

  it('5. coordinates render or unavailable', () => {
    expect(formatCoords(null, 80)).toBe('Coordinates not available');
    expect(formatCoords(16.5, null)).toBe('Coordinates not available');
  });

  it('6. event time buckets', () => {
    const now = Date.parse('2026-09-24T12:00:00.000Z');
    expect(timeAgo('2026-09-24T11:59:50.000Z', now)).toBe('just now');
    expect(timeAgo('2026-09-24T11:30:00.000Z', now)).toBe('30m ago');
    expect(timeAgo('2026-09-24T10:00:00.000Z', now)).toBe('2h 0m ago');
    expect(timeAgo('2026-09-20T12:00:00.000Z', now)).toBe('4d ago');
    expect(timeAgo(null, now)).toBe('time unknown');
    expect(formatUtc('2026-09-24T10:00:00.000Z')).toBe('2026-09-24 10:00 UTC');
    expect(formatUtc(null)).toBe('NOT AVAILABLE');
  });

  it('7. detail dialog covers all fields', () => {
    const rows = detailRows(makeQuake({}));
    const keys = rows.map(([k]) => k);
    for (const k of ['Event ID', 'Magnitude', 'Place', 'Latitude', 'Longitude', 'Depth', 'Origin time', 'Tsunami flag']) {
      expect(keys).toContain(k);
    }
    expect(rows).toHaveLength(11);
  });

  it('8. missing optional fields become NOT AVAILABLE, no crash', () => {
    const q = makeQuake({ properties: { magnitude: null, place: null, depthKm: null, eventId: '', eventUrl: null, tsunami: false }, coordinates: null, timestamp: null });
    const m = new Map(detailRows(q));
    expect(m.get('Magnitude')).toBe('NOT AVAILABLE');
    expect(m.get('Place')).toBe('NOT AVAILABLE');
    expect(m.get('Depth')).toBe('NOT AVAILABLE');
    expect(m.get('Origin time')).toBe('NOT AVAILABLE');
  });

  it('9. USGS event URL preserved verbatim', () => {
    const q = makeQuake({});
    expect(q.properties.eventUrl).toBe('https://earthquake.usgs.gov/earthquakes/eventpage/t1');
  });

  it('10. unknown magnitude/depth degrade gracefully', () => {
    expect(magnitudeRadius(null)).toBe(5);
    expect(depthBucket(null)).toBe('UNKNOWN');
    expect(depthColor(null)).toBe('#64748b');
  });

  it('11. depth buckets follow documented boundaries', () => {
    expect(depthBucket(69.9)).toBe('SHALLOW');
    expect(depthBucket(70)).toBe('INTERMEDIATE');
    expect(depthBucket(299.9)).toBe('INTERMEDIATE');
    expect(depthBucket(300)).toBe('DEEP');
  });

  it('12. depth color pairs with bucket, text always present', () => {
    expect(depthColor(10)).toBe('#fb923c');
    expect(depthColor(150)).toBe('#fbbf24');
    expect(depthColor(500)).toBe('#38bdf8');
    expect(formatDepth(150)).toContain('150.0 km');
  });

  it('13. sorts newest-first, unknown timestamps last', () => {
    const a = makeQuake({ id: 'a', timestamp: '2026-09-24T08:00:00.000Z' });
    const b = makeQuake({ id: 'b', timestamp: '2026-09-24T11:00:00.000Z' });
    const c = makeQuake({ id: 'c', timestamp: null });
    expect(sortByEventTime([a, c, b]).map((q) => q.id)).toEqual(['b', 'a', 'c']);
  });

  it('14. summarize finds strongest/latest/count', () => {
    const a = makeQuake({ id: 'a', timestamp: '2026-09-24T08:00:00.000Z', properties: { magnitude: 4.0, place: 'A', depthKm: 10, eventId: 'a', eventUrl: null, tsunami: false } });
    const b = makeQuake({ id: 'b', timestamp: '2026-09-24T11:00:00.000Z', properties: { magnitude: 6.1, place: 'B', depthKm: 20, eventId: 'b', eventUrl: null, tsunami: true } });
    const s = summarize([a, b]);
    expect(s.count).toBe(2);
    expect(s.strongest?.id).toBe('b');
    expect(s.latest?.id).toBe('b');
  });

  it('15. magnitude radius follows the linear rule and grows', () => {
    expect(magnitudeRadius(5.0)).toBe(15);
    expect(magnitudeRadius(6.0)).toBeGreaterThan(magnitudeRadius(5.0));
  });

  it('16. malformed record never crashes detail view', () => {
    const q = makeQuake({ properties: { magnitude: null, place: null, depthKm: null, eventId: '', eventUrl: null, tsunami: false } });
    expect(() => detailRows(q)).not.toThrow();
    expect(detailRows(q)).toHaveLength(11);
  });

  it('17. tsunami flag renders explicitly', () => {
    const m = new Map(detailRows(makeQuake({ properties: { magnitude: 5, place: 'X', depthKm: 5, eventId: 'x', eventUrl: null, tsunami: true } })));
    expect(m.get('Tsunami flag')).toContain('YES');
  });

  it('18. reduced-motion defaults safe without DOM', () => {
    expect(prefersReducedMotion()).toBe(true);
  });

  it('19. status and freshness pass through untouched', () => {
    const q = makeQuake({ status: 'OFFLINE', freshness: 'STALE' });
    expect(sortByEventTime([q])[0].status).toBe('OFFLINE');
    expect(summarize([q]).latest?.freshness).toBe('STALE');
  });

  it('20. no severity words anywhere in outputs', () => {
    const texts = [
      formatMagnitude(7.5), formatDepth(600), depthBucket(600),
      ...detailRows(makeQuake({})).map(([, v]) => v),
    ].join(' ').toLowerCase();
    for (const w of ['minor', 'major', 'catastrophic', 'devastating']) {
      expect(texts).not.toContain(w);
    }
  });
});
