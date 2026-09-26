/**
 * DRISHTI-X data engine — freshness + registry + health (Step 22).
 * Thresholds are per-source and documented in the registry.
 * No universal "live window" is assumed.
 */
import type { Freshness, SourceDefinition, SourceHealth } from './types';

export function computeFreshness(sourceTimestamp: string | null, retrievedAt: string, freshWithinMs: number, agingWithinMs: number): Freshness {
  if (!sourceTimestamp) return 'UNKNOWN';
  const t = Date.parse(sourceTimestamp);
  const r = Date.parse(retrievedAt);
  if (Number.isNaN(t) || Number.isNaN(r)) return 'UNKNOWN';
  const age = Math.max(0, r - t);
  if (age <= freshWithinMs) return 'FRESH';
  if (age <= agingWithinMs) return 'AGING';
  return 'STALE';
}

export const SOURCE_REGISTRY: SourceDefinition[] = [
  {
    id: 'nasa-gibs', name: 'NASA GIBS', category: 'satellite',
    baseUrl: 'https://gibs.earthdata.nasa.gov/',
    docsUrl: 'https://nasa-gibs.github.io/gibs-api-reference/',
    dataTypes: ['satellite-imagery'],
    access: 'keyless', envVar: null,
    rateLimitNotes: 'WMTS tiles; cache aggressively, never tile-scrape.',
    attribution: 'Imagery: NASA Worldview / GIBS',
    freshnessThresholdsMs: [36 * 3600 * 1000, 72 * 3600 * 1000],
    adapter: 'none (tile URLs + runtime per-tile liveness)',
    enabled: true,
  },
  {
    id: 'nasa-firms', name: 'NASA FIRMS', category: 'fire',
    baseUrl: 'https://firms.modaps.eosdis.nasa.gov/',
    docsUrl: 'https://firms.modaps.eosdis.nasa.gov/api/',
    dataTypes: ['active-fire'],
    access: 'server-key', envVar: 'FIRMS_MAP_KEY',
    rateLimitNotes: 'Free MAP_KEY signup; respect published quotas; no key in client code.',
    attribution: 'Fire data: NASA FIRMS',
    freshnessThresholdsMs: [3 * 3600 * 1000, 12 * 3600 * 1000],
    adapter: 'FireDetectionAdapter (Step 24)',
    enabled: false,
  },
  {
    id: 'nasa-eonet', name: 'NASA EONET', category: 'events',
    baseUrl: 'https://eonet.gsfc.nasa.gov/',
    docsUrl: 'https://eonet.gsfc.nasa.gov/docs/v3',
    dataTypes: ['natural-events'],
    access: 'keyless', envVar: null,
    rateLimitNotes: 'Public event API; cache responses, avoid polling loops.',
    attribution: 'Events: NASA EONET',
    freshnessThresholdsMs: [6 * 3600 * 1000, 24 * 3600 * 1000],
    adapter: 'EventAdapter',
    enabled: true,
  },
  {
    id: 'usgs', name: 'USGS Earthquake Hazards', category: 'earthquake',
    baseUrl: 'https://earthquake.usgs.gov/',
    docsUrl: 'https://earthquake.usgs.gov/fdsnws/event/1/',
    dataTypes: ['earthquake'],
    access: 'keyless', envVar: null,
    rateLimitNotes: 'Public GeoJSON feeds; 5-minute cache is plenty.',
    attribution: 'Earthquakes: USGS',
    freshnessThresholdsMs: [15 * 60 * 1000, 60 * 60 * 1000],
    adapter: 'EarthquakeAdapter',
    enabled: true,
  },
  {
    id: 'open-meteo', name: 'Open-Meteo', category: 'weather',
    baseUrl: 'https://api.open-meteo.com/',
    docsUrl: 'https://open-meteo.com/en/docs',
    dataTypes: ['weather-observation', 'weather-forecast'],
    access: 'keyless', envVar: null,
    rateLimitNotes: 'Free non-commercial, no key; CC-BY 4.0 attribution; cache-first.',
    attribution: 'Weather: Open-Meteo (CC-BY 4.0)',
    freshnessThresholdsMs: [60 * 60 * 1000, 3 * 3600 * 1000],
    adapter: 'WeatherAdapter',
    enabled: true,
  },
  {
    id: 'copernicus', name: 'Copernicus Data Space', category: 'satellite',
    baseUrl: 'https://dataspace.copernicus.eu/',
    docsUrl: 'https://dataspace.copernicus.eu/documentation',
    dataTypes: ['sentinel-imagery'],
    access: 'free-account', envVar: 'COPERNICUS_USER',
    rateLimitNotes: 'Free account; credentials server-side only; browser uses published tiles only.',
    attribution: 'Sentinel data: Copernicus / ESA',
    freshnessThresholdsMs: [7 * 24 * 3600 * 1000, 30 * 24 * 3600 * 1000],
    adapter: 'SatelliteAdapter (Step 28)',
    enabled: false,
  },
  {
    id: 'osm', name: 'OpenStreetMap ecosystem', category: 'maps',
    baseUrl: 'https://www.openstreetmap.org/',
    docsUrl: 'https://wiki.openstreetmap.org/wiki/Tile_usage_policy',
    dataTypes: ['base-tiles', 'geocoding', 'pois', 'routing'],
    access: 'keyless', envVar: null,
    rateLimitNotes: 'Strict tile + Nominatim policies: 1 req/s Nominatim, cache, attribution, no bulk scraping.',
    attribution: '© OpenStreetMap contributors',
    freshnessThresholdsMs: [24 * 3600 * 1000, 7 * 24 * 3600 * 1000],
    adapter: 'none (existing geocode/overpass/osrm utilities)',
    enabled: true,
  },
];

export function getSource(id: string): SourceDefinition | null {
  return SOURCE_REGISTRY.find((s) => s.id === id) ?? null;
}

const healthStore = new Map<string, SourceHealth>();

export function getHealth(source: string): SourceHealth {
  return (
    healthStore.get(source) ?? {
      source, status: 'UNKNOWN', lastSuccess: null, lastFailure: null, latencyMs: null, cacheState: 'EMPTY',
    }
  );
}

export function recordHealth(source: string, patch: Partial<SourceHealth>): SourceHealth {
  const next: SourceHealth = { ...getHealth(source), ...patch, source };
  healthStore.set(source, next);
  return next;
}

export function resetHealth(): void {
  healthStore.clear();
}
