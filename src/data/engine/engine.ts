/**
 * DRISHTI-X data engine — orchestrator (Step 22).
 *
 * fetchDataset(): registry -> NOT_CONFIGURED guard -> cache-first ->
 * request (dedupe/retry/timeout) -> adapter -> validate -> cache store ->
 * provenance + freshness + health. Offline returns OFFLINE + stale cache
 * (labeled, never as LIVE).
 */
import { cacheFresh, cacheGet, cacheSet, makeEntry } from './cache';
import { request, type RequestOptions } from './client';
import { dataError } from './errors';
import { computeFreshness, getSource, recordHealth } from './registry';
import { adaptFirmsFires, adaptOpenMeteoCurrent, adaptOpenMeteoForecast, adaptUsgsEarthquakes } from './adapters';
import type { DataRecord, DataStatus, Freshness, Provenance } from './types';
import { nowIso } from './errors';

export interface DatasetResult<T = unknown> {
  records: DataRecord<T>[];
  skipped: number;
  provenance: Provenance;
  freshness: Freshness;
  cache: 'HIT' | 'MISS' | 'STALE';
  error?: ReturnType<typeof dataError>;
}

export interface FetchDatasetOptions extends RequestOptions {
  /** Override cache TTL (default: source-appropriate). */
  ttlMs?: number;
  /** Bypass fresh cache (still writes). */
  forceRefresh?: boolean;
}

export type DatasetKind = 'usgs-earthquakes-7d' | 'openmeteo-current' | 'firms-fires';

const KIND_SOURCE: Record<DatasetKind, string> = {
  'usgs-earthquakes-7d': 'usgs',
  'openmeteo-current': 'open-meteo',
  'firms-fires': 'nasa-firms',
};

const KIND_TTL_MS: Record<DatasetKind, number> = {
  'usgs-earthquakes-7d': 5 * 60 * 1000,
  'openmeteo-current': 10 * 60 * 1000,
  'firms-fires': 60 * 60 * 1000,
};

export function datasetCacheKey(kind: DatasetKind, params: Record<string, string | number>): string {
  const qs = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return `data-engine:${kind}:${qs}`;
}

function offlineNow(): boolean {
  try {
    return typeof navigator !== 'undefined' && navigator.onLine === false;
  } catch {
    return false;
  }
}

export async function fetchDataset<T = unknown>(
  kind: DatasetKind,
  params: Record<string, string | number> = {},
  opts: FetchDatasetOptions = {},
): Promise<DatasetResult<T>> {
  const sourceId = KIND_SOURCE[kind];
  const def = getSource(sourceId);
  const key = datasetCacheKey(kind, params);
  const ttlMs = opts.ttlMs ?? KIND_TTL_MS[kind];
  const retrievedAt = nowIso();

  const staleEntry = cacheGet<DatasetResult<T>>(key);

  if (!def || !def.enabled) {
    return emptyResult(sourceId, 'NOT_CONFIGURED', 'Source not configured or disabled.', retrievedAt, 'MISS', staleEntry);
  }

  // Offline takes precedence over fresh cache: cached data must be
  // labeled STALE, never served as a HIT.
  if (offlineNow()) {
    if (staleEntry) {
      recordHealth(sourceId, { status: 'DEGRADED', cacheState: 'STALE' });
      return { ...staleEntry.data, cache: 'STALE', freshness: 'STALE' };
    }
    recordHealth(sourceId, { status: 'UNAVAILABLE', cacheState: 'EMPTY', lastFailure: retrievedAt });
    return emptyResult(sourceId, 'OFFLINE', 'Network unavailable and no cached data.', retrievedAt, 'MISS', null);
  }

  if (!opts.forceRefresh) {
    const hit = cacheFresh<DatasetResult<T>>(key);
    if (hit) {
      recordHealth(sourceId, { status: 'AVAILABLE', cacheState: 'HIT' });
      return { ...hit.data, cache: 'HIT' };
    }
  }

  const { url, lat, lon } = buildUrl(kind, params);
  const started = Date.now();
  const res = await request<unknown>(def.name, kind, url, opts);
  const latencyMs = Date.now() - started;

  if (!res.ok) {
    recordHealth(sourceId, { status: 'UNAVAILABLE', lastFailure: retrievedAt, latencyMs, cacheState: staleEntry ? 'STALE' : 'EMPTY' });
    if (staleEntry) {
      return { ...staleEntry.data, cache: 'STALE', freshness: 'STALE', error: res.error };
    }
    return emptyResult(sourceId, res.error.kind === 'RATE_LIMITED' ? 'OFFLINE' : 'ERROR', res.error.message, retrievedAt, 'MISS', null, res.error);
  }

  const adapted = adapt(kind, res.data, params, retrievedAt);
  const [freshWithin, agingWithin] = def.freshnessThresholdsMs;
  const newest = newestTimestamp(adapted.records);
  const freshness = computeFreshness(newest, retrievedAt, freshWithin, agingWithin);
  const withFresh = adapted.records.map((r) => ({ ...r, freshness }));
  const provenance = buildProvenance(kind, def, retrievedAt, newest);
  const result: DatasetResult<T> = {
    records: withFresh as DataRecord<T>[],
    skipped: adapted.skipped,
    provenance,
    freshness,
    cache: 'MISS',
  };
  cacheSet(makeEntry(key, result, ttlMs, sourceId, provenance.status));
  recordHealth(sourceId, { status: 'AVAILABLE', lastSuccess: retrievedAt, latencyMs, cacheState: 'MISS' });
  return result;
}

