/**
 * Fire engine tests (Step 24) — deterministic, no live FIRMS calls.
 * Adapter normalization, malformed skips, NOT_CONFIGURED gating,
 * and the no-synthetic-fires guarantee.
 */
import { describe, expect, it, vi, afterEach } from 'vitest';
import { adaptFirmsFires } from '../adapters';
import { fetchDataset } from '../engine';
import { cacheClear } from '../cache';
import { resetHealth } from '../registry';

const FIRMS_ROWS = [
  {
    latitude: 17.42, longitude: 78.51, acq_date: '2026-09-20', acq_time: '0730',
    confidence: 'h', satellite: 'Suomi NPP', instrument: 'VIIRS', bright_t31: 310.5, frp: 12.4,
    daynight: 'D', version: '2.0NRT',
  },
  { latitude: 9999, longitude: 78.5, acq_date: '2026-09-20', acq_time: '0730', confidence: 'l' },
  { latitude: 17.4, longitude: 78.5, confidence: 'n' },
];

afterEach(() => {
  cacheClear();
  resetHealth();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('adaptFirmsFires', () => {
  it('normalizes valid rows with UTC timestamps', () => {
    const { records, skipped } = adaptFirmsFires(FIRMS_ROWS);
    expect(records).toHaveLength(2);
    expect(skipped).toBe(1);
    expect(records[0].timestamp).toBe('2026-09-20T07:30:00.000Z');
    expect(records[0].coordinates).toEqual({ lat: 17.42, lon: 78.51 });
    expect(records[0].properties).toMatchObject({ confidence: 'h', satellite: 'Suomi NPP', frpMw: 12.4 });
    expect(records[0].status).toBe('NEAR_REAL_TIME');
    // Missing timestamp stays unknown — never replaced with now.
    expect(records[1].timestamp).toBeNull();
  });

  it('rejects non-array payloads without crashing', () => {
    expect(adaptFirmsFires(null)).toEqual({ records: [], skipped: 0 });
    expect(adaptFirmsFires({})).toEqual({ records: [], skipped: 0 });
  });

  it('accepts wrapped { fires: [] } payloads', () => {
    const { records } = adaptFirmsFires({ fires: [FIRMS_ROWS[0]] });
    expect(records).toHaveLength(1);
  });
});

describe('firms-fires dataset gating', () => {
  it('returns NOT_CONFIGURED with zero records and no fetch', async () => {
    const calls = { n: 0 };
    vi.stubGlobal('fetch', async () => {
      calls.n += 1;
      return { ok: true, status: 200, json: async () => [] } as Response;
    });
    const r = await fetchDataset('firms-fires', {}, { backoffBaseMs: 1 });
    expect(r.records).toHaveLength(0);
    expect(r.provenance.status).toBe('NOT_CONFIGURED');
    expect(calls.n).toBe(0);
  });
});
