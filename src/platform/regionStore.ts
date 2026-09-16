'use client';
/** Dynamic region context: country → state → district → city. No code changes for new regions. */
import { useSyncExternalStore } from 'react';

export interface RegionSelection {
  country: string;
  state: string;
  district: string;
  city: string;
  lat: number | null;
  lon: number | null;
  label: string;
}

let state: RegionSelection = {
  country: 'IN', state: '', district: '', city: '',
  lat: null, lon: null, label: 'India',
};

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function snap(): RegionSelection { return state; }
function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

export function useRegion(): RegionSelection {
  return useSyncExternalStore(subscribe, snap, snap);
}

export function setRegion(patch: Partial<RegionSelection>) {
  state = { ...state, ...patch };
  if (!patch.label) {
    const parts = [state.city, state.district, state.state, state.country].filter(Boolean);
    state = { ...state, label: parts.join(' → ') || 'India' };
  }
  emit();
}

export function clearRegion() {
  state = { country: 'IN', state: '', district: '', city: '', lat: null, lon: null, label: 'India' };
  emit();
}
