/**
 * DRISHTI-X data engine — unified contracts (Step 22).
 *
 * Every external source normalizes into DataRecord + Provenance.
 * Statuses describe the DATA, never merely the HTTP request.
 * All timestamps are UTC ISO strings internally; localize only at display.
 */

export type DataStatus =
  | 'LIVE'
  | 'NEAR_REAL_TIME'
  | 'LATEST_AVAILABLE'
  | 'FORECAST'
  | 'HISTORICAL'
  | 'DEMO'
  | 'OFFLINE'
  | 'NOT_CONFIGURED'
  | 'ERROR';

export type Freshness = 'FRESH' | 'AGING' | 'STALE' | 'UNKNOWN';

export type ErrorKind =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'HTTP_ERROR'
  | 'RATE_LIMITED'
  | 'INVALID_RESPONSE'
  | 'PARSE_ERROR'
  | 'AUTH_REQUIRED'
  | 'NOT_CONFIGURED'
  | 'SOURCE_UNAVAILABLE'
  | 'STALE_DATA'
  | 'UNKNOWN_ERROR';

export interface DataError {
  kind: ErrorKind;
  message: string;
  /** HTTP status when known; null for network-level failures. */
  httpStatus: number | null;
  /** Safe diagnostics only — never tokens, keys, or personal data. */
  detail?: string;
}

export interface Provenance {
  source: string;
  sourceUrl: string;
  /** ISO UTC timestamp asserted by the source (null when the source gives none). */
  sourceTimestamp: string | null;
  /** ISO UTC timestamp of our retrieval. */
  retrievedAt: string;
  dataType: string;
  status: DataStatus;
  attribution: string;
  limitations: string;
}

export interface DataRecord<T = unknown> {
  id: string;
  source: string;
  sourceUrl: string;
  dataType: string;
  /** ISO UTC source timestamp, null when the source provides none. */
  timestamp: string | null;
  retrievedAt: string;
  status: DataStatus;
  freshness: Freshness;
  coverage: string | null;
  coordinates: { lat: number; lon: number } | null;
  /** Minimal GeoJSON geometry when the source supplies one. */
  geometry: { type: string; coordinates: unknown } | null;
  properties: T;
  attribution: string;
  limitations: string;
  /** Opaque reference back to the raw payload (ids/URLs, never secrets). */
  rawSourceReference: string | null;
}

export type AccessType = 'keyless' | 'free-account' | 'server-key' | 'unavailable';

export interface SourceDefinition {
  id: string;
  name: string;
  category: 'satellite' | 'fire' | 'events' | 'earthquake' | 'weather' | 'maps' | 'geocoding' | 'terrain' | 'backend';
  baseUrl: string;
  docsUrl: string;
  dataTypes: string[];
  access: AccessType;
  /** Server env var name when configuration is needed; null when keyless. */
  envVar: string | null;
  rateLimitNotes: string;
  attribution: string;
  /** Freshness thresholds in ms: [freshWithin, agingWithin]; older = STALE. */
  freshnessThresholdsMs: [number, number];
  adapter: string;
  enabled: boolean;
}

export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  createdAt: string;
  expiresAt: string;
  source: string;
  status: DataStatus;
}

export interface RequestDiagnostics {
  source: string;
  endpoint: string;
  durationMs: number;
  status: 'HIT' | 'SUCCESS' | 'ERROR';
  cacheHit: boolean;
  recordCount: number | null;
  errorKind: ErrorKind | null;
}

export interface SourceHealth {
  source: string;
  status: 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE' | 'NOT_CONFIGURED' | 'UNKNOWN';
  lastSuccess: string | null;
  lastFailure: string | null;
  latencyMs: number | null;
  cacheState: 'HIT' | 'MISS' | 'STALE' | 'EMPTY';
}
