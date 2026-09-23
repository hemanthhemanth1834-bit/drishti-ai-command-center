'use client';
/**
 * DRISHTI-X live-data services (adapted from the Open Design `liveServices.js`
 * reference into this repo's TypeScript + `src/platform/api.ts` conventions).
 *
 * Legitimate free/public sources only — all keyless:
 *  - Open-Meteo forecast API (weather, no key)
 *  - USGS earthquake GeoJSON (no key)
 *  - NASA GIBS WMTS tiles (no key; liveness is *measured* per-session by the
 *    Leaflet tile trackers in RiskGridMap/DisasterMap, never assumed)
 *  - OpenStreetMap ecosystem (tiles/Nominatim/Overpass, keyless)
 *
 * Explicit feed states — never fabricate live information:
 *  LIVE = fresh network response (<5 min old at render)
 *  RECENT = fresh response served from short cache (≤15 min)
 *  LATEST_AVAILABLE = provider publishes with latency (e.g. GIBS daily NRT)
 *  STALE = cache older than TTL, shown with age
 *  OFFLINE = network/backend unreachable
 *  DEMO = curated local fallback, always labeled
 *  NO_FEED = no real-time source exists for this panel
 *  NOT_CONFIGURED = provider needs credentials the deployment does not have
 *
 * Every result carries SOURCE + TIMESTAMP. All fetches use AbortController +
 * timeout + in-memory TTL cache so maps/panels never hammer public APIs.
 */

export type FeedState =
  | 'LIVE'
  | 'RECENT'
  | 'LATEST_AVAILABLE'
  | 'STALE'
  | 'OFFLINE'
  | 'DEMO'
  | 'NO_FEED'
  | 'NOT_CONFIGURED';

export interface FeedResult<T> {
  data: T | null;
  state: FeedState;
  /** Human-readable source, e.g. "Open-Meteo (keyless)" */
  source: string;
  /** ISO timestamp of the observation/response, null when unknown */
  updatedAt: string | null;
  note?: string;
}

const FETCH_TIMEOUT_MS = 12000;
const WEATHER_TTL_MS = 5 * 60 * 1000;
const QUAKE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  at: number;
  value: FeedResult<T>;
}

const cache = new Map<string, CacheEntry<unknown>>();

function cacheGet<T>(key: string): FeedResult<T> | null {
  const e = cache.get(key) as CacheEntry<T> | undefined;
  if (!e) return null;
  return e.value;
}

function cacheSet<T>(key: string, value: FeedResult<T>): void {
  cache.set(key, { at: Date.now(), value: value as FeedResult<unknown> });
}

function cacheAgeMs(key: string): number | null {
  const e = cache.get(key);
  if (!e) return null;
  return Date.now() - e.at;
}

