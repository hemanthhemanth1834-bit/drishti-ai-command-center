'use client';
/**
 * Image source registry: every visual asset used by DRISHTI-X declares
 * verifiable provenance. No Google Image Search, no scraped imagery, no
 * "public image" hand-waving.
 *
 * Rules enforced here and in tests:
 * - `source` must be an identifiable provider (never "Google"/"Internet").
 * - `license` must be a verified license string (never "unknown").
 * - `sourceUrl` must be the exact record/file page that was verified.
 * - `isReal` distinguishes genuine observations from illustrative renders.
 * - A contextual photograph is NEVER presented as a live measurement.
 */
export type ImageCategory =
  | 'weather' | 'soil' | 'terrain' | 'history' | 'satellite'
  | 'wildfire' | 'flood' | 'landslide' | 'drought' | 'cyclone' | 'response';

export interface ImageAsset {
  id: string;
  title: string;
  /** Identifiable provider, e.g. "NASA Terra/MODIS via Wikimedia Commons". */
  source: string;
  /** Exact verified record/file page — never invented. */
  sourceUrl: string;
  /** Verified license, e.g. "Public domain (NASA)". */
  license: string;
  licenseUrl: string;
  /** Local public path (preferred) — remote hotlink only when documented. */
  localPath: string;
  category: ImageCategory;
  location?: string;
  date?: string;
  dateAccessed: string;
  description: string;
  usageNotes: string;
  /** True only for genuine observations (photos, satellite captures). */
  isReal: boolean;
  /** True for project-created illustrative renders/diagrams. */
  isIllustrative: boolean;
}

const PD_NASA_LICENSE_URL = 'https://www.nasa.gov/nasa-brand-center/images-and-media/';
const PD_FEDERAL_LICENSE_URL = 'https://www.usa.gov/government-works';

export const IMAGE_ASSETS: ImageAsset[] = [
  {
    id: 'rain-nilam-modis',
    title: 'Cyclonic Storm Nilam — Bay of Bengal weather system',
    source: 'NASA Terra/MODIS via Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Cyclonic_Storm_Nilam_Oct_31_2012.jpg',
    license: 'Public domain (NASA)',
    licenseUrl: PD_NASA_LICENSE_URL,
    localPath: '/img/photos/hero-nilam.jpg',
    category: 'weather',
    location: 'Bay of Bengal, near the Indian coast',
    date: '2012-10-31',
    dateAccessed: '2026-09-24',
    description: 'Cyclonic Storm Nilam captured by NASA Terra/MODIS — real monsoon weather-system structure.',
    usageNotes: 'CONTEXT IMAGE for the RAIN feature card. Shows cloud structure only — never a rainfall measurement. Live precipitation values come from Open-Meteo and are labeled separately.',
    isReal: true,
    isIllustrative: false,
  },
  {
    id: 'soil-kerala-landsat',
    title: 'Kerala land surface before the Aug 2018 floods (Landsat 8 OLI)',
    source: 'NASA Earth Observatory record 92669 (USGS Landsat 8 OLI)',
    sourceUrl: 'https://science.nasa.gov/earth/earth-observatory/before-and-after-the-kerala-floods-92669/',
    license: 'Public domain (NASA/USGS; Sentinel data via ESA)',
    licenseUrl: PD_NASA_LICENSE_URL,
    localPath: '/img/photos/kerala-before.jpg',
    category: 'soil',
    location: 'Kerala, India',
    date: '2018-02-06',
    dateAccessed: '2026-09-24',
    description: 'False-color Landsat 8 OLI land-surface observation (bands 6-5-3): vegetation bright green.',
    usageNotes: 'ARCHIVAL LAND-SURFACE CONTEXT for the SOIL feature card. Not a current soil-moisture measurement for any selected location.',
    isReal: true,
    isIllustrative: false,
  },
  {
    id: 'terrain-himalaya-iss',
    title: 'India and the Himalayas from the ISS (ISS064-E-037041)',
    source: 'NASA Johnson Space Center via Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:ISS-64_India,_the_Himalayas_and_China.jpg',
    license: 'Public domain (NASA)',
    licenseUrl: PD_NASA_LICENSE_URL,
    localPath: '/img/photos/mission-himalaya.jpg',
    category: 'terrain',
    location: 'India / Himalayas, from 264 miles above',
    date: '2021-02-23',
    dateAccessed: '2026-09-24',
    description: 'Oblique orbital photograph across India and the Himalayas — real mountain-slope terrain context.',
    usageNotes: 'CONTEXT IMAGE for the SLOPE/TERRAIN feature card. Communicates elevation context only — never invented elevation values.',
    isReal: true,
    isIllustrative: false,
  },
  {
    id: 'history-kerala-before',
    title: 'Kerala before the Aug 2018 floods (Landsat 8 OLI, 6 Feb 2018)',
    source: 'NASA Earth Observatory record 92669 (assets.science.nasa.gov rendition)',
    sourceUrl: 'https://science.nasa.gov/earth/earth-observatory/before-and-after-the-kerala-floods-92669/',
    license: 'Public domain (NASA/USGS; Sentinel data via ESA)',
    licenseUrl: PD_NASA_LICENSE_URL,
    localPath: '/img/photos/kerala-before.jpg',
    category: 'history',
    location: 'Kerala, India',
    date: '2018-02-06',
    dateAccessed: '2026-09-24',
    description: 'BEFORE half of the verified NASA EO before/after pair: pre-flood landscape.',
    usageNotes: 'ARCHIVED EVENT CONTEXT. Documented Aug 2018 Kerala floods — never presented as a report for the currently selected location.',
    isReal: true,
    isIllustrative: false,
  },
  {
    id: 'history-kerala-after',
    title: 'Kerala after inundation (Sentinel-2 MSI, 22 Aug 2018)',
    source: 'NASA Earth Observatory record 92669 (assets.science.nasa.gov rendition)',
    sourceUrl: 'https://science.nasa.gov/earth/earth-observatory/before-and-after-the-kerala-floods-92669/',
    license: 'Public domain (NASA/USGS; Sentinel data via ESA)',
    licenseUrl: PD_NASA_LICENSE_URL,
    localPath: '/img/photos/kerala-after.jpg',
    category: 'history',
    location: 'Kerala, India',
    date: '2018-08-22',
    dateAccessed: '2026-09-24',
    description: 'AFTER half of the verified NASA EO before/after pair: false-color inundation, flood water dark blue.',
    usageNotes: 'ARCHIVED EVENT CONTEXT with real dates. No causality claims from image differences alone.',
    isReal: true,
    isIllustrative: false,
  },
  {
    id: 'response-eoc-fema',
    title: 'Emergency operations center coordinating hurricane response',
    source: 'FEMA via Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:FEMA_-_38184_-_Emergency_Operations_Center_in_Texas.jpg',
    license: 'Public domain (FEMA / U.S. federal)',
    licenseUrl: PD_FEDERAL_LICENSE_URL,
    localPath: '/img/photos/command-eoc.jpg',
    category: 'response',
    location: 'Texas, USA',
    dateAccessed: '2026-09-24',
    description: 'FEMA emergency operations center — real response-coordination context.',
    usageNotes: 'CONTEXT IMAGE for response/GIS action cards. Operational context only — not a live DRISHTI-X facility.',
    isReal: true,
    isIllustrative: false,
  },
];

