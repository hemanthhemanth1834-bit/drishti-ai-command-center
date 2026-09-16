/**
 * NE-SAFE AI risk engine — modular, explainable, DEMO/SIMULATION.
 * This is a transparent weighted model for prototype demo, NOT a certified predictor.
 * Never claims exact failure time; outputs "risk is forecast to increase".
 */
import type { RiskInput, RiskOutput, RiskFactor } from '../providers/types';
import { levelForRisk } from './demoEngine';

const WEIGHTS: Record<string, number> = {
  rainfall: 0.31,
  soil: 0.24,
  movement: 0.19,
  history: 0.11,
  satellite: 0.09,
  road: 0.06,
};

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function normRain(mm: number) { return clamp(mm / 90, 0, 1); }
function normSoil(p: number) { return clamp(p / 100, 0, 1); }
function normMove(mm: number) { return clamp(mm / 25, 0, 1); }
function normSat(mm: number) { return clamp(mm / 22, 0, 1); }

export interface ForecastPoint { at: string; score: number; lo: number; hi: number }

export function assessRisk(input: RiskInput, history: number[] = []): RiskOutput {
  const parts = {
    rainfall: normRain(input.rainfallMmHr) * 100,
    soil: normSoil(input.soilMoisturePct) * 100,
    movement: normMove(input.groundMoveMm) * 100,
    history: clamp(input.historicalRisk, 0, 100),
    satellite: normSat(input.satelliteDeformMm) * 100,
    road: clamp(input.roadExposure, 0, 100),
  };
  // Slope amplifies: steep slopes weight movement/satellite more
  const steep = clamp((input.slopeDeg - 25) / 20, 0, 1); // 0..1 above 25°
  const wMove = WEIGHTS.movement + steep * 0.06;
  const wRain = WEIGHTS.rainfall - steep * 0.02;
  const score =
    parts.rainfall * wRain +
    parts.soil * WEIGHTS.soil +
    parts.movement * wMove +
    parts.history * WEIGHTS.history +
    parts.satellite * (WEIGHTS.satellite + steep * 0.02) +
    parts.road * WEIGHTS.road +
    clamp((input.citizenReports || 0) * 1.5, 0, 6);
  const s = Math.round(clamp(score, 0, 99) * 10) / 10;
  const level = levelForRisk(s);
  // Explainability: contribution % normalized
  const raw: RiskFactor[] = [
    { key: 'rainfall', label: 'Heavy rainfall', contributionPct: 0 },
    { key: 'soil', label: 'Soil saturation', contributionPct: 0 },
    { key: 'movement', label: 'Ground movement', contributionPct: 0 },
    { key: 'history', label: 'Historical risk', contributionPct: 0 },
    { key: 'satellite', label: 'Satellite deformation', contributionPct: 0 },
    { key: 'road', label: 'Road exposure', contributionPct: 0 },
  ];
  const vals = [parts.rainfall * wRain, parts.soil * WEIGHTS.soil, parts.movement * wMove, parts.history * WEIGHTS.history, parts.satellite * WEIGHTS.satellite, parts.road * WEIGHTS.road];
  const tot = vals.reduce((a, b) => a + b, 0) || 1;
  raw.forEach((f, i) => { f.contributionPct = Math.round((vals[i] / tot) * 100); });
  raw.sort((a, b) => b.contributionPct - a.contributionPct);

  const prev = history.length > 1 ? history[history.length - 4] ?? history[0] : s;
  const trendPct = Math.round((s - prev) * 10) / 10;
  const probabilityPct = Math.round(clamp(s * 0.82, 1, 95));
  const action =
    level === 'critical' ? 'Evacuate precautionarily via lower-hazard route. Field inspection required.'
    : level === 'high' ? 'Field inspection. Restrict heavy vehicles. Alert residents.'
    : level === 'moderate' ? 'Enhanced monitoring. Verify sensors. Advise caution.'
    : 'Routine monitoring. Keep emergency kit ready.';
  return { score: s, level, probabilityPct, factors: raw, trendPct, action, simulated: true };
}

/** Forecast with uncertainty bands — wording-safe ("forecast to increase"). */
export function forecastRisk(current: number, input: RiskInput): ForecastPoint[] {
  const driftUp = clamp((input.rainfallMmHr - 20) * 0.08 + (input.soilMoisturePct - 55) * 0.06, -4, 9);
  const mk = (h: string, add: number, w: number): ForecastPoint => {
    const score = Math.round(clamp(current + add, 0, 99));
    return { at: h, score, lo: Math.round(clamp(score - w, 0, 100)), hi: Math.round(clamp(score + w, 0, 100)) };
  };
  return [
    mk('NOW', 0, 4),
    mk('+6 H', driftUp * 0.6, 7),
    mk('+12 H', driftUp * 1.1, 10),
    mk('+24 H', driftUp * 1.7, 14),
  ];
}
