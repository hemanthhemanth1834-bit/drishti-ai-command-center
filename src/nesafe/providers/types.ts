/**
 * NE-SAFE AI provider abstraction — free-first.
 * Every provider supports LIVE MODE + DEMO MODE with automatic fallback.
 * No API key required to run. Real keys (optional) live in .env, never in source.
 */

export type ProviderMode = 'LIVE' | 'DEMO';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface ProviderStatus {
  mode: ProviderMode;
  label: string; // "DEMO MODE" | "LIVE DATA"
  lastUpdated?: string;
  source: string;
}

export function envFlag(name: string): string {
  try {
    // Next.js exposes NEXT_PUBLIC_* to browser; Vite VITE_* documented for reference.
    const v = (process.env as Record<string, string | undefined>)[name];
    return (v ?? '').trim();
  } catch {
    return '';
  }
}

export function isForceDemo(): boolean {
  const f = envFlag('NEXT_PUBLIC_FORCE_DEMO');
  if (f === '') return true; // default: demo-first, keyless
  return f.toLowerCase() !== 'false';
}

export interface WeatherNow {
  tempC: number;
  condition: string;
  humidityPct: number;
  windKmh: number;
  rainfallMmHr: number;
  source: string;
}
export interface WeatherProvider {
  readonly name: string;
  mode(): ProviderMode;
  status(): ProviderStatus;
  now(lat: number, lon: number): Promise<WeatherNow>;
}

export interface SatelliteObs {
  passId: string;
  capturedAt: string;
  deformationMm: number;
  changePct: number;
  beforeUrl?: string;
  afterUrl?: string;
  simulated: boolean;
}
export interface SatelliteProvider {
  readonly name: string;
  mode(): ProviderMode;
  status(): ProviderStatus;
  latest(lat: number, lon: number): Promise<SatelliteObs>;
}

export interface TerrainCell {
  lat: number; lon: number; elevationM: number; slopeDeg: number;
}
export interface TerrainProvider {
  readonly name: string;
  mode(): ProviderMode;
  status(): ProviderStatus;
  elevation(lat: number, lon: number): Promise<TerrainCell>;
}

export interface MapProvider {
  readonly name: string;
  mode(): ProviderMode;
  styleUrl(): string; // free basemap, no key
  attribution(): string;
}

export type SensorState = 'NORMAL' | 'WARNING' | 'HIGH' | 'CRITICAL' | 'OFFLINE';
export interface SensorReading {
  id: string;
  soilMoisturePct: number;
  tiltDeg: number;
  groundMoveMm: number;
  batteryPct: number;
  state: SensorState;
  updatedAgoSec: number;
}
export interface SensorProvider {
  readonly name: string;
  mode(): ProviderMode;
  status(): ProviderStatus;
  list(): Promise<SensorReading[]>;
  get(id: string): Promise<SensorReading | null>;
}

export interface NotifyChannel { id: string; label: string; enabled: boolean }
export interface NotificationProvider {
  readonly name: string;
  mode(): ProviderMode;
  channels(): NotifyChannel[];
  send(title: string, body: string): Promise<{ queued: boolean; channel: string }>;
}

export interface RiskInput {
  rainfallMmHr: number;
  soilMoisturePct: number;
  slopeDeg: number;
  elevationM: number;
  groundMoveMm: number;
  historicalRisk: number; // 0-100
  satelliteDeformMm: number;
  roadExposure: number; // 0-100
  citizenReports: number; // count nearby
}
export interface RiskFactor { key: string; label: string; contributionPct: number }
export interface RiskOutput {
  score: number; // 0-100
  level: RiskLevel;
  probabilityPct: number;
  factors: RiskFactor[];
  trendPct: number; // e.g. +18 in last 3h
  action: string;
  simulated: boolean;
}
export interface MLRiskProvider {
  readonly name: string;
  mode(): ProviderMode;
  assess(input: RiskInput, history?: number[]): Promise<RiskOutput>;
}
