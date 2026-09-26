/**
 * EONET event tests (Step 27) — 16 deterministic cases, mocked payloads.
 * No live NASA dependency. Fixtures never reach production paths.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { adaptEonetEvents } from '../adapters';
import { fetchDataset } from '../engine';
import { cacheClear } from '../cache';
import { getSource, resetHealth } from '../registry';
import {
  categoriesOf,
  detailRows,
  filterEvents,
  formatEventTime,
  opennessLabel,
  sortByEventTime,
  summarizeEvents,
} from '../../../components/events/eventUtils';

const EONET = {
  events: [
    {
      id: 'EONET_1', title: 'Wildfire Alpha', description: 'Test fire',
      link: 'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_1', closed: null,
      categories: [{ id: 'wildfires', title: 'Wildfires' }],
      sources: [{ id: 'InciWeb' }],
      geometry: [
        { date: '2026-09-20T10:00:00Z', type: 'Point', coordinates: [-88.8, 31.0] },
        { date: '2026-09-22T10:00:00Z', type: 'Point', coordinates: [-88.9, 31.1] },
      ],
    },
    {
      id: 'EONET_2', title: 'Storm Beta', description: '',
      link: 'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_2', closed: '2026-09-21T00:00:00Z',
      categories: [{ id: 'severeStorms', title: 'Severe Storms' }],
      sources: [],
      geometry: [{ date: '2026-09-19T00:00:00Z', type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] }],
    },
    { title: 'No ID event', categories: [], geometry: [] },
  ],
};

afterEach(() => {
  cacheClear();
  resetHealth();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('adaptEonetEvents', () => {
  it('1. normalizes valid events, latest geometry wins', () => {
    const { records, skipped } = adaptEonetEvents(EONET);
    expect(records).toHaveLength(2);
    expect(skipped).toBe(1);
    expect(records[0].coordinates).toEqual({ lat: 31.1, lon: -88.9 });
    expect(records[0].timestamp).toBe('2026-09-22T10:00:00.000Z');
    expect(records[0].properties.open).toBe(true);
    expect(records[0].properties.categoryTitle).toBe('Wildfires');
  });

  it('2. preserves multiple categories verbatim', () => {
    const { records } = adaptEonetEvents(EONET);
    expect(categoriesOf(records)).toEqual(['Severe Storms', 'Wildfires']);
  });

  it('3. polygon geometry becomes list-only, no fake point', () => {
    const { records } = adaptEonetEvents(EONET);
    const storm = records.find((r) => r.properties.eventId === 'EONET_2')!;
    expect(storm.coordinates).toBeNull();
    expect(storm.properties.open).toBe(false);
    expect(storm.properties.closedDate).toBe('2026-09-21T00:00:00.000Z');
  });

  it('4. missing coordinates stay missing', () => {
    const { records } = adaptEonetEvents({ events: [{ id: 'X', title: 'T', categories: [], sources: [], geometry: [] }] });
    expect(records).toHaveLength(1);
    expect(records[0].coordinates).toBeNull();
    expect(records[0].timestamp).toBeNull();
  });

  it('5. missing timestamps stay missing', () => {
    expect(formatEventTime(null)).toBe('NOT AVAILABLE');
    expect(formatEventTime('garbage')).toBe('NOT AVAILABLE');
    expect(formatEventTime('2026-09-22T10:00:00Z')).toBe('2026-09-22 10:00 UTC');
  });

  it('6. malformed payload never crashes', () => {
    expect(adaptEonetEvents(null)).toEqual({ records: [], skipped: 0 });
    expect(adaptEonetEvents({})).toEqual({ records: [], skipped: 0 });
    expect(adaptEonetEvents({ events: 'nope' })).toEqual({ records: [], skipped: 0 });
  });

  it('7. category terminology preserved', () => {
    const { records } = adaptEonetEvents(EONET);
    expect(records[0].properties.categoryId).toBe('wildfires');
    expect(records[0].properties.sourceIds).toEqual(['InciWeb']);
  });

  it('8. source URL preserved', () => {
    const { records } = adaptEonetEvents(EONET);
    expect(records[0].properties.sourceUrl).toBe('https://eonet.gsfc.nasa.gov/api/v3/events/EONET_1');
  });
});

describe('event utils', () => {
  it('9. sorts newest first', () => {
    const { records } = adaptEonetEvents(EONET);
    const sorted = sortByEventTime(records);
    expect(sorted[0].properties.eventId).toBe('EONET_1');
  });

  it('10. open/closed filtering', () => {
    const { records } = adaptEonetEvents(EONET);
    expect(filterEvents(records, 'all', 'open')).toHaveLength(1);
    expect(filterEvents(records, 'all', 'closed')).toHaveLength(1);
    expect(filterEvents(records, 'Wildfires', 'all')).toHaveLength(1);
    expect(filterEvents(records, 'Nope', 'all')).toHaveLength(0);
    expect(opennessLabel(true)).toBe('OPEN');
    expect(opennessLabel(false)).toBe('CLOSED');
    expect(opennessLabel(null)).toBe('STATUS NOT SUPPLIED');
  });

  it('11. empty dataset summarizes to zeros', () => {
    expect(summarizeEvents([])).toEqual({ count: 0, categories: 0, withCoords: 0, withoutCoords: 0, latest: null });
  });

  it('16. geometry count preserved', () => {
    const { records } = adaptEonetEvents(EONET);
    expect(records[0].properties.geometryCount).toBe(2);
  });
});

describe('engine integration', () => {
  it('12. cache behavior via engine', async () => {
    const calls = { n: 0 };
    vi.stubGlobal('fetch', async () => {
      calls.n += 1;
      return { ok: true, status: 200, json: async () => EONET } as Response;
    });
    const a = await fetchDataset('eonet-events', {}, { backoffBaseMs: 1 });
    const b = await fetchDataset('eonet-events', {}, { backoffBaseMs: 1 });
    expect(a.cache).toBe('MISS');
    expect(b.cache).toBe('HIT');
    expect(calls.n).toBe(1);
    expect(a.records).toHaveLength(2);
  });

  it('13. offline with no cache is honest', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    const calls = { n: 0 };
    vi.stubGlobal('fetch', async () => {
      calls.n += 1;
      return { ok: true, status: 200, json: async () => EONET } as Response;
    });
    const r = await fetchDataset('eonet-events', {}, { backoffBaseMs: 1 });
    expect(r.provenance.status).toBe('OFFLINE');
    expect(r.records).toHaveLength(0);
  });

  it('14. provenance carries EONET attribution', async () => {
    const calls = { n: 0 };
    vi.stubGlobal('fetch', async () => {
      calls.n += 1;
      return { ok: true, status: 200, json: async () => EONET } as Response;
    });
    const r = await fetchDataset('eonet-events', {}, { backoffBaseMs: 1 });
    expect(r.provenance.source).toBe('NASA EONET');
    expect(calls.n).toBe(1);
  });

  it('15. no fabricated fields in output', () => {
    const { records } = adaptEonetEvents(EONET);
    const text = JSON.stringify(records).toLowerCase();
    for (const w of ['casualt', 'damage', 'severity', 'risk', 'predict', 'confidence']) {
      expect(text).not.toContain(w);
    }
    expect(getSource('nasa-eonet')?.enabled).toBe(true);
  });
});