function buildUrl(kind: DatasetKind, params: Record<string, string | number>): { url: string; lat: number; lon: number } {
  const lat = Number(params.lat ?? 21.5);
  const lon = Number(params.lon ?? 79.0);
  if (kind === 'usgs-earthquakes-7d') {
    return {
      url: 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=2.5&starttime=-7days',
      lat, lon,
    };
  }
  if (kind === 'firms-fires') {
    // Reached only if the registry enables FIRMS (server key configured).
    // Never appends credentials — a server proxy holds the MAP_KEY.
    return {
      url: 'https://firms.modaps.eosdis.nasa.gov/api/area/csv/VERSION/VIIRS_SNPP_NRT/world/1',
      lat, lon,
    };
  }
  return {
    url: `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,apparent_temperature,precipitation,precipitation_probability,weathercode,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weathercode,windspeed_10m_max&forecast_days=7&timezone=auto`,
    lat, lon,
  };
}

function adapt(kind: DatasetKind, payload: unknown, params: Record<string, string | number>, retrievedAt: string) {
  if (kind === 'usgs-earthquakes-7d') return adaptUsgsEarthquakes(payload, retrievedAt);
  if (kind === 'firms-fires') return adaptFirmsFires(payload, retrievedAt);
  const lat = Number(params.lat ?? 21.5);
  const lon = Number(params.lon ?? 79.0);
  const cur = adaptOpenMeteoCurrent(payload, lat, lon, retrievedAt);
  const fc = adaptOpenMeteoForecast(payload, lat, lon, retrievedAt);
  return { records: [...cur.records, ...fc.records], skipped: cur.skipped + fc.skipped };
}

function newestTimestamp(records: DataRecord<unknown>[]): string | null {
  let best: string | null = null;
  for (const r of records) {
    if (r.timestamp && (!best || r.timestamp > best)) best = r.timestamp;
  }
  return best;
}

function buildProvenance(kind: DatasetKind, def: NonNullable<ReturnType<typeof getSource>>, retrievedAt: string, newest: string | null): Provenance {
  const status: DataStatus = kind === 'openmeteo-current' ? 'LIVE' : 'NEAR_REAL_TIME';
  return {
    source: def.name,
    sourceUrl: def.baseUrl,
    retrievedAt,
    sourceTimestamp: newest,
    dataType: def.dataTypes[0] ?? kind,
    status,
    attribution: def.attribution,
    limitations:
      kind === 'usgs-earthquakes-7d'
        ? 'USGS feed latency ~minutes; magnitudes revise; not a prediction.'
        : 'Point model output, not a ground station; CC-BY 4.0 attribution required.',
  };
}

function emptyResult(
  sourceId: string,
  status: DataStatus,
  limitation: string,
  retrievedAt: string,
  cache: 'MISS' | 'STALE',
  stale: { data: DatasetResult<unknown> } | null,
  error?: ReturnType<typeof dataError>,
): DatasetResult<never> {
  const def = getSource(sourceId);
  if (stale && cache === 'STALE') {
    return { ...(stale.data as DatasetResult<never>), cache: 'STALE', freshness: 'STALE', error };
  }
  return {
    records: [],
    skipped: 0,
    provenance: {
      source: def?.name ?? sourceId,
      sourceUrl: def?.baseUrl ?? '',
      retrievedAt,
      sourceTimestamp: null,
      dataType: def?.dataTypes[0] ?? 'unknown',
      status,
      attribution: def?.attribution ?? '',
      limitations: limitation,
    },
    freshness: 'UNKNOWN',
    cache: 'MISS',
    ...(error ? { error } : {}),
  };
}
