/**
 * DRISHTI-X data engine — source adapters (Step 22).
 * Adapter: raw source payload -> validated DataRecord[].
 * Malformed records are SKIPPED (counted), never crash the caller,
 * never repaired, never replaced with synthetic data.
 */
import { isValidCoordinates, isValidGeometry, toUtcIso, nowIso } from './errors';
import { getSource } from './registry';
import type { DataRecord, DataStatus } from './types';

export interface QuakeProperties {
  magnitude: number | null;
  place: string | null;
  depthKm: number | null;
  eventId: string;
  eventUrl: string | null;
  tsunami: boolean;
}

export interface WeatherProperties {
  temperatureC: number | null;
  humidityPct: number | null;
  precipitationMm: number | null;
  windKph: number | null;
  weatherCode: number | null;
  kind: 'observation' | 'forecast';
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function provenanceFor(sourceId: string, status: DataStatus) {
  const def = getSource(sourceId);
  return {
    source: def?.name ?? sourceId,
    sourceUrl: def?.baseUrl ?? '',
    attribution: def?.attribution ?? '',
  };
}

/** Normalize a USGS Earthquake GeoJSON FeatureCollection. */
export function adaptUsgsEarthquakes(payload: unknown, retrievedAt: string = nowIso()): { records: DataRecord<QuakeProperties>[]; skipped: number } {
  const { source, sourceUrl, attribution } = provenanceFor('usgs', 'NEAR_REAL_TIME');
  const records: DataRecord<QuakeProperties>[] = [];
  let skipped = 0;
  const features = (payload as { features?: unknown })?.features;
  if (!Array.isArray(features)) return { records, skipped: 0 };
  for (const f of features) {
    const o = f as {
      id?: unknown; properties?: Record<string, unknown>; geometry?: { type?: unknown; coordinates?: unknown };
    };
    const p = (o?.properties ?? {}) as Record<string, unknown>;
    const coords = (o?.geometry as { coordinates?: unknown } | undefined)?.coordinates;
    const lon = Array.isArray(coords) ? coords[0] : undefined;
    const lat = Array.isArray(coords) ? coords[1] : undefined;
    const depth = Array.isArray(coords) ? num(coords[2]) : null;
    const eventId = typeof o?.id === 'string' ? o.id : typeof p.code === 'string' ? p.code : null;
    const ts = toUtcIso(p.time);
    if (!eventId || !isValidCoordinates(lat, lon)) {
      skipped += 1;
      continue;
    }
    const geometry = isValidGeometry(o?.geometry) ? (o.geometry as { type: string; coordinates: unknown }) : null;
    records.push({
      id: `usgs-${eventId}`,
      source, sourceUrl,
      dataType: 'earthquake',
      timestamp: ts,
      retrievedAt,
      status: 'NEAR_REAL_TIME',
      freshness: 'UNKNOWN',
      coverage: typeof p.place === 'string' ? p.place : null,
      coordinates: { lat: lat as number, lon: lon as number },
      geometry,
      properties: {
        magnitude: num(p.mag),
        place: typeof p.place === 'string' ? p.place : null,
        depthKm: depth,
        eventId,
        eventUrl: typeof p.url === 'string' ? p.url : null,
        tsunami: p.tsunami === 1 || p.tsunami === true,
      },
      attribution,
      limitations: 'USGS feed latency ~minutes; magnitudes revise; not a prediction.',
      rawSourceReference: typeof p.url === 'string' ? p.url : eventId,
    });
  }
  return { records, skipped };
}

/** Normalize an Open-Meteo current-weather response. */
export function adaptOpenMeteoCurrent(
  payload: unknown,
  lat: number,
  lon: number,
  retrievedAt: string = nowIso(),
): { records: DataRecord<WeatherProperties>[]; skipped: number } {
  const { source, sourceUrl, attribution } = provenanceFor('open-meteo', 'LIVE');
  if (!isValidCoordinates(lat, lon)) return { records: [], skipped: 1 };
  const current = (payload as { current?: Record<string, unknown> } | null)?.current;
  if (typeof current !== 'object' || current === null) return { records: [], skipped: 1 };
  const ts = toUtcIso(current.time);
  const windMs = num(current.wind_speed_10m);
  return {
    records: [
      {
        id: `openmeteo-${lat.toFixed(2)}-${lon.toFixed(2)}-${ts ?? retrievedAt}`,
        source, sourceUrl,
        dataType: 'weather-observation',
        timestamp: ts,
        retrievedAt,
        status: 'LIVE',
        freshness: 'UNKNOWN',
        coverage: `${lat.toFixed(2)},${lon.toFixed(2)}`,
        coordinates: { lat, lon },
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: {
          temperatureC: num(current.temperature_2m),
          humidityPct: num(current.relative_humidity_2m),
          precipitationMm: num(current.precipitation),
          windKph: windMs == null ? null : Math.round(windMs * 3.6 * 10) / 10,
          weatherCode: num(current.weather_code),
          kind: 'observation',
        },
        attribution,
        limitations: 'Point model output, not a ground station; forecast fields are separate.',
        rawSourceReference: `open-meteo current ${lat},${lon}`,
      },
    ],
    skipped: 0,
  };
}
