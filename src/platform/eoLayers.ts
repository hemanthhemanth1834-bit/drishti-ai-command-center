'use client';
/**
 * Earth-observation layer catalog. A layer is enabled ONLY after its tiles
 * returned HTTP 200 in probing (2026-09-16). Everything else is an explicit
 * NOT_CONFIGURED entry with reason + fallback — never a fake live layer.
 * Runtime tile events confirm/deny LIVE per session (see RiskGridMap).
 */

export type EOStatus = 'LIVE' | 'NOT_CONFIGURED' | 'DEMO' | 'UNAVAILABLE';

export interface BaseLayer {
  id: string; name: string; url: string; attribution: string; maxZoom: number;
}

export interface EOLayer {
  id: string; group: 'Earth observation' | 'Disaster' | 'Environment' | 'Infrastructure' | 'Intelligence';
  name: string; kind: 'gibs' | 'registry' | 'stub';
  url?: string; attribution: string; opacity: number;
  status: EOStatus; note: string; fallback?: string;
}

const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';
const G = '/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg';

export const BASE_LAYERS: BaseLayer[] = [
  { id: 'dark', name: 'Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attribution: '© OpenStreetMap contributors © CARTO', maxZoom: 19 },
  { id: 'satellite', name: 'Satellite (Esri)', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Esri, Maxar, Earthstar Geographics', maxZoom: 18 },
  { id: 'terrain', name: 'Terrain (OpenTopoMap)', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap contributors, SRTM | style: © OpenTopoMap (CC-BY-SA)', maxZoom: 17 },
  { id: 'street', name: 'Street (OSM)', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap contributors', maxZoom: 19 },
  { id: 'light', name: 'Light', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '© OpenStreetMap contributors © CARTO', maxZoom: 19 },
];

export const EO_LAYERS: EOLayer[] = [
  // ---- verified live (HTTP 200 tile probes) ----
  { id: 'viirs-true', group: 'Earth observation', name: 'Satellite True Color (VIIRS, NRT)', kind: 'gibs',
    url: `${GIBS}/VIIRS_SNPP_CorrectedReflectance_TrueColor/default${G}`,
    attribution: 'NASA Worldview/GIBS (daily NRT composite)', opacity: 1,
    status: 'LIVE', note: 'Latest daily composite via "default" time; ~1-day latency.' },
  { id: 'modis-true', group: 'Earth observation', name: 'Satellite True Color (MODIS Terra)', kind: 'gibs',
    url: `${GIBS}/MODIS_Terra_CorrectedReflectance_TrueColor/default${G}`,
    attribution: 'NASA Worldview/GIBS', opacity: 1,
    status: 'LIVE', note: 'Alternate daily sensor; compare against VIIRS.' },
  { id: 'modis-721', group: 'Environment', name: 'Water/Vegetation (MODIS 7-2-1)', kind: 'gibs',
    url: `${GIBS}/MODIS_Terra_CorrectedReflectance_Bands721/default${G}`,
    attribution: 'NASA Worldview/GIBS', opacity: 0.85,
    status: 'LIVE', note: 'SWIR composite: water dark, burn scars red. Compare slider blends it over True Color.' },
  // ---- registry overlays (own backend) ----
  { id: 'ai-risk', group: 'Intelligence', name: 'AI Risk Heatmap', kind: 'registry',
    attribution: 'DRISHTI-X grid API', opacity: 1,
    status: 'DEMO', note: 'Backend risk cells (SYNTHETIC-DEMO model unless retrained).' },
  { id: 'incidents', group: 'Intelligence', name: 'Field Incidents', kind: 'registry',
    attribution: 'DRISHTI-X incident API', opacity: 1,
    status: 'DEMO', note: 'UNVERIFIED until human review; verification state shown.' },
  { id: 'sensors', group: 'Intelligence', name: 'Sensors', kind: 'registry',
    attribution: 'DRISHTI-X sensor API', opacity: 1,
    status: 'DEMO', note: 'Seeded demo nodes + live ingest.' },
  { id: 'roads', group: 'Infrastructure', name: 'Roads (OSM registry)', kind: 'registry',
    attribution: 'DRISHTI-X road registry', opacity: 1,
    status: 'DEMO', note: 'Statuses: OPEN/PARTIALLY_BLOCKED/BLOCKED/HIGH RISK/UNKNOWN.' },
  { id: 'shelters', group: 'Infrastructure', name: 'Hospitals/Shelters', kind: 'registry',
    attribution: 'DRISHTI-X places registry', opacity: 1,
    status: 'DEMO', note: 'Capacity/occupancy operator-updated or demo.' },
  // ---- honest stubs (never fake) ----
  { id: 's1-sar', group: 'Earth observation', name: 'Sentinel-1 SAR', kind: 'stub',
    attribution: 'Copernicus Data Space', opacity: 1,
    status: 'NOT_CONFIGURED', note: 'Needs free Copernicus account (COPERNICUS_USER).', fallback: 'VIIRS True Color' },
  { id: 's2-optical', group: 'Earth observation', name: 'Sentinel-2 Optical', kind: 'stub',
    attribution: 'Copernicus Data Space', opacity: 1,
    status: 'NOT_CONFIGURED', note: 'Needs free Copernicus account.', fallback: 'MODIS True Color' },
  { id: 'flood', group: 'Disaster', name: 'Flood Extent (NRT)', kind: 'stub',
    attribution: 'NASA/Copernicus', opacity: 1,
    status: 'NOT_CONFIGURED', note: 'No verified keyless flood-tile endpoint found; flood context via 7-2-1 water view + warnings API.', fallback: 'MODIS 7-2-1 + /warnings' },
  { id: 'fire', group: 'Disaster', name: 'Thermal Anomalies / Fire', kind: 'stub',
    attribution: 'NASA FIRMS', opacity: 1,
    status: 'NOT_CONFIGURED', note: 'FIRMS needs free MAP_KEY; GIBS thermal endpoints 400 in probing.', fallback: 'None — do not invent hotspots' },
  { id: 'rain', group: 'Environment', name: 'Rainfall (GPM IMERG raster)', kind: 'stub',
    attribution: 'NASA GPM', opacity: 1,
    status: 'NOT_CONFIGURED', note: 'Bulk IMERG needs Earthdata login; point rainfall is live via Open-Meteo.', fallback: '/weather (Open-Meteo LIVE)' },
  { id: 'cyclone', group: 'Disaster', name: 'Cyclone Track', kind: 'stub',
    attribution: 'IMD/official', opacity: 1,
    status: 'NOT_CONFIGURED', note: 'No keyless official track feed; never fabricate positions.', fallback: 'IMD public bulletins (manual)' },
  { id: 'isro', group: 'Earth observation', name: 'ISRO/Bhuvan Layers', kind: 'stub',
    attribution: 'ISRO NRSC', opacity: 1,
    status: 'NOT_CONFIGURED', note: 'Access varies by dataset; no credentials configured.', fallback: 'Esri Satellite base' },
];

/** Historical reference views — locations only, imagery stays live NRT. Never current events. */
export interface Preset { id: string; name: string; lat: number; lon: number; zoom: number; note: string }
export const HISTORICAL_PRESETS: Preset[] = [
  { id: 'kerala-2018', name: 'Kerala Floods 2018 (HISTORICAL)', lat: 10.5, lon: 76.3, zoom: 7, note: 'Reference region only — current NRT imagery shown.' },
  { id: 'wayanad-2024', name: 'Wayanad Landslide 2024 (HISTORICAL)', lat: 11.68, lon: 76.13, zoom: 10, note: 'Reference region only — current NRT imagery shown.' },
  { id: 'up-floods', name: 'Uttar Pradesh Floods (HISTORICAL)', lat: 27.5, lon: 81.5, zoom: 7, note: 'Reference region only — current NRT imagery shown.' },
  { id: 'odisha', name: 'Odisha Coast (HISTORICAL)', lat: 20.3, lon: 85.8, zoom: 7, note: 'Reference region only — current NRT imagery shown.' },
  { id: 'ner', name: 'Northeast India (live focus)', lat: 25.5, lon: 92.5, zoom: 6, note: 'DRISHTI-X NER risk grid focus.' },
  { id: 'ap-tg', name: 'AP + Telangana (live focus)', lat: 17.5, lon: 79.8, zoom: 6, note: 'Primary showcase states.' },
];
