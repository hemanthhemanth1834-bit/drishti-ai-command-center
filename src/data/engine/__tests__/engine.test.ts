/**
 * Data engine tests (Step 22) — 18 deterministic cases, mocked fetch only.
 * No live external APIs. Covers: request, errors, cache, dedup, retry,
 * rate-limit, offline, freshness, provenance, validation, registry, status.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { request } from '../client';
import { cacheClear } from '../cache';
import { computeFreshness, getSource, resetHealth, SOURCE_REGISTRY } from '../registry';
import { fetchDataset } from '../engine';
import {
  isValidCoordinates,
  toUtcIso,
} from '../errors';

type Json = unknown;

function resp(ok: boolean, status: number, json: Json | Error, calls: { n: number }): Response {
  calls.n += 1;
  return {
    ok,
    status,
    json: async () => {
      if (json instanceof Error) throw json;
      return json;
    },
  } as Response;
}

const USGS_OK = {
  type: 'FeatureCollection',
  features: [
    {
      id: 'us123',
      properties: { mag: 5.2, place: 'Test Region', time: 1727000000000, updated: 1727000100000, url: 'https://example.com/us123', tsunami: 0 },
      geometry: { type: 'Point', coordinates: [80.0, 16.5, 10.0] },
    },
    {
      id: 'bad1',
      properties: { mag: 4.0, place: 'Nowhere', time: 1727000000000 },
      geometry: { type: 'Point', coordinates: [9999, 9999] },
    },
  ],
};

const OM_OK = {
  current: { time: '2026-09-24T06:00', temperature_2m: 27.3, relative_humidity_2m: 71, precipitation: 0.0, weather_code: 1, wind_speed_10m: 4.5 },
};

afterEach(() => {
  cacheClear();
  resetHealth();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('client.request', () => {
  it('1. succeeds on 200 JSON', async () => {
    const calls = { n: 0 };
    vi.stubGlobal('fetch', async () => resp(true, 200, { a: 1 }, calls));
    const r = await request('t', 'ep', 'https://x.test/a', { backoffBaseMs: 1 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual({ a: 1 });
    expect(calls.n).toBe(1);
  });

  it('2. times out on hanging fetch', async () => {
    vi.stubGlobal('fetch', (url: string, init?: { signal?: AbortSignal }) => new Promise((_res, rej) => {
      init?.signal?.addEventListener('abort', () => {
        rej(new DOMException('aborted', 'AbortError'));
      });
    }) as Promise<Response>);
    const r = await request('t', 'ep', 'https://x.test/b', { timeoutMs: 20, maxRetries: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('TIMEOUT');
  });

  it('3. maps rejection to NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', async () => { throw new TypeError('boom'); });
    const r = await request('t', 'ep', 'https://x.test/c', { maxRetries: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('NETWORK_ERROR');
  });

  it('4. maps 404 to HTTP_ERROR without retry', async () => {
    const calls = { n: 0 };
    vi.stubGlobal('fetch', async () => resp(false, 404, {}, calls));
    const r = await request('t', 'ep', 'https://x.test/d', { maxRetries: 3, backoffBaseMs: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.kind).toBe('HTTP_ERROR');
      expect(r.attempts).toBe(1);
    }
  });

  it('5. maps bad JSON to PARSE_ERROR', async () => {
    vi.stubGlobal('fetch', async () => resp(true, 200, new Error('nope'), { n: 0 }));
    const r = await request('t', 'ep', 'https://x.test/e', { maxRetries: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('PARSE_ERROR');
  });

  it('10. retries 500 then succeeds', async () => {
    const calls = { n: 0 };
    vi.stubGlobal('fetch', async () => (calls.n === 0 ? resp(false, 500, {}, calls) : resp(true, 200, { ok: 1 }, calls)));
    const r = await request('t', 'ep', 'https://x.test/f', { maxRetries: 2, backoffBaseMs: 1 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.attempts).toBe(2);
  });

  it('11. maps 429 to RATE_LIMITED', async () => {
    vi.stubGlobal('fetch', async () => resp(false, 429, {}, { n: 0 }));
    const r = await request('t', 'ep', 'https://x.test/g', { maxRetries: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('RATE_LIMITED');
  });

  it('18. maps 401 to AUTH_REQUIRED without retry', async () => {
    const calls = { n: 0 };
    vi.stubGlobal('fetch', async () => resp(false, 401, {}, calls));
    const r = await request('t', 'ep', 'https://x.test/h', { maxRetries: 3, backoffBaseMs: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.kind).toBe('AUTH_REQUIRED');
      expect(r.attempts).toBe(1);
    }
  });
});

describe('adapters + validation', () => {
  it('6. skips malformed USGS records safely', async () => {
    vi.stubGlobal('fetch', async () => resp(true, 200, USGS_OK, { n: 0 }));
    const r = await fetchDataset('usgs-earthquakes-7d', {}, { backoffBaseMs: 1 });
    expect(r.records).toHaveLength(1);
    expect(r.skipped).toBe(1);
    expect(r.records[0].properties).toMatchObject({ magnitude: 5.2 });
    expect(r.records[0].coordinates).toEqual({ lat: 16.5, lon: 80.0 });
  });

  it('15. rejects invalid coordinates', () => {
    expect(isValidCoordinates(91, 0)).toBe(false);
    expect(isValidCoordinates(0, 181)).toBe(false);
    expect(isValidCoordinates(16.5, 80.0)).toBe(true);
    expect(isValidCoordinates('x', 80)).toBe(false);
  });

  it('16. normalizes timestamps to UTC ISO, never invents', () => {
    expect(toUtcIso(1727000000000)).toBe('2024-09-22T10:13:20.000Z');
    expect(toUtcIso('not-a-date')).toBeNull();
    expect(toUtcIso(null)).toBeNull();
  });
});

describe('cache + dedup + offline', () => {
  it('7. serves cache HIT on second call with one fetch', async () => {
    const calls = { n: 0 };
    vi.stubGlobal('fetch', async () => resp(true, 200, USGS_OK, calls));
    const a = await fetchDataset('usgs-earthquakes-7d', {}, { backoffBaseMs: 1 });
    const b = await fetchDataset('usgs-earthquakes-7d', {}, { backoffBaseMs: 1 });
    expect(a.cache).toBe('MISS');
    expect(b.cache).toBe('HIT');
    expect(calls.n).toBe(1);
  });

  it('8. refetches after TTL expiry', async () => {
    const calls = { n: 0 };
    vi.stubGlobal('fetch', async () => resp(true, 200, USGS_OK, calls));
    await fetchDataset('usgs-earthquakes-7d', {}, { ttlMs: 5, backoffBaseMs: 1 });
    await new Promise((r) => setTimeout(r, 15));
    const b = await fetchDataset('usgs-earthquakes-7d', {}, { ttlMs: 5, backoffBaseMs: 1 });
    expect(b.cache).toBe('MISS');
    expect(calls.n).toBe(2);
  });

  it('9. deduplicates concurrent identical requests', async () => {
    const calls = { n: 0 };
    vi.stubGlobal('fetch', async () => {
      await new Promise((r) => setTimeout(r, 20));
      return resp(true, 200, USGS_OK, calls);
    });
    const [a, b] = await Promise.all([
      fetchDataset('usgs-earthquakes-7d', {}, { backoffBaseMs: 1 }),
      fetchDataset('usgs-earthquakes-7d', {}, { backoffBaseMs: 1 }),
    ]);
    expect(a.records).toHaveLength(1);
    expect(b.records).toHaveLength(1);
    expect(calls.n).toBe(1);
  });

  it('12. returns OFFLINE with no cache when offline', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    const calls = { n: 0 };
    vi.stubGlobal('fetch', async () => resp(true, 200, USGS_OK, calls));
    const r = await fetchDataset('usgs-earthquakes-7d', {}, { backoffBaseMs: 1 });
    expect(r.provenance.status).toBe('OFFLINE');
    expect(r.records).toHaveLength(0);
    expect(calls.n).toBe(0);
  });
});

describe('freshness + provenance + registry + status', () => {
  it('13. computes FRESH/AGING/STALE/UNKNOWN', () => {
    const now = '2026-09-24T12:00:00.000Z';
    expect(computeFreshness('2026-09-24T11:50:00.000Z', now, 15 * 60e3, 60 * 60e3)).toBe('FRESH');
    expect(computeFreshness('2026-09-24T11:00:00.000Z', now, 15 * 60e3, 60 * 60e3)).toBe('AGING');
    expect(computeFreshness('2026-09-23T12:00:00.000Z', now, 15 * 60e3, 60 * 60e3)).toBe('STALE');
    expect(computeFreshness(null, now, 15 * 60e3, 60 * 60e3)).toBe('UNKNOWN');
  });

  it('14. preserves provenance on success', async () => {
    vi.stubGlobal('fetch', async () => resp(true, 200, OM_OK, { n: 0 }));
    const r = await fetchDataset('openmeteo-current', { lat: 17.38, lon: 78.48 }, { backoffBaseMs: 1 });
    expect(r.records).toHaveLength(1);
    expect(r.provenance.source).toBe('Open-Meteo');
    expect(r.provenance.attribution).toContain('CC-BY');
    expect(r.records[0].properties).toMatchObject({ temperatureC: 27.3, kind: 'observation' });
  });

  it('17. registry lists 7 sources with contracts', () => {
    expect(SOURCE_REGISTRY).toHaveLength(7);
    const usgs = getSource('usgs');
    expect(usgs?.adapter).toBe('EarthquakeAdapter');
    expect(usgs?.enabled).toBe(true);
    expect(getSource('nasa-firms')?.enabled).toBe(false);
    expect(getSource('nasa-firms')?.envVar).toBe('FIRMS_MAP_KEY');
    expect(getSource('nope')).toBeNull();
  });
});
