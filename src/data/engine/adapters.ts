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
  feelsLikeC: number | null;
  humidityPct: number | null;
  precipitationMm: number | null;
  windKph: number | null;
  windDirDeg: number | null;
  windGustKph: number | null;
  pressureHpa: number | null;
  cloudPct: number | null;
  weatherCode: number | null;
  kind: 'observation' | 'forecast';
}

export interface HourlyProperties {
  hourIso: string;
  temperatureC: number | null;
  feelsLikeC: number | null;
  precipitationMm: number | null;
  precipitationProbPct: number | null;
  windKph: number | null;
  weatherCode: number | null;
  kind: 'forecast';
}

export interface DailyProperties {
  date: string;
  tempMinC: number | null;
  tempMaxC: number | null;
  precipitationMm: number | null;
  precipitationProbPct: number | null;
  windMaxKph: number | null;
  weatherCode: number | null;
  kind: 'forecast';
}

export interface FireProperties {
  confidence: string | null;
  satellite: string | null;
  instrument: string | null;
  brightnessK: number | null;
  frpMw: number | null;
  daynight: string | null;
  version: string | null;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/**
 * Open-Meteo returns wall-clock ISO without offset (location timezone).
 * Interpret naive stamps with utc_offset_seconds; aware stamps parse directly.
 */
export function omTimeToIso(value: unknown, offsetSec: number | null): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const t = value.trim();
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(t)) {
    const ms = Date.parse(t);
    return Number.isNaN(ms) ? null : new Date(ms).toISOString();
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(t);
  if (!m) return toUtcIso(t);
  const off = offsetSec != null && Number.isFinite(offsetSec) ? offsetSec : 0;
  const ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0)) - off * 1000;
  return new Date(ms).toISOString();
}

function omOffset(payload: unknown): number | null {
  const v = (payload as { utc_offset_seconds?: unknown } | null)?.utc_offset_seconds;
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

/** Normalize NASA FIRMS active-fire records (VIIRS/MODIS CSV or JSON). */
export function adaptFirmsFires(
  payload: unknown,
  retrievedAt: string = nowIso(),
): { records: DataRecord<FireProperties>[]; skipped: number } {
  const { source, sourceUrl, attribution } = provenanceFor('nasa-firms', 'NEAR_REAL_TIME');
  const records: DataRecord<FireProperties>[] = [];
  let skipped = 0;
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { fires?: unknown })?.fires)
      ? (payload as { fires: unknown[] }).fires
      : null;
  if (!rows) return { records, skipped: 0 };
  for (const r of rows) {
    const o = (r ?? {}) as Record<string, unknown>;
    const lat = num(o.latitude ?? o.lat);
    const lon = num(o.longitude ?? o.lon ?? o.lng);
    const date = typeof o.acq_date === 'string' ? o.acq_date : typeof o.date === 'string' ? o.date : null;
    const time = typeof o.acq_time === 'string' ? o.acq_time.padStart(4, '0') : null;
    const ts = date && time
      ? toUtcIso(`${date}T${time.slice(0, 2)}:${time.slice(2, 4)}:00Z`)
      : toUtcIso(o.timestamp ?? o.time ?? null);
    const id = typeof o.id === 'string' ? o.id : `${lat ?? 'x'},${lon ?? 'x'},${ts ?? 'x'}`;
    if (!isValidCoordinates(lat, lon)) {
      skipped += 1;
      continue;
    }
    records.push({
      id: `firms-${id}`,
      source, sourceUrl,
      dataType: 'active-fire',
      timestamp: ts,
      retrievedAt,
      status: 'NEAR_REAL_TIME',
      freshness: 'UNKNOWN',
      coverage: null,
      coordinates: { lat: lat as number, lon: lon as number },
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: {
        confidence: typeof o.confidence === 'string' ? o.confidence : o.confidence != null ? String(o.confidence) : null,
        satellite: typeof o.satellite === 'string' ? o.satellite : null,
        instrument: typeof o.instrument === 'string' ? o.instrument : null,
        brightnessK: num(o.bright_t31 ?? o.brightness),
        frpMw: num(o.frp),
        daynight: typeof o.daynight === 'string' ? o.daynight : null,
        version: typeof o.version === 'string' ? o.version : null,
      },
      attribution,
      limitations: 'Detection latency ~1–3h; confidence varies; not a burned-area map.',
      rawSourceReference: id,
    });
  }
  return { records, skipped };
}

