'use client';
/**
 * MapProvider abstraction (Step 8): OSM/Leaflet default, MapLibre supported,
 * Google strictly optional (NOT_CONFIGURED without key). No billing-gated core.
 */
export type MapKind = 'leaflet' | 'maplibre' | 'google';

export interface BaseMapDef {
  id: string; name: string; url: string; attribution: string; maxZoom: number;
}

export const MAP_BASES: Record<Exclude<MapKind, 'google'>, BaseMapDef[]> = {
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

export function googleStatus(): { status: 'NOT_CONFIGURED' | 'READY'; detail: string } {
  const key = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '') : '';
  return key
    ? { status: 'READY', detail: 'Key present (frontend key; restrict it in Google Cloud console).' }
    : { status: 'NOT_CONFIGURED', detail: 'Set NEXT_PUBLIC_GOOGLE_MAPS_KEY to enable. Core maps work without it.' };
}

export function baseById(id: string): BaseMapDef {
  return MAP_BASES.leaflet.find((b) => b.id === id)
    ?? MAP_BASES.maplibre.find((b) => b.id === id)
    ?? MAP_BASES.leaflet[0];
}
