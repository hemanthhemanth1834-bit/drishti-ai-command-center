/**
 * STEP 30 — Twin command-center layer/camera model (pure, deterministic, tested).
 * All layers/scenarios reference the fixed TwinViewport scene content.
 * Everything here is SIMULATION presentation state, never live data.
 */

export interface HazardState {
  flood: boolean;
  fire: boolean;
}

export interface TwinLayerDef {
  id: 'flood' | 'fire' | 'corridor';
  label: string;
  hint: string;
}

export const TWIN_LAYERS: TwinLayerDef[] = [
  { id: 'flood', label: 'FLOOD CELL', hint: 'Riverside wards hazard marker (simulated)' },
  { id: 'fire', label: 'FIRE-RISK CELL', hint: 'Industrial belt hazard marker (simulated)' },
  { id: 'corridor', label: 'EVACUATION CORRIDOR', hint: 'Amber response path + vehicles (simulated, not an official route)' },
];

export interface CamPreset {
  id: 'overview' | 'incident' | 'ground';
  label: string;
  dist: number;
  focus: [number, number, number];
}

export const CAM_PRESETS: CamPreset[] = [
  { id: 'overview', label: 'OVERVIEW', dist: 9, focus: [0, 0.5, 0] },
  { id: 'incident', label: 'INCIDENT', dist: 6, focus: [1.8, 0.3, 2.6] },
  { id: 'ground', label: 'GROUND', dist: 4.5, focus: [0, 0.2, 1.2] },
];

export const DEFAULT_HAZARDS: HazardState = { flood: true, fire: true };

export function getCamPreset(id: string | null | undefined): CamPreset {
  return CAM_PRESETS.find((p) => p.id === id) ?? CAM_PRESETS[0];
}

/** Names of layers currently visible (for the HUD — presentation facts only). */
export function activeLayers(hazards: HazardState, corridor: boolean): string[] {
  const out: string[] = [];
  if (hazards.flood) out.push('FLOOD');
  if (hazards.fire) out.push('FIRE');
  if (corridor) out.push('CORRIDOR');
  return out;
}

/** Hazard entity ids visible under a hazard state (scene ids are fixed). */
export function visibleHazardIds(hazards: HazardState): string[] {
  const out: string[] = [];
  if (hazards.flood) out.push('HZ-FL');
  if (hazards.fire) out.push('HZ-FR');
  return out;
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true;
  } catch {
    return true;
  }
}
