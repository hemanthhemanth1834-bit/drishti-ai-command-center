'use client';
/**
 * Real-world visual registry — built from drishti-x-real-world-image-pack
 * (30 topic folders under public/assets/drishti-x/real-world/, metadata only).
 *
 * HARD RULES (enforced by construction):
 * - No entry claims LIVE unless it resolves to a live provider integration.
 * - HISTORICAL entries link OUT to the source article; nothing is vendored.
 * - REFERENCE entries with unverifiable licenses are outbound-link-only.
 * - `localVisual` is always project-original SVG, labeled SIMULATION/REFERENCE.
 */
export type ImageStatus =
  | 'LIVE'
  | 'NEAR_REAL_TIME'
  | 'HISTORICAL'
  | 'REFERENCE'
  | 'DEMO'
  | 'SIMULATION'
  | 'EXTERNAL';

export interface DisasterImage {
  id: string;
  title: string;
  category: string;
  folder: string;
  source: string;
  sourceUrl: string;
  license?: string;
  status: ImageStatus;
  description: string;
  location?: string;
  date?: string;
  /** Optional project-original SVG shown alongside (never as evidence). */
  localVisual?: string;
  /** Live integration target inside the app, when the status is LIVE. */
  liveTarget?: string;
}

export const IMAGE_SOURCES: DisasterImage[] = [
  { id: 'satellite-eo', title: 'NASA Worldview / GIBS', category: 'satellite', folder: '01_satellite_earth_observation', source: 'NASA Worldview', sourceUrl: 'https://worldview.earthdata.nasa.gov/', status: 'NEAR_REAL_TIME', description: 'Daily/near-real-time satellite composites, integrated as live map layers.', liveTarget: '/risk-map', localVisual: '/img/sat-change.svg' },
  { id: 'cyclone-ilsa', title: 'Cyclone Ilsa', category: 'cyclone', folder: '02_cyclone', source: 'NASA Earth Observatory', sourceUrl: 'https://science.nasa.gov/earth/earth-observatory/cyclone-ilsa-37599/', license: 'NASA public domain (verify article terms)', status: 'HISTORICAL', description: 'Documented cyclone case. View at source; not a current event.', location: 'Indian Ocean', date: '2023-04', localVisual: '/img/dis-cyclone.svg' },
  { id: 'flood-india-north', title: 'Flooding in Northern India', category: 'flood', folder: '03_flood_india', source: 'NASA Earth Observatory', sourceUrl: 'https://science.nasa.gov/earth/earth-observatory/flooding-in-northern-india-45933/', license: 'NASA public domain (verify article terms)', status: 'HISTORICAL', description: 'Documented flood case. View at source; not a current event.', location: 'Northern India', localVisual: '/img/dis-flood.svg' },
  { id: 'flood-orissa', title: 'Floods in Orissa, India', category: 'flood', folder: '04_flood_orissa', source: 'NASA Earth Observatory', sourceUrl: 'https://science.nasa.gov/earth/earth-observatory/floods-in-orissa-india-35390/', license: 'NASA public domain (verify article terms)', status: 'HISTORICAL', description: 'Documented flood case. View at source; not a current event.', location: 'Odisha, India', localVisual: '/img/dis-flood.svg' },
  { id: 'landslide-debris-flow', title: 'Deadly Debris Flow in India', category: 'landslide', folder: '05_landslide_india', source: 'NASA Earth Observatory', sourceUrl: 'https://science.nasa.gov/earth/earth-observatory/a-deadly-debris-flow-in-india-147973/', license: 'NASA public domain (verify article terms)', status: 'HISTORICAL', description: 'Documented debris-flow case. View at source; not a current event.', location: 'India', localVisual: '/img/dis-landslide.svg' },
  { id: 'landslide-atlas', title: 'ISRO Landslide Atlas of India', category: 'landslide', folder: '06_landslide_atlas', source: 'ISRO', sourceUrl: 'https://www.isro.gov.in/media_isro/pdf/LandslideAtlas_new_2023.pdf', license: 'Government publication (verify reuse terms)', status: 'REFERENCE', description: 'National landslide inventory reference (2023).', location: 'India', localVisual: '/img/terrain.svg' },
  { id: 'gorkha-damage', title: 'Gorkha Nepal Earthquake Damage Proxy Map', category: 'earthquake', folder: '07_earthquake', source: 'NASA/JPL', sourceUrl: 'https://www.jpl.nasa.gov/images/pia13911-nasa-generated-damage-map-to-assist-with-2015-gorkha-nepal-earthquake-disaster-response/', license: 'NASA public domain (verify article terms)', status: 'HISTORICAL', description: '2015 damage proxy map. View at source; not a current event.', location: 'Nepal', date: '2015-04', localVisual: '/img/dis-earthquake.svg' },
  { id: 'heatwave-india', title: 'India Heatwave land-surface-temperature example', category: 'heatwave', folder: '08_heatwave', source: 'impakter.com', sourceUrl: 'https://impakter.com/indiaheatwave/', status: 'REFERENCE', description: 'News article reference. Do not redistribute its media; outbound link only.', location: 'India', localVisual: '/img/wx-storm.svg' },
  { id: 'drought-dmews', title: 'Satellite-based drought monitoring — India', category: 'drought', folder: '09_drought', source: 'U-Tokyo DMEWS', sourceUrl: 'https://wtlab.iis.u-tokyo.ac.jp/DMEWS/India/', status: 'EXTERNAL', description: 'Research drought monitor for India.', location: 'India', localVisual: '/img/dis-drought.svg' },
  { id: 'lightning-india', title: 'India Lightning Flash Rate Map', category: 'lightning', folder: '10_lightning', source: 'NASA Earth Observatory', sourceUrl: 'https://science.nasa.gov/earth/earth-observatory/weeks-of-extreme-weather-in-india-92196/', license: 'NASA public domain (verify article terms)', status: 'HISTORICAL', description: 'Documented extreme-weather case. View at source.', location: 'India', localVisual: '/img/dis-storm.svg' },
  { id: 'rainfall-gpm', title: 'GPM/IMERG heavy rainfall over South Asia', category: 'rainfall', folder: '11_rainfall', source: 'NASA GPM', sourceUrl: 'https://gpm.nasa.gov/extreme-weather/imerg-shows-heavy-rainfall-southwest-india-northeast-india', status: 'REFERENCE', description: 'Documented IMERG rainfall case; bulk data needs Earthdata login.', location: 'South Asia', localVisual: '/img/wx-rain.svg' },
  { id: 'wildfire-worldview', title: 'NASA Worldview current wildfire events', category: 'wildfire', folder: '12_wildfire', source: 'NASA Worldview', sourceUrl: 'https://worldview.earthdata.nasa.gov/', status: 'NEAR_REAL_TIME', description: 'Current fire activity via Worldview; thermal layers need FIRMS key in-app.', liveTarget: '/risk-map' },
  { id: 'sentinel', title: 'Copernicus Browser / Sentinel', category: 'satellite', folder: '13_satellite_sentinel', source: 'Copernicus Data Space', sourceUrl: 'https://dataspace.copernicus.eu/browser/', status: 'EXTERNAL', description: 'Free Sentinel-1/-2 browsing; tasking needs a free account.', liveTarget: '/satellite', localVisual: '/img/sat-before.svg' },
  { id: 'bhuvan', title: 'ISRO Bhuvan Earth Observation', category: 'satellite', folder: '14_isro_bhuvan', source: 'ISRO NRSC', sourceUrl: 'https://bhuvan.nrsc.gov.in/home/index.php', status: 'EXTERNAL', description: 'Indian EO/GIS platform; access varies by dataset.', liveTarget: '/satellite' },
  { id: 'drone-sar', title: 'Drone search-and-rescue reference', category: 'response', folder: '15_drone_sar', source: 'szwlgroup.com', sourceUrl: 'https://www.szwlgroup.com/', status: 'REFERENCE', description: 'Commercial source — unverified for redistribution. Outbound link only; no media vendored.', localVisual: '/img/drone.svg' },
  { id: 'command-ops', title: 'Disaster operations visual reference', category: 'command', folder: '16_command_center', source: 'NASA Worldview', sourceUrl: 'https://worldview.earthdata.nasa.gov/', status: 'REFERENCE', description: 'Operations-context reference; see live layers on /risk-map.', localVisual: '/img/hero-command.svg' },
  { id: 'recovery-ba', title: 'Disaster before/after examples', category: 'recovery', folder: '17_recovery_before_after', source: 'NASA Earth Observatory', sourceUrl: 'https://science.nasa.gov/earth/earth-observatory/', license: 'NASA public domain (verify article terms)', status: 'HISTORICAL', description: 'Before/after methodology reference. View cases at source.', localVisual: '/img/sat-after.svg' },
  { id: 'terrain-srtm', title: 'SRTM terrain example', category: 'terrain', folder: '18_terrain', source: 'NASA/USGS', sourceUrl: 'https://science.nasa.gov/earth/earth-observatory/a-deadly-debris-flow-in-india-147973/', status: 'REFERENCE', description: 'Terrain-context reference; app DEM is procedural until SRTM wired.', localVisual: '/img/terrain.svg' },
  { id: 'fire-firms', title: 'FIRMS / Worldview fire imagery', category: 'wildfire', folder: '19_fire_thermal', source: 'NASA FIRMS', sourceUrl: 'https://firms.modaps.eosdis.nasa.gov/', status: 'NEAR_REAL_TIME', description: 'Active-fire data; API needs free MAP_KEY — in-app status NOT_CONFIGURED until then.', liveTarget: '/risk-map', localVisual: '/img/dis-fire.svg' },
  { id: 'flood-nrt', title: 'NRT Global Flood Product', category: 'flood', folder: '20_global_flood', source: 'NASA Earthdata/Worldview', sourceUrl: 'https://www.earthdata.nasa.gov/data/tools/worldview', status: 'NEAR_REAL_TIME', description: 'View flood layers in Worldview; no verified keyless tile endpoint for in-app use.', liveTarget: '/risk-map', localVisual: '/img/dis-flood.svg' },
  { id: 'gis-worldview', title: 'Worldview GIS satellite map', category: 'gis', folder: '21_gis_map', source: 'NASA Worldview/GIBS', sourceUrl: 'https://worldview.earthdata.nasa.gov/', status: 'NEAR_REAL_TIME', description: 'Integrated as live GIBS tile layers on /risk-map.', liveTarget: '/risk-map' },
  { id: 'emergency-response', title: 'Emergency response visual reference', category: 'response', folder: '22_emergency_response', source: 'szwlgroup.com', sourceUrl: 'https://www.szwlgroup.com/', status: 'REFERENCE', description: 'Commercial source — unverified for redistribution. Outbound link only; no media vendored.', localVisual: '/img/response.svg' },
  { id: 'shelter-ref', title: 'Disaster shelter / relief visual reference', category: 'shelter', folder: '23_shelter', source: 'usa.gov', sourceUrl: 'https://www.usa.gov/disaster-help', status: 'REFERENCE', description: 'US public information page (reference only).', localVisual: '/img/shelter.svg' },
  { id: 'hospital-ref', title: 'Emergency medical response visual reference', category: 'health', folder: '24_hospital', source: 'fema.gov', sourceUrl: 'https://www.fema.gov/', status: 'REFERENCE', description: 'US public information (reference only).', localVisual: '/img/response.svg' },
  { id: 'citizen-ref', title: 'Field reporting visual reference', category: 'citizen', folder: '25_citizen_reporting', source: 'ready.gov', sourceUrl: 'https://www.ready.gov/', status: 'REFERENCE', description: 'US preparedness reference (public information).', localVisual: '/img/dis-road.svg' },
  { id: 'family-ref', title: 'Emergency family preparedness visual reference', category: 'family', folder: '26_family_safety', source: 'ready.gov', sourceUrl: 'https://www.ready.gov/plan', status: 'REFERENCE', description: 'US preparedness reference (public information).' },
  { id: 'kit-ref', title: 'Emergency kit visual reference', category: 'preparedness', folder: '27_emergency_kit', source: 'ready.gov', sourceUrl: 'https://www.ready.gov/kit', status: 'REFERENCE', description: 'US preparedness reference (public information).' },
  { id: 'evac-ref', title: 'Evacuation preparedness visual reference', category: 'evacuation', folder: '28_evacuation', source: 'ready.gov', sourceUrl: 'https://www.ready.gov/evacuation', status: 'REFERENCE', description: 'US preparedness reference (public information).', localVisual: '/img/dis-road.svg' },
  { id: 'edu-ref', title: 'Disaster preparedness visual reference', category: 'education', folder: '29_disaster_education', source: 'ready.gov', sourceUrl: 'https://www.ready.gov/', status: 'REFERENCE', description: 'US preparedness reference (public information).' },
  { id: 'safety-ref', title: 'Public safety / preparedness visual reference', category: 'safety', folder: '30_public_safety', source: 'ready.gov', sourceUrl: 'https://www.ready.gov/', status: 'REFERENCE', description: 'US preparedness reference (public information).', localVisual: '/img/hero-command.svg' },
];

export const IMAGE_STATUS_LABEL: Record<ImageStatus, string> = {
  LIVE: 'LIVE', NEAR_REAL_TIME: 'NEAR-REAL-TIME', HISTORICAL: 'HISTORICAL REFERENCE',
  REFERENCE: 'REFERENCE', DEMO: 'DEMO', SIMULATION: 'SIMULATION', EXTERNAL: 'EXTERNAL',
};

export function imagesByCategory(category: string): DisasterImage[] {
  return IMAGE_SOURCES.filter((i) => i.category === category);
}

export function imagesByStatus(...status: ImageStatus[]): DisasterImage[] {
  return IMAGE_SOURCES.filter((i) => status.includes(i.status));
}
