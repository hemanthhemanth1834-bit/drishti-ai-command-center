'use client';
/** Dynamic region context: country → state → district → city. No code changes for new regions. */
import { useSyncExternalStore } from 'react';

export interface RegionSelection {
  country: string;
  state: string;
  district: string;
  city: string;
  locality: string;
  lat: number | null;
  lon: number | null;
  label: string;
}

const STORE_KEY = 'drishti-region';

let state: RegionSelection = {
  country: 'IN', state: '', district: '', city: '', locality: '',
  lat: null, lon: null, label: 'India',
};

/** Restore last safe selection (location fields only — never secrets). */
try {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORE_KEY) : null;
  if (raw) {
    const p = JSON.parse(raw) as Partial<RegionSelection>;
    if (p && typeof p === 'object') {
      state = {
        country: typeof p.country === 'string' && p.country ? p.country : 'IN',
        state: typeof p.state === 'string' ? p.state : '',
        district: typeof p.district === 'string' ? p.district : '',
        city: typeof p.city === 'string' ? p.city : '',
        locality: typeof p.locality === 'string' ? p.locality : '',
        lat: typeof p.lat === 'number' && p.lat >= -90 && p.lat <= 90 ? p.lat : null,
        lon: typeof p.lon === 'number' && p.lon >= -180 && p.lon <= 180 ? p.lon : null,
        label: typeof p.label === 'string' && p.label ? p.label : 'India',
      };
    }
  }
} catch { /* ssr/private mode — stay on defaults */ }

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function snap(): RegionSelection { return state; }
function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

export function useRegion(): RegionSelection {
  return useSyncExternalStore(subscribe, snap, snap);
}

/** Snapshot for tests and non-React callers. */
export function getRegion(): RegionSelection {
  return { ...state };
}

function persist() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch { /* ssr/private mode */ }
}

export function setRegion(patch: Partial<RegionSelection>) {
  state = { ...state, ...patch };
  if (!patch.label) {
    const parts = [state.locality, state.city, state.district, state.state, state.country].filter(Boolean);
    state = { ...state, label: parts.join(' → ') || 'India' };
  }
  persist();
  emit();
}

export function clearRegion() {
  state = { country: 'IN', state: '', district: '', city: '', locality: '', lat: null, lon: null, label: 'India' };
  persist();
  emit();
}