/** Normalize Open-Meteo hourly + daily forecast blocks (optional; absent = skipped silently). */
export function adaptOpenMeteoForecast(
  payload: unknown,
  lat: number,
  lon: number,
  retrievedAt: string = nowIso(),
): { records: DataRecord<HourlyProperties | DailyProperties>[]; skipped: number } {
  const base = provenanceFor('open-meteo', 'FORECAST');
  const records: DataRecord<HourlyProperties | DailyProperties>[] = [];
  let skipped = 0;
  if (!isValidCoordinates(lat, lon)) return { records, skipped: 1 };
  const root = (payload ?? {}) as { hourly?: Record<string, unknown>; daily?: Record<string, unknown> };

  const hourly = root.hourly;
  if (hourly && typeof hourly === 'object') {
    const times = Array.isArray(hourly.time) ? (hourly.time as unknown[]) : [];
    const n = times.length;
    const col = (k: string): unknown[] => (Array.isArray(hourly[k]) ? (hourly[k] as unknown[]) : []);
    const temps = col('temperature_2m');
    const feels = col('apparent_temperature');
    const precs = col('precipitation');
    const probs = col('precipitation_probability');
    const winds = col('windspeed_10m');
    const codes = col('weathercode');
    for (let i = 0; i < n; i += 1) {
      const ts = omTimeToIso(times[i], omOffset(payload));
      if (!ts) {
        skipped += 1;
        continue;
      }
      const wms = num(winds[i]);
      records.push({
        id: `openmeteo-h-${lat.toFixed(2)}-${lon.toFixed(2)}-${ts}`,
        source: base.source, sourceUrl: base.sourceUrl,
        dataType: 'weather-hourly',
        timestamp: ts,
        retrievedAt,
        status: 'FORECAST',
        freshness: 'UNKNOWN',
        coverage: `${lat.toFixed(2)},${lon.toFixed(2)}`,
        coordinates: { lat, lon },
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: {
          hourIso: ts,
          temperatureC: num(temps[i]),
          feelsLikeC: num(feels[i]),
          precipitationMm: num(precs[i]),
          precipitationProbPct: num(probs[i]),
          windKph: wms == null ? null : Math.round(wms * 3.6 * 10) / 10,
          weatherCode: num(codes[i]),
          kind: 'forecast',
        },
        attribution: base.attribution,
        limitations: 'Model forecast, may differ from actual conditions.',
        rawSourceReference: `open-meteo hourly ${lat},${lon}`,
      });
    }
  }

  const daily = root.daily;
  if (daily && typeof daily === 'object') {
    const times = Array.isArray(daily.time) ? (daily.time as unknown[]) : [];
    const col = (k: string): unknown[] => (Array.isArray(daily[k]) ? (daily[k] as unknown[]) : []);
    const tmax = col('temperature_2m_max');
    const tmin = col('temperature_2m_min');
    const precs = col('precipitation_sum');
    const probs = col('precipitation_probability_max');
    const winds = col('windspeed_10m_max');
    const codes = col('weathercode');
    for (let i = 0; i < times.length; i += 1) {
      const day = typeof times[i] === 'string' ? (times[i] as string) : null;
      if (!day) {
        skipped += 1;
        continue;
      }
      const wms = num(winds[i]);
      records.push({
        id: `openmeteo-d-${lat.toFixed(2)}-${lon.toFixed(2)}-${day}`,
        source: base.source, sourceUrl: base.sourceUrl,
        dataType: 'weather-daily',
        timestamp: toUtcIso(`${day}T00:00:00Z`),
        retrievedAt,
        status: 'FORECAST',
        freshness: 'UNKNOWN',
        coverage: `${lat.toFixed(2)},${lon.toFixed(2)}`,
        coordinates: { lat, lon },
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: {
          date: day,
          tempMinC: num(tmin[i]),
          tempMaxC: num(tmax[i]),
          precipitationMm: num(precs[i]),
          precipitationProbPct: num(probs[i]),
          windMaxKph: wms == null ? null : Math.round(wms * 3.6 * 10) / 10,
          weatherCode: num(codes[i]),
          kind: 'forecast',
        },
        attribution: base.attribution,
        limitations: 'Model forecast, may differ from actual conditions.',
        rawSourceReference: `open-meteo daily ${lat},${lon}`,
      });
    }
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
  const ts = omTimeToIso(current.time, omOffset(payload));
  const windMs = num(current.wind_speed_10m);
  const gustMs = num(current.windgusts_10m ?? current.wind_gusts_10m);
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
          feelsLikeC: num(current.apparent_temperature),
          humidityPct: num(current.relative_humidity_2m),
          precipitationMm: num(current.precipitation),
          windKph: windMs == null ? null : Math.round(windMs * 3.6 * 10) / 10,
          windDirDeg: num(current.winddirection_10m ?? current.wind_direction_10m),
          windGustKph: gustMs == null ? null : Math.round(gustMs * 3.6 * 10) / 10,
          pressureHpa: num(current.pressure_msl ?? current.surface_pressure),
          cloudPct: num(current.cloudcover ?? current.cloud_cover),
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