export async function fetchWithTimeout(
  url: string,
  ms = FETCH_TIMEOUT_MS,
  signal?: AbortSignal,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

/* ------------------------------- weather ------------------------------- */

export interface WeatherNow {
  lat: number;
  lon: number;
  tempC: number | null;
  humidityPct: number | null;
  rain24hMm: number | null;
  windKph: number | null;
  weatherCode: number | null;
  isDay: boolean;
}

export interface WeatherFeed {
  current: WeatherNow;
  dailyMaxTempC: number[];
  dailyPrecipMm: number[];
  timezone: string;
}

const WEATHER_CODE_TEXT: Record<number, string> = {
  0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Icing fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow',
  75: 'Heavy snow', 80: 'Light showers', 81: 'Showers', 82: 'Violent showers',
  95: 'Thunderstorm', 96: 'Storm + hail', 99: 'Severe storm + hail',
};

export function weatherCodeText(code: number | null): string {
  if (code == null) return 'Unknown';
  return WEATHER_CODE_TEXT[code] ?? `Code ${code}`;
}

/** Live current + 7-day weather from Open-Meteo (keyless). */
export async function getWeather(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<FeedResult<WeatherFeed>> {
  const key = `wx:${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = cacheGet<WeatherFeed>(key);
  const age = cacheAgeMs(key);
  if (cached?.data && age != null && age < WEATHER_TTL_MS) {
    return {
      ...cached,
      state: age < 60 * 1000 ? 'LIVE' : 'RECENT',
      note: `Cached ${Math.round(age / 1000)}s ago · Open-Meteo`,
    };
  }
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}` +
    `&longitude=${encodeURIComponent(lon)}&current=temperature_2m,relative_humidity_2m,` +
    `precipitation,weather_code,is_day,wind_speed_10m&hourly=precipitation&` +
    `daily=temperature_2m_max,precipitation_sum&timezone=auto&forecast_days=7`;
  try {
    const r = await fetchWithTimeout(url, FETCH_TIMEOUT_MS, signal);
    if (!r.ok) {
      if (cached?.data) {
        return { ...cached, state: 'STALE', note: `Open-Meteo HTTP ${r.status}; showing cached` };
      }
      return { data: null, state: 'OFFLINE', source: 'Open-Meteo (keyless)', updatedAt: null, note: `HTTP ${r.status}` };
    }
    const j = await r.json();
    const hourlyPrecip: number[] = j?.hourly?.precipitation ?? [];
    const rain24 = hourlyPrecip.length > 0
      ? hourlyPrecip.slice(0, 24).reduce((a: number, b: number) => a + (b || 0), 0)
      : null;
    const feed: WeatherFeed = {
      current: {
        lat, lon,
        tempC: j?.current?.temperature_2m ?? null,
        humidityPct: j?.current?.relative_humidity_2m ?? null,
        rain24hMm: rain24 != null ? Math.round(rain24 * 10) / 10 : null,
        windKph: j?.current?.wind_speed_10m ?? null,
        weatherCode: j?.current?.weather_code ?? null,
        isDay: j?.current?.is_day === 1,
      },
      dailyMaxTempC: j?.daily?.temperature_2m_max ?? [],
      dailyPrecipMm: j?.daily?.precipitation_sum ?? [],
      timezone: j?.timezone ?? 'auto',
    };
    const out: FeedResult<WeatherFeed> = {
      data: feed,
      state: 'LIVE',
      source: 'Open-Meteo (keyless)',
      updatedAt: j?.current?.time ? new Date(j.current.time).toISOString() : new Date().toISOString(),
    };
    cacheSet(key, out);
    return out;
  } catch (e) {
    if (cached?.data) {
      return { ...cached, state: 'STALE', note: 'Open-Meteo unreachable; showing cached' };
    }
    const aborted = e instanceof Error && e.name === 'AbortError';
    return {
      data: null, state: 'OFFLINE', source: 'Open-Meteo (keyless)', updatedAt: null,
      note: aborted ? 'Request timed out (12s)' : 'Network unreachable',
    };
  }
}

/* ------------------------------ earthquakes ---------------------------- */

export interface Quake {
  id: string;
  mag: number | null;
  place: string;
  time: string;
  lat: number;
  lon: number;
  depthKm: number | null;
  url: string;
}

export interface QuakeFeed {
  quakes: Quake[];
  countWeek: number;
  indiaCount: number;
}

function inIndia(lat: number, lon: number): boolean {
  return lat >= 5 && lat <= 38 && lon >= 66 && lon <= 98;
}

/** Live global M2.5+ past-week feed from USGS (keyless), with India subset. */
export async function getEarthquakes(signal?: AbortSignal): Promise<FeedResult<QuakeFeed>> {
  const key = 'usgs:week';
  const cached = cacheGet<QuakeFeed>(key);
  const age = cacheAgeMs(key);
  if (cached?.data && age != null && age < QUAKE_TTL_MS) {
    return { ...cached, state: age < 60 * 1000 ? 'LIVE' : 'RECENT', note: `Cached ${Math.round(age / 1000)}s ago · USGS` };
  }
  try {
    const r = await fetchWithTimeout(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson',
      FETCH_TIMEOUT_MS,
      signal,
    );
    if (!r.ok) {
      if (cached?.data) return { ...cached, state: 'STALE', note: `USGS HTTP ${r.status}; showing cached` };
      return { data: null, state: 'OFFLINE', source: 'USGS Earthquake Hazards (keyless)', updatedAt: null, note: `HTTP ${r.status}` };
    }
    const j = await r.json();
    const feats: unknown[] = j?.features ?? [];
    const quakes: Quake[] = feats.slice(0, 200).map((f) => {
      const p = (f as { properties?: Record<string, unknown> }).properties ?? {};
      const g = (f as { geometry?: { coordinates?: number[] } }).geometry?.coordinates ?? [];
      const id = String((f as { id?: unknown }).id ?? Math.random());
      return {
        id,
        mag: typeof p.mag === 'number' ? p.mag : null,
        place: typeof p.place === 'string' ? p.place : 'Unknown location',
        time: typeof p.time === 'number' ? new Date(p.time).toISOString() : new Date().toISOString(),
        lon: g[0] ?? 0, lat: g[1] ?? 0, depthKm: typeof g[2] === 'number' ? g[2] : null,
        url: typeof p.url === 'string' ? p.url : 'https://earthquake.usgs.gov/',
      };
    });
    const feed: QuakeFeed = {
      quakes,
      countWeek: feats.length,
      indiaCount: quakes.filter((q) => inIndia(q.lat, q.lon)).length,
    };
    const out: FeedResult<QuakeFeed> = {
      data: feed, state: 'LIVE',
      source: 'USGS Earthquake Hazards (keyless)',
      updatedAt: new Date().toISOString(),
      note: `${feats.length} M2.5+ events worldwide (past 7 days)`,
    };
    cacheSet(key, out);
    return out;
  } catch (e) {
    if (cached?.data) return { ...cached, state: 'STALE', note: 'USGS unreachable; showing cached' };
    const aborted = e instanceof Error && e.name === 'AbortError';
    return {
      data: null, state: 'OFFLINE', source: 'USGS Earthquake Hazards (keyless)', updatedAt: null,
      note: aborted ? 'Request timed out (12s)' : 'Network unreachable',
    };
  }
}

/* ----------------------- satellite / fire (honest) ---------------------- */

/** NASA GIBS tiles are keyless but daily-NRT: always LATEST_AVAILABLE, never "live". */
export function gibsStatus(): FeedResult<{ latency: string }> {
  return {
    data: { latency: '~1 day (daily NRT composite)' },
    state: 'LATEST_AVAILABLE',
    source: 'NASA Worldview / GIBS (keyless WMTS)',
    updatedAt: null,
    note: 'Per-tile LIVE status is measured at runtime by the map tile trackers',
  };
}

/**
 * Fire/hotspot detections need a NASA FIRMS MAP_KEY (free login) which this
 * deployment does not configure. Never synthesize hotspots.
 */
export function fireStatus(): FeedResult<null> {
  return {
    data: null,
    state: 'NOT_CONFIGURED',
    source: 'NASA FIRMS (requires free MAP_KEY)',
    updatedAt: null,
    note: 'Set FIRMS_MAP_KEY to enable. Fire context falls back to MODIS 7-2-1 burn-scar view.',
  };
}

/** Drone fleet: no live fleet is connected in this deployment. */
export function droneFleetStatus(): FeedResult<null> {
  return {
    data: null,
    state: 'NO_FEED',
    source: 'DRISHTI-X drone mesh (simulated link)',
    updatedAt: null,
    note: 'NO LIVE FEED AVAILABLE — telemetry shown is SIMULATION',
  };
}
