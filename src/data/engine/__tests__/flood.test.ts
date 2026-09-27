/**
 * Flood tests — Open-Meteo Flood API (GloFAS v4) adapter + dataset.
 * Deterministic, mocked fetch only. Asserts MODEL/FORECAST semantics:
 * simulated discharge is never labeled LIVE or observed flooding.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { adaptOpenMeteoFlood } from '../adapters';
import { fetchDataset } from '../engine';
import { cacheClear } from '../cache';
import { getSource, resetHealth } from '../registry';

const FLOOD = {
  latitude: 17.38,
  longitude: 78.48,
  generationtime_ms: 0.5,
  utc_offset_seconds: 19800,
  timezone: 'Asia/Kolkata',
  daily_units: { time: 'iso8601', river_discharge: 'm³/s' },
  daily: {
    time: ['2026-09-20', '2026-09-26', '2026-09-27'],
    river_discharge: [12.5, 18.2, 22.9],
  },
};

afterEach(() => {
  cacheClear();
  resetHealth();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mockFetch(payload: unknown, calls: { n: number }) {
  vi.stubGlobal('fetch', async () => {
    calls.n += 1;
    return { ok: true, status: 200, json: async () => payload } as Response;
  });
}

describe('adaptOpenMeteoFlood', () => {
  it('1. splits hindcast (MODEL) from forecast (FORECAST)', () => {
    const { records, skipped } = adaptOpenMeteoFlood(FLOOD, 17.38, 78.48, '2026-09-26T06:00:00Z');
    expect(skipped).toBe(0);
    expect(records).toHaveLength(3);
    const byDate = Object.fromEntries(records.map((r) => [r.properties.date, r]));
    expect(byDate['2026-09-20'].status).toBe('MODEL');
    expect(byDate['2026-09-20'].properties.kind).toBe('model-hindcast');
    expect(byDate['2026-09-27'].status).toBe('FORECAST');
    expect(byDate['2026-09-27'].properties.kind).toBe('model-forecast');
    expect(byDate['2026-09-26'].properties.dischargeM3s).toBe(18.2);
  });

  it('2. never labels simulated discharge LIVE or observed', () => {
    const { records } = adaptOpenMeteoFlood(FLOOD, 17.38, 78.48, '2026-09-26T06:00:00Z');
    for (const r of records) {
      expect(r.status).not.toBe('LIVE');
      expect(r.properties.model).toBe('GloFAS v4');
      expect(r.limitations).toMatch(/SIMULATED/i);
      expect(r.dataType).toBe('river-discharge');
    }
  });

  it('3. skips invalid entries without dropping valid ones', () => {
    const bad = {
      daily: { time: ['2026-09-20', null, '2026-09-22'], river_discharge: [1.0, 2.0, null] },
    };
    const { records, skipped } = adaptOpenMeteoFlood(bad, 17.38, 78.48, '2026-09-26T06:00:00Z');
    expect(records).toHaveLength(1);
    expect(skipped).toBe(2);
  });

  it('4. rejects bad coordinates and missing blocks', () => {
    expect(adaptOpenMeteoFlood(FLOOD, 999, 78.48).skipped).toBe(1);
    expect(adaptOpenMeteoFlood({}, 17.38, 78.48).records).toHaveLength(0);
    expect(adaptOpenMeteoFlood(null, 17.38, 78.48).records).toHaveLength(0);
  });
});

describe('openmeteo-flood dataset', () => {
  it('5. registry entry is keyless with flood attribution', () => {
    const def = getSource('open-meteo-flood');
    expect(def).not.toBeNull();
    expect(def!.access).toBe('keyless');
    expect(def!.envVar).toBeNull();
    expect(def!.enabled).toBe(true);
    expect(def!.attribution).toMatch(/GloFAS/);
    expect(def!.docsUrl).toBe('https://open-meteo.com/en/docs/flood-api');
  });

  it('6. fetchDataset returns MODEL provenance with cache + dedupe', async () => {
    const calls = { n: 0 };
    mockFetch(FLOOD, calls);
    const r1 = await fetchDataset('openmeteo-flood', { lat: 17.38, lon: 78.48 });
    expect(r1.records.length).toBeGreaterThan(0);
    expect(r1.provenance.status).toBe('MODEL');
    expect(r1.provenance.source).toBe('Open-Meteo Flood (GloFAS)');
    expect(r1.cache).toBe('MISS');
    const r2 = await fetchDataset('openmeteo-flood', { lat: 17.38, lon: 78.48 });
    expect(r2.cache).toBe('HIT');
    expect(calls.n).toBe(1);
  });

  it('7. failed fetch degrades honestly', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 500, json: async () => ({}) }) as Response);
    const r = await fetchDataset('openmeteo-flood', { lat: 17.38, lon: 78.48 });
    expect(r.records).toHaveLength(0);
    expect(['ERROR', 'OFFLINE']).toContain(r.provenance.status);
  });
});
