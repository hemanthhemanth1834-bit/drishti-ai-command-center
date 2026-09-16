'use client';
/** Typed client for the DRISHTI-X platform APIs (spec paths) with DEMO fallback.

Every call returns { data, status } where status is LIVE | DEMO | OFFLINE.
Never throws for UI flows — backend-down degrades to labeled demo.
Browser only sends the publishable gateway key (NEXT_PUBLIC_*).
*/

const BASE =
  (typeof process !== 'undefined' &&
    (process.env.NEXT_PUBLIC_API_BASE as string | undefined)) ||
  'http://localhost:8000';
const KEY =
  (typeof process !== 'undefined' &&
    (process.env.NEXT_PUBLIC_GATEWAY_KEY as string | undefined)) ||
  '';

export type DataStatus =
  | 'LIVE' | 'FORECAST' | 'DEMO' | 'SIMULATION' | 'EXTERNAL' | 'OFFLINE'
  | 'NOT_CONFIGURED' | 'NOT_AVAILABLE' | 'STALE' | 'MODEL' | 'MIXED';

export interface ApiResult<T> {
  data: T | null;
  status: DataStatus;
  note?: string;
}

async function req<T>(path: string, init?: RequestInit, auth = false): Promise<ApiResult<T>> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (init?.headers) Object.assign(headers, init.headers);
    if (auth && KEY) headers.Authorization = `Bearer ${KEY}`;
    const r = await fetch(`${BASE}${path}`, { ...init, headers, signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return { data: null, status: 'OFFLINE', note: `HTTP ${r.status}` };
    const data = (await r.json()) as T;
    return { data, status: 'LIVE' };
  } catch {
    return { data: null, status: 'OFFLINE', note: 'Backend unreachable — demo fallback' };
  }
}

export const get = <T,>(path: string) => req<T>(path);
export const post = <T,>(path: string, body: unknown, auth = false) =>
  req<T>(path, { method: 'POST', body: JSON.stringify(body) }, auth);
export const postForm = <T,>(path: string, form: FormData, auth = false) => {
  const headers: Record<string, string> = {};
  if (auth && KEY) headers.Authorization = `Bearer ${KEY}`;
  return req<T>(path, { method: 'POST', body: form, headers }, false);
};

export function hasKey(): boolean {
  return KEY.length > 0;
}

/** Demo stand-ins used ONLY when status is OFFLINE (always labeled). */
export const demo = {
  prediction: (lat: number, lon: number) => ({
    prediction_id: 'demo-local', location: { latitude: lat, longitude: lon },
    landslide_probability: 0.42, risk_level: 'MODERATE', confidence: 58,
    model_version: 'DemoHeuristic-local', timestamp: new Date().toISOString(),
    factors: { rainfall: 'demo', soil_moisture: 'demo', slope: 'demo', historical_risk: 'demo' },
    contributions: [], simulated: true, data_status: 'DEMO',
  }),
  weather: { temp_c: 24, rain_24h_mm: 64, source: 'DEMO', data_status: 'DEMO' },
};

export const API_BASE = BASE;
