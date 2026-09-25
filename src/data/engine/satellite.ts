/**
 * DRISHTI-X data engine — satellite / Earth-observation module (Step 23).
 *
 * NASA GIBS WMTS tile URLs are built from a curated catalog of verified
 * layers. Dates are nominal acquisition dates within the recent NRT window;
 * tile existence is measured at runtime by the map tile trackers, never
 * assumed. Copernicus stays NOT_CONFIGURED (no credentials configured).
 */
import { getSource } from './registry';

export interface GibsLayer {
  id: string;
  title: string;
  platform: string;
  instrument: string;
  description: string;
  /** Daily NRT cadence for all catalog layers. */
  cadence: 'daily-nrt';
}

/** Curated catalog — only layers already verified in production use. */
export const GIBS_LAYERS: GibsLayer[] = [
  {
    id: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
    title: 'VIIRS True Color',
    platform: 'Suomi NPP',
    instrument: 'VIIRS',
    description: 'Daily true-color composite for context and situational awareness.',
    cadence: 'daily-nrt',
  },
  {
    id: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    title: 'MODIS Terra True Color',
    platform: 'Terra',
    instrument: 'MODIS',
    description: 'Daily true-color composite, alternate morning overpass.',
    cadence: 'daily-nrt',
  },
  {
    id: 'MODIS_Terra_CorrectedReflectance_Bands721',
    title: 'MODIS 7-2-1 (water/burn)',
    platform: 'Terra',
    instrument: 'MODIS',
    description: 'False-color 7-2-1: water dark, burn scars red. Flood and fire context.',
    cadence: 'daily-nrt',
  },
  {
    id: 'MODIS_Aqua_CorrectedReflectance_TrueColor',
    title: 'MODIS Aqua True Color',
    platform: 'Aqua',
    instrument: 'MODIS',
    description: 'Daily true-color composite, afternoon overpass.',
    cadence: 'daily-nrt',
  },
];

const GIBS_WMTS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';

export function getGibsLayer(id: string): GibsLayer | null {
  return GIBS_LAYERS.find((l) => l.id === id) ?? null;
}

function utcDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Latest nominal acquisition: yesterday UTC (daily NRT latency). */
export function latestNominalDate(now: Date = new Date()): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - 1);
  return utcDate(d);
}

/** Oldest selectable date: 13 days before latest (14-day NRT window). */
export function earliestNominalDate(now: Date = new Date()): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - 14);
  return utcDate(d);
}

/** YYYY-MM-DD within [earliest, latest]; never future. */
export function isSelectableDate(date: string, now: Date = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return date >= earliestNominalDate(now) && date <= latestNominalDate(now);
}

/**
 * Build a GIBS WMTS tile URL template for a layer + nominal date.
 * Returns null for unknown layers (caller must show NO DATA, not a guess).
 */
export function gibsTileUrl(layerId: string, date: string): string | null {
  if (!getGibsLayer(layerId)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return `${GIBS_WMTS}/${layerId}/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;
}

export interface SatelliteProduct {
  id: string;
  source: string;
  sourceUrl: string;
  productId: string;
  platform: string;
  instrument: string;
  layer: string;
  /** Nominal acquisition date (YYYY-MM-DD), NOT a measured timestamp. */
  acquisitionDate: string;
  coverage: string;
  status: 'LATEST_AVAILABLE' | 'NOT_CONFIGURED';
  attribution: string;
  limitations: string;
}

export function gibsProduct(layerId: string, date: string, coverage: string): SatelliteProduct | null {
  const layer = getGibsLayer(layerId);
  if (!layer) return null;
  return {
    id: `gibs-${layerId}-${date}`,
    source: 'NASA GIBS',
    sourceUrl: 'https://gibs.earthdata.nasa.gov/',
    productId: layerId,
    platform: layer.platform,
    instrument: layer.instrument,
    layer: layer.title,
    acquisitionDate: date,
    coverage,
    status: 'LATEST_AVAILABLE',
    attribution: 'Imagery: NASA Worldview / GIBS (daily NRT, ~1-day latency)',
    limitations: 'Nominal date only; per-tile availability is measured at render. Not real-time.',
  };
}

export interface CopernicusState {
  status: 'NOT_CONFIGURED';
  detail: string;
  products: [];
}

/** Copernicus Data Space: free account required, none configured. */
export function copernicusState(): CopernicusState {
  const def = getSource('copernicus');
  return {
    status: 'NOT_CONFIGURED',
    detail: `Free account required (${def?.envVar ?? 'COPERNICUS_USER'}); credentials stay server-side.`,
    products: [],
  };
}
