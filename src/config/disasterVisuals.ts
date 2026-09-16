'use client';
/**
 * Disaster → visual mapping. Every type resolves to registry entries plus a
 * guaranteed project-original fallback visual (never a dead end, never fake).
 */
import { IMAGE_SOURCES, type DisasterImage } from './imageSources';

const FALLBACK_VISUAL: Record<string, string> = {
  LANDSLIDE: '/img/dis-landslide.svg', FLASH_FLOOD: '/img/dis-flood.svg',
  RIVER_FLOOD: '/img/dis-flood.svg', URBAN_FLOOD: '/img/dis-flood.svg',
  CYCLONE: '/img/dis-cyclone.svg', STORM: '/img/dis-storm.svg',
  HEAVY_RAIN: '/img/wx-rain.svg', CLOUDBURST: '/img/wx-rain.svg',
  LIGHTNING: '/img/dis-storm.svg', EARTHQUAKE: '/img/dis-earthquake.svg',
  DROUGHT: '/img/dis-drought.svg', HEATWAVE: '/img/wx-storm.svg',
  WILDFIRE: '/img/dis-fire.svg', EROSION: '/img/terrain.svg',
  SLOPE_FAILURE: '/img/dis-landslide.svg', ROAD_BLOCKAGE: '/img/dis-road.svg',
  INFRASTRUCTURE_FAILURE: '/img/dis-road.svg', MULTI_HAZARD: '/img/hero-scene.svg',
};

const CATEGORY_OF: Record<string, string[]> = {
  LANDSLIDE: ['landslide'], FLASH_FLOOD: ['flood'], RIVER_FLOOD: ['flood'],
  URBAN_FLOOD: ['flood'], CYCLONE: ['cyclone'], STORM: ['cyclone'],
  HEAVY_RAIN: ['rainfall'], CLOUDBURST: ['rainfall'], LIGHTNING: ['lightning'],
  EARTHQUAKE: ['earthquake'], DROUGHT: ['drought'], HEATWAVE: ['heatwave'],
  WILDFIRE: ['wildfire'], EROSION: ['terrain'], SLOPE_FAILURE: ['landslide'],
  ROAD_BLOCKAGE: ['response'], INFRASTRUCTURE_FAILURE: ['response'],
  MULTI_HAZARD: ['satellite', 'gis'],
};

export interface DisasterVisual { type: string; entries: DisasterImage[]; fallbackVisual: string }

export function visualsFor(type: string): DisasterVisual {
  const cats = CATEGORY_OF[type] ?? [];
  return {
    type,
    entries: IMAGE_SOURCES.filter((i) => cats.includes(i.category)),
    fallbackVisual: FALLBACK_VISUAL[type] ?? '/img/hero-command.svg',
  };
}

export const SECTOR_VISUAL: Record<string, { image: string; registryCategory: string }> = {
  AGRICULTURE: { image: '/img/dis-drought.svg', registryCategory: 'drought' },
  TRANSPORT: { image: '/img/dis-road.svg', registryCategory: 'response' },
  HEALTH: { image: '/img/response.svg', registryCategory: 'health' },
  URBAN: { image: '/img/dis-flood.svg', registryCategory: 'flood' },
  ENVIRONMENT: { image: '/img/dis-fire.svg', registryCategory: 'wildfire' },
  INFRASTRUCTURE: { image: '/img/dis-road.svg', registryCategory: 'response' },
  PUBLIC_SAFETY: { image: '/img/response.svg', registryCategory: 'safety' },
};
