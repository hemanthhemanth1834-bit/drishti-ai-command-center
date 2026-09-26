/**
 * Weather tests (Step 26) — 22 deterministic cases, mocked Open-Meteo only.
 * No live API dependency. Fixtures never reach production code paths.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { adaptOpenMeteoCurrent, adaptOpenMeteoForecast } from '../adapters';
import { fetchDataset } from '../engine';
import { cacheClear } from '../cache';
import { getSource, resetHealth } from '../registry';
import {
  fmt,
  fmtDay,
  fmtHour,
  isCurrentRecord,
  isDailyRecord,
  isHourlyRecord,
  weatherCodeText,
  windCompass,
} from '../../../components/weather/weatherUtils';

const OM = {
  utc_offset_seconds: 19800,
  current: {
    time: '2026-09-24T06:00', temperature_2m: 28.4, apparent_temperature: 30.1,
    relative_humidity_2m: 71, precipitation: 0.0, weather_code: 1,
    cloud_cover: 20, pressure_msl: 1008, wind_speed_10m: 4.5,
    wind_direction_10m: 90, wind_gusts_10m: 7.2,
  },
  hourly: {
    time: ['2026-09-24T06:00', '2026-09-24T07:00'],
    temperature_2m: [28.4, 29.1], apparent_temperature: [30.1, 31.0],
    precipitation: [0.0, 0.2], precipitation_probability: [5, 15],
    weathercode: [1, 2], windspeed_10m: [16.2, 18.0],
  },
  daily: {
    time: ['2026-09-24', '2026-09-25'],
    temperature_2m_max: [32.0, 33.5], temperature_2m_min: [24.0, 24.5],
    precipitation_sum: [0.5, 2.1], precipitation_probability_max: [20, 40],
    weathercode: [2, 61], windspeed_10m_max: [25.0, 30.0],
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

describe('current values', () => {
  it('1. current temperature', () => {
    const { records } = adaptOpenMeteoCurrent(OM, 17.38, 78.48);
    expect(records[0].properties.temperatureC).toBe(28.4);
  });
  it('2. feels-like temperature', () => {
    const { records } = adaptOpenMeteoCurrent(OM, 17.38, 78.48);
    expect(records[0].properties.feelsLikeC).toBe(30.1);
  });
  it('3. humidity', () => {
    const { records } = adaptOpenMeteoCurrent(OM, 17.38, 78.48);
    expect(records[0].properties.humidityPct).toBe(71);
  });
  it('4. precipitation', () => {
    const { records } = adaptOpenMeteoCurrent(OM, 17.38, 78.48);
    expect(records[0].properties.precipitationMm).toBe(0.0);
  });
  it('5. wind speed + compass', () => {
    const { records } = adaptOpenMeteoCurrent(OM, 17.38, 78.48);
    expect(records[0].properties.windKph).toBeCloseTo(16.2, 1);
    expect(records[0].properties.windDirDeg).toBe(90);
    expect(windCompass(0)).toContain('N');
    expect(windCompass(90)).toContain('E');
    expect(windCompass(180)).toContain('S');
    expect(windCompass(270)).toContain('W');
    expect(windCompass(null)).toBe('NOT AVAILABLE');
  });
  it('6. pressure', () => {
    const { records } = adaptOpenMeteoCurrent(OM, 17.38, 78.48);
    expect(records[0].properties.pressureHpa).toBe(1008);
  });
});

describe('codes + forecasts', () => {
  it('7. WMO code mapping is documented, unknown safe', () => {
    expect(weatherCodeText(0)).toBe('Clear sky');
    expect(weatherCodeText(3)).toBe('Overcast');
    expect(weatherCodeText(61)).toBe('Slight rain');
    expect(weatherCodeText(95)).toBe('Thunderstorm');
    expect(weatherCodeText(96)).toContain('hail');
    expect(weatherCodeText(999)).toBe('Code 999');
    expect(weatherCodeText(null)).toBe('NOT AVAILABLE');
  });
  it('8. hourly forecast parsed', () => {
    const { records, skipped } = adaptOpenMeteoForecast(OM, 17.38, 78.48);
    const hours = records.filter((r) => r.dataType === 'weather-hourly');
    expect(hours).toHaveLength(2);
    expect(skipped).toBe(0);
    expect(hours[0].timestamp).toBe('2026-09-24T00:30:00.000Z');
    expect(hours[0].status).toBe('FORECAST');
  });
  it('9. daily forecast parsed', () => {
    const { records } = adaptOpenMeteoForecast(OM, 17.38, 78.48);
    const days = records.filter((r) => r.dataType === 'weather-daily');
    expect(days).toHaveLength(2);
    expect(days[0].properties).toMatchObject({ tempMinC: 24.0, tempMaxC: 32.0 });
  });
  it('10. missing optional fields stay null, no crash', () => {
    const { records } = adaptOpenMeteoCurrent({ current: { time: '2026-09-24T06:00' } }, 17.38, 78.48);
    expect(records).toHaveLength(1);
    expect(records[0].properties.temperatureC).toBeNull();
    expect(records[0].properties.windKph).toBeNull();
  });
  it('11. timestamps handled honestly', () => {
    expect(fmtHour('2026-09-24T06:00:00.000Z')).toBe('06:00 UTC');
    expect(fmtHour('garbage')).toBe('—');
    expect(fmtDay('2026-09-24')).toContain('Sep');
    const { records } = adaptOpenMeteoCurrent({ current: {} }, 17.38, 78.48);
    expect(records[0].timestamp).toBeNull();
  });
});

describe('engine integration', () => {
  it('12. provenance carries CC-BY attribution', async () => {
    const calls = { n: 0 };
    mockFetch(OM, calls);
    const r = await fetchDataset('openmeteo-current', { lat: 17.38, lon: 78.48 }, { backoffBaseMs: 1 });
    expect(r.records.length).toBeGreaterThan(0);
    expect(r.provenance.source).toBe('Open-Meteo');
    expect(r.provenance.attribution).toContain('CC-BY');
  });
  it('13. registry holds Open-Meteo freshness config', () => {
    const def = getSource('open-meteo');
    expect(def?.enabled).toBe(true);
    expect(def?.freshnessThresholdsMs).toHaveLength(2);
    expect(def?.access).toBe('keyless');
  });
  it('14. cache hit on repeat', async () => {
    const calls = { n: 0 };
    mockFetch(OM, calls);
    const a = await fetchDataset('openmeteo-current', { lat: 1, lon: 1 }, { backoffBaseMs: 1 });
    const b = await fetchDataset('openmeteo-current', { lat: 1, lon: 1 }, { backoffBaseMs: 1 });
    expect(a.cache).toBe('MISS');
    expect(b.cache).toBe('HIT');
    expect(calls.n).toBe(1);
  });
  it('15. offline serves labeled stale cache', async () => {
    const calls = { n: 0 };
    mockFetch(OM, calls);
    await fetchDataset('openmeteo-current', { lat: 2, lon: 2 }, { backoffBaseMs: 1 });
    vi.stubGlobal('navigator', { onLine: false });
    const r = await fetchDataset('openmeteo-current', { lat: 2, lon: 2 }, { backoffBaseMs: 1 });
    expect(r.cache).toBe('STALE');
    expect(r.freshness).toBe('STALE');
  });
  it('16. offline without cache is honest', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    const calls = { n: 0 };
    mockFetch(OM, calls);
    const r = await fetchDataset('openmeteo-current', { lat: 3, lon: 3 }, { backoffBaseMs: 1 });
    expect(r.provenance.status).toBe('OFFLINE');
    expect(r.records).toHaveLength(0);
    expect(calls.n).toBe(0);
  });
  it('17. API error surfaces normalized', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 500, json: async () => ({}) }) as Response);
    const r = await fetchDataset('openmeteo-current', { lat: 4, lon: 4 }, { maxRetries: 0 });
    expect(r.provenance.status).toBe('ERROR');
    expect(r.error).toBeDefined();
  });
  it('18. malformed response yields zero records, no crash', async () => {
    const calls = { n: 0 };
    mockFetch({ nonsense: true }, calls);
    const r = await fetchDataset('openmeteo-current', { lat: 5, lon: 5 }, { backoffBaseMs: 1 });
    expect(r.records).toHaveLength(0);
    expect(r.skipped).toBeGreaterThan(0);
  });
  it('19. invalid location rejected', () => {
    const { records, skipped } = adaptOpenMeteoCurrent(OM, 999, 78.48);
    expect(records).toHaveLength(0);
    expect(skipped).toBe(1);
  });
  it('20. current vs forecast never merged', () => {
    const { records } = adaptOpenMeteoForecast(OM, 17.38, 78.48);
    const cur = adaptOpenMeteoCurrent(OM, 17.38, 78.48).records[0];
    expect(isCurrentRecord(cur)).toBe(true);
    expect(isHourlyRecord(cur)).toBe(false);
    const h = records.find((r) => r.dataType === 'weather-hourly');
    const d = records.find((r) => r.dataType === 'weather-daily');
    expect(h && isHourlyRecord(h)).toBe(true);
    expect(h && isCurrentRecord(h)).toBe(false);
    expect(d && isDailyRecord(d)).toBe(true);
  });
  it('21. formatting carries units or NOT AVAILABLE', () => {
    expect(fmt(28.4, '°C')).toBe('28.4 °C');
    expect(fmt(null, '°C')).toBe('NOT AVAILABLE');
    expect(fmt(NaN, '%', 0)).toBe('NOT AVAILABLE');
  });
  it('22. request URL carries hourly+daily params', async () => {
    let seen = '';
    vi.stubGlobal('fetch', async (url: string) => {
      seen = url;
      return { ok: true, status: 200, json: async () => OM } as Response;
    });
    await fetchDataset('openmeteo-current', { lat: 6, lon: 6 }, { backoffBaseMs: 1 });
    expect(seen).toContain('hourly=');
    expect(seen).toContain('daily=');
    expect(seen).toContain('forecast_days=7');
  });
});
