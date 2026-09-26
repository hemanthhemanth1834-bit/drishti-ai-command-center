'use client';
/**
 * MapProvider abstraction: OSM/Leaflet default (MapLibre supported).
 * Google Maps Embed is strictly optional: it renders only when
 * NEXT_PUBLIC_GOOGLE_MAPS_KEY is configured (key + billing-enabled
 * Cloud project required by Google); otherwise OSM is the experience
 * and Google reports NOT_CONFIGURED. No scraping, no undocumented
 * endpoints — official embed iframe only.
 */
export type MapKind = 'leaflet' | 'maplibre';

export interface BaseMapDef {
  id: string; name: string; url: string; attribution: string; maxZoom: number;
}

export const MAP_BASES: Record<MapKind, BaseMapDef[]> = {
  leaflet: [
    { id: 'dark', name: 'Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attribution: '© OpenStreetMap contributors © CARTO', maxZoom: 19 },
    { id: 'satellite', name: 'Satellite (Esri)', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Esri, Maxar, Earthstar Geographics', maxZoom: 18 },
    { id: 'terrain', name: 'Terrain (OpenTopoMap)', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap contributors, SRTM | style: © OpenTopoMap (CC-BY-SA)', maxZoom: 17 },
    { id: 'street', name: 'Street (OSM)', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap contributors', maxZoom: 19 },
    { id: 'light', name: 'Light', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '© OpenStreetMap contributors © CARTO', maxZoom: 19 },
  ],
  maplibre: [
    { id: 'openfreemap', name: 'OpenFreeMap (MapLibre)', url: 'https://tiles.openfreemap.org/styles/bright', attribution: '© OpenMapTiles © OpenStreetMap contributors', maxZoom: 19 },
  ],
};

export function baseById(id: string): BaseMapDef {
  return MAP_BASES.leaflet.find((b) => b.id === id)
    ?? MAP_BASES.maplibre.find((b) => b.id === id)
    ?? MAP_BASES.leaflet[0];
}

/** Official Google Maps Embed availability (env-gated, never assumed). */
export function googleEmbedStatus(): { status: 'READY' | 'NOT_CONFIGURED'; detail: string } {
  const key = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '') : '';
  return key
    ? { status: 'READY', detail: 'Key configured (restrict by HTTP referrer; billing-enabled project required by Google).' }
    : { status: 'NOT_CONFIGURED', detail: 'Set NEXT_PUBLIC_GOOGLE_MAPS_KEY to enable. OSM remains the default map.' };
}

/** Official Maps Embed URL (place mode). Returns null without a key or valid coords — callers must fall back to OSM. */
export function googleEmbedUrl(lat: number, lon: number, zoom = 15): string | null {
  const key = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '') : '';
  const validLat = Number.isFinite(lat) && lat >= -90 && lat <= 90;
  const validLon = Number.isFinite(lon) && lon >= -180 && lon <= 180;
  if (!key || !validLat || !validLon) return null;
  return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${lat},${lon}&zoom=${zoom}`;
}
