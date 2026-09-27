/**
 * GDACS tests — alert-event adapter + dataset. Deterministic, mocked fetch.
 * Alert levels are GDACS assessments, never local official warnings.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { adaptGdacsAlerts } from '../adapters';
import { fetchDataset } from '../engine';
import { cacheClear } from '../cache';
import { getSource, resetHealth } from '../registry';

const F = (props: Record<string, unknown>, geomType = 'Point', coords: unknown = [80.0, 16.0]) => ({
  type: 'Feature',
  geometry: { type: geomType, coordinates: coords },
  properties: props,
});

const EQ = {
  eventtype: 'EQ', eventid: 1476137, episodeid: 1632460,
  name: 'Earthquake in Testland', description: 'Green M 4.6 Earthquake',
  country: 'Testland', iso3: 'TST', glide: 'EQ-2026-000001-TST',
  alertlevel: 'Green', alertscore: 1, iscurrent: false,
  url: 'https://www.gdacs.org/report.aspx?eventid=1476137',
  fromdate: '2026-09-20T00:00:00', todate: '2026-09-21T00:00:00',
};

afterEach(() => {
  cacheClear();
  resetHealth();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('adaptGdacsAlerts', () => {
  it('1. normalizes alert fields with honest statuses', () => {
    const { records, skipped } = adaptGdacsAlerts({ features: [F(EQ)] }, '2026-09-26T06:00:00Z');
    expect(skipped).toBe(0);
    expect(records).toHaveLength(1);
    const r = records[0];
    expect(r.id).toBe('gdacs-EQ-1476137-1632460');
    expect(r.status).toBe('LATEST_AVAILABLE');
    expect(r.coordinates).toEqual({ lat: 16.0, lon: 80.0 });
    expect(r.properties).toMatchObject({
      alertLevel: 'Green', glide: 'EQ-2026-000001-TST', country: 'Testland',
    });
    expect(r.limitations).toMatch(/not official local warnings/);
  });

  it('2. keeps non-Point geometries as list-only records without fabricated points', () => {
    const { records } = adaptGdacsAlerts(
      { features: [F({ ...EQ, eventid: 1 }, 'Polygon', [[[80, 16]]])] }, '2026-09-26T06:00:00Z');
    expect(records).toHaveLength(1);
    expect(records[0].coordinates).toBeNull();
  });

  it('3. rejects unknown alert levels and missing ids', () => {
    const { records, skipped } = adaptGdacsAlerts({
      features: [F({ ...EQ, eventid: 2, alertlevel: 'Purple' }), F({ nodesc: 1 }), null],
    }, '2026-09-26T06:00:00Z');
    expect(records).toHaveLength(1);
    expect(records[0].properties.alertLevel).toBeNull();
    expect(skipped).toBe(2);
  });

  it('4. rejects non-collections without crashing', () => {
    expect(adaptGdacsAlerts(null)).toEqual({ records: [], skipped: 0 });
    expect(adaptGdacsAlerts({})).toEqual({ records: [], skipped: 0 });
    expect(adaptGdacsAlerts({ features: 'x' })).toEqual({ records: [], skipped: 0 });
  });
});

describe('gdacs-alerts dataset', () => {
  it('5. registry entry is keyless with GDACS attribution', () => {
    const def = getSource('gdacs');
    expect(def).not.toBeNull();
    expect(def!.access).toBe('keyless');
    expect(def!.envVar).toBeNull();
    expect(def!.enabled).toBe(true);
    expect(def!.attribution).toMatch(/GDACS/);
  });

  it('6. fetchDataset returns LATEST_AVAILABLE with cache + dedupe', async () => {
    const calls = { n: 0 };
    vi.stubGlobal('fetch', async (url: unknown) => {
      calls.n += 1;
      expect(String(url)).toContain('gdacs.org');
      return { ok: true, status: 200, json: async () => ({ features: [F(EQ)] }) } as Response;
    });
    const r1 = await fetchDataset('gdacs-alerts', {});
    expect(r1.records).toHaveLength(1);
    expect(r1.records[0].status).toBe('LATEST_AVAILABLE');
    expect(r1.provenance.source).toBe('GDACS Alerts');
    const r2 = await fetchDataset('gdacs-alerts', {});
    expect(r2.cache).toBe('HIT');
    expect(calls.n).toBe(1);
  });

  it('7. upstream errors degrade honestly', async () => {
    for (const [status, want] of [[429, 'OFFLINE'], [500, 'ERROR'], [404, 'ERROR']] as const) {
      vi.stubGlobal('fetch', async () => ({ ok: false, status, json: async () => ({}) }) as Response);
      const r = await fetchDataset('gdacs-alerts', {}, { forceRefresh: true });
      expect(r.records).toHaveLength(0);
      expect(r.provenance.status).toBe(want);
    }
  });
});