const BANNED_SOURCES = ['google', 'internet', 'public image', 'unknown', 'stock', 'random'];

export interface AssetValidation {
  ok: boolean;
  errors: string[];
}

/** Reject assets with unverifiable provenance. Missing license = do not use. */
export function validateAsset(a: Partial<ImageAsset>): AssetValidation {
  const errors: string[] = [];
  if (!a.id) errors.push('missing id');
  if (!a.title) errors.push('missing title');
  if (!a.source || BANNED_SOURCES.some((b) => a.source!.toLowerCase().includes(b))) {
    errors.push('source must be an identifiable provider');
  }
  if (!a.sourceUrl || !/^https:\/\//.test(a.sourceUrl)) errors.push('sourceUrl must be a verified https record page');
  if (!a.license || /unknown|n\/a|tbd/i.test(a.license)) errors.push('license must be verified');
  if (!a.licenseUrl || !/^https:\/\//.test(a.licenseUrl)) errors.push('licenseUrl must be a verifiable https page');
  if (!a.localPath) errors.push('missing localPath');
  if (!a.category) errors.push('missing category');
  if (!a.dateAccessed) errors.push('missing dateAccessed');
  if (!a.description) errors.push('missing description');
  if (!a.usageNotes) errors.push('missing usageNotes');
  if (a.isReal === true && a.isIllustrative === true) errors.push('asset cannot be both real and illustrative');
  return { ok: errors.length === 0, errors };
}

export function getAsset(id: string): ImageAsset | null {
  return IMAGE_ASSETS.find((a) => a.id === id) ?? null;
}

export function assetsByCategory(category: ImageCategory): ImageAsset[] {
  return IMAGE_ASSETS.filter((a) => a.category === category);
}

/** OSM slippy-map tile for a coordinate — a REAL map preview (© OpenStreetMap). */
export function latLonToTile(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

export function osmTileUrl(lat: number, lon: number, zoom = 5): string {
  const { x, y } = latLonToTile(lat, lon, zoom);
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

export const OSM_ATTRIBUTION = '© OpenStreetMap contributors';
export const OSM_LICENSE_URL = 'https://www.openstreetmap.org/copyright';
