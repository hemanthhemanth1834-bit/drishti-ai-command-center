/**
 * DRISHTI-X data engine — normalized errors + validation (Step 22).
 * Safe diagnostics only. Never tokens, keys, headers, or personal data.
 */
import type { DataError, ErrorKind } from './types';

export function dataError(kind: ErrorKind, message: string, httpStatus: number | null = null, detail?: string): DataError {
  return { kind, message, httpStatus, detail };
}

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

/** Retry only transient failures; never 4xx (except 408/425/429), never parse/auth errors. */
export function isRetryable(kind: ErrorKind, httpStatus: number | null): boolean {
  if (kind === 'TIMEOUT' || kind === 'NETWORK_ERROR') return true;
  if ((kind === 'HTTP_ERROR' || kind === 'SOURCE_UNAVAILABLE') && httpStatus != null) {
    return RETRYABLE_STATUS.has(httpStatus);
  }
  return false;
}

export function isValidLongitude(lon: unknown): lon is number {
  return typeof lon === 'number' && Number.isFinite(lon) && lon >= -180 && lon <= 180;
}

export function isValidLatitude(lat: unknown): lat is number {
  return typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

export function isValidCoordinates(lat: unknown, lon: unknown): boolean {
  return isValidLatitude(lat) && isValidLongitude(lon);
}

/**
 * Normalize a timestamp to UTC ISO. Returns null when unparseable —
 * callers must preserve null (unknown), never substitute "now".
 */
export function toUtcIso(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Epoch seconds (< 1e12) or milliseconds.
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof value === 'string') {
    const t = value.trim();
    if (!t) return null;
    const ms = Date.parse(t);
    return Number.isNaN(ms) ? null : new Date(ms).toISOString();
  }
  return null;
}

const GEOJSON_TYPES = new Set(['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection', 'Feature', 'FeatureCollection']);

/** Minimal GeoJSON shape check. Rejects malformed geometry; never repairs it. */
export function isValidGeometry(g: unknown): g is { type: string; coordinates: unknown } {
  if (typeof g !== 'object' || g === null) return false;
  const t = (g as { type?: unknown }).type;
  return typeof t === 'string' && GEOJSON_TYPES.has(t);
}

export function nowIso(): string {
  return new Date().toISOString();
}
