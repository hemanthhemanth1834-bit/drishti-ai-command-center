/**
 * NE-SAFE AI demo data engine — gradual, realistic-feeling simulation.
 * Values drift (random walk) instead of jumping, e.g.
 * Rain 18→24→31→46→72, Soil 48→55→63→75→87, Move 2→4→7→12→19, Risk 24→38→52→73→91.
 */
import type { RiskLevel } from '../providers/types';

export interface SlopeSimState {
  slopeId: string;
  rainfallMmHr: number;
  soilPct: number;
  groundMoveMm: number;
  satelliteDeformMm: number;
  risk: number;
  level: RiskLevel;
  history: number[]; // risk history for timeline
}

export interface DemoTick {
  t: number;
  slopes: Record<string, SlopeSimState>;
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

export function levelForRisk(r: number): RiskLevel {
  if (r >= 80) return 'critical';
  if (r >= 60) return 'high';
  if (r >= 40) return 'moderate';
  return 'low';
}

/** Small drift step toward a target with noise — never jumps. */
function drift(cur: number, target: number, maxStep: number): number {
  const d = target - cur;
  const step = clamp(d * 0.18, -maxStep, maxStep);
  const noise = (Math.random() - 0.5) * maxStep * 0.4;
  return cur + step + noise;
}

export interface DemoControls {
  rain: number; // 0-100 slider
  soil: number;
  movement: number;
  deformation: number;
}

export function initSlope(slopeId: string, baseRisk: number): SlopeSimState {
  const risk = clamp(baseRisk, 5, 60);
  return {
    slopeId,
    rainfallMmHr: 8 + risk * 0.25,
    soilPct: 30 + risk * 0.45,
    groundMoveMm: 1 + risk * 0.08,
    satelliteDeformMm: 1 + risk * 0.06,
    risk,
    level: levelForRisk(risk),
    history: [risk],
  };
}

/** Advance one tick (~2s). Slider targets push the system gradually. */
export function tickSlope(s: SlopeSimState, c: DemoControls): SlopeSimState {
  // Targets derived from sliders (free-first demo control panel)
  const rainTarget = 4 + c.rain * 1.1; // 4..114
  const soilTarget = clamp(28 + c.soil * 0.72 + c.rain * 0.08, 5, 98);
  const moveTarget = clamp(0.5 + c.movement * 0.28 + c.soil * 0.02, 0, 32);
  const defTarget = clamp(0.5 + c.deformation * 0.22 + c.movement * 0.03, 0, 28);

  const rainfallMmHr = Math.max(0, drift(s.rainfallMmHr, rainTarget, 7));
  const soilPct = clamp(drift(s.soilPct, soilTarget, 5), 2, 99);
  const groundMoveMm = Math.max(0, drift(s.groundMoveMm, moveTarget, 2.2));
  const satelliteDeformMm = Math.max(0, drift(s.satelliteDeformMm, defTarget, 1.6));

  // Risk follows drivers gradually (matches spec example curve)
  const riskTarget = clamp(
    6 + rainfallMmHr * 0.55 + soilPct * 0.38 + groundMoveMm * 1.1 + satelliteDeformMm * 0.7,
    0, 99,
  );
  const risk = clamp(drift(s.risk, riskTarget, 6), 0, 99);
  const history = [...s.history.slice(-47), Math.round(risk * 10) / 10];
  return {
    ...s,
    rainfallMmHr: Math.round(rainfallMmHr * 10) / 10,
    soilPct: Math.round(soilPct * 10) / 10,
    groundMoveMm: Math.round(groundMoveMm * 10) / 10,
    satelliteDeformMm: Math.round(satelliteDeformMm * 10) / 10,
    risk: Math.round(risk * 10) / 10,
    level: levelForRisk(risk),
    history,
  };
}

/** Built-in disaster scenario phases (00:00 → 02:15 drill). */
export const DISASTER_SCRIPT: { atSec: number; label: string; controls: DemoControls }[] = [
  { atSec: 0, label: 'Normal rainfall', controls: { rain: 15, soil: 25, movement: 10, deformation: 10 } },
  { atSec: 15, label: 'Heavy rainfall begins', controls: { rain: 55, soil: 40, movement: 18, deformation: 15 } },
  { atSec: 30, label: 'Soil moisture increases', controls: { rain: 65, soil: 70, movement: 28, deformation: 22 } },
  { atSec: 45, label: 'Ground movement detected', controls: { rain: 70, soil: 78, movement: 60, deformation: 35 } },
  { atSec: 60, label: 'Satellite deformation detected', controls: { rain: 72, soil: 82, movement: 68, deformation: 70 } },
  { atSec: 75, label: 'Citizen report received', controls: { rain: 75, soil: 85, movement: 75, deformation: 72 } },
  { atSec: 90, label: 'Risk becomes CRITICAL', controls: { rain: 88, soil: 92, movement: 88, deformation: 85 } },
  { atSec: 105, label: 'Authority alert', controls: { rain: 90, soil: 93, movement: 90, deformation: 88 } },
  { atSec: 120, label: 'Road restriction', controls: { rain: 90, soil: 94, movement: 92, deformation: 90 } },
  { atSec: 135, label: 'Emergency team dispatched', controls: { rain: 92, soil: 95, movement: 94, deformation: 92 } },
];
