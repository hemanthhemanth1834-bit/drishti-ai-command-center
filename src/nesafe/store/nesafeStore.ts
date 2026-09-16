'use client';
/**
 * NE-SAFE global store — additive, does not touch existing app/ops/intel stores.
 * Holds selected slope, demo controls, sim ticks, alerts, reports queue state.
 */
import { useSyncExternalStore } from 'react';
import { NE_SLOPES } from '../data/northeast';
import { DISASTER_SCRIPT, initSlope, tickSlope, type DemoControls, type SlopeSimState } from '../engine/demoEngine';
import { hookSensorFeed } from '../providers/demoProviders';
import type { SensorReading } from '../providers/types';

export type NESafeTab =
  | 'command' | 'terrain' | 'satellite' | 'vision' | 'citizen'
  | 'roads' | 'response' | 'alerts' | 'simulation';

interface NESafeState {
  selectedSlopeId: string;
  controls: DemoControls;
  sim: Record<string, SlopeSimState>;
  tick: number;
  running: boolean;
  scenarioSec: number;
  scenarioOn: boolean;
  soundOn: boolean;
  tab: NESafeTab;
  globeLevel: number; // 0 global → 5 slope
  incidents: { id: string; title: string; detail: string; ts: string; level: string }[];
}

const DEFAULT_CONTROLS: DemoControls = { rain: 45, soil: 55, movement: 35, deformation: 25 };

function initSim(): Record<string, SlopeSimState> {
  const o: Record<string, SlopeSimState> = {};
  for (const s of NE_SLOPES) o[s.id] = initSlope(s.id, s.baseRisk);
  return o;
}

let state: NESafeState = {
  selectedSlopeId: 'MEG-01',
  controls: DEFAULT_CONTROLS,
  sim: initSim(),
  tick: 0,
  running: true,
  scenarioSec: 0,
  scenarioOn: false,
  soundOn: false,
  tab: 'command',
  globeLevel: 2,
  incidents: [
    { id: 'NE-2026-00042', title: 'CRITICAL slope watch (simulated)', detail: 'East Khasi Hills · risk rising in demo feed', ts: new Date().toLocaleTimeString(), level: 'critical' },
  ],
};

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function snap(): NESafeState { return state; }
function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

export function useNESafe(): NESafeState {
  return useSyncExternalStore(subscribe, snap, snap);
}

export function setNESafe(p: Partial<NESafeState>) {
  state = { ...state, ...p };
  emit();
}

export function selectedSim(): SlopeSimState {
  return state.sim[state.selectedSlopeId] ?? Object.values(state.sim)[0];
}

/** Called every ~2s from the page when running. Gradual drift, no jumps. */
export function advanceNESim() {
  if (!state.running) return;
  let controls = state.controls;
  let scenarioSec = state.scenarioSec;
  if (state.scenarioOn) {
    scenarioSec += 2;
    const phase = [...DISASTER_SCRIPT].reverse().find((p) => scenarioSec >= p.atSec);
    if (phase) controls = phase.controls;
    if (scenarioSec > 150) { scenarioSec = 0; }
  }
  const sim: Record<string, SlopeSimState> = {};
  for (const [id, s] of Object.entries(state.sim)) {
    // Focus slope follows controls exactly; others follow damped version (ambient variation)
    const c = id === state.selectedSlopeId ? controls : {
      rain: Math.max(8, controls.rain * 0.55),
      soil: Math.max(8, controls.soil * 0.6),
      movement: Math.max(5, controls.movement * 0.5),
      deformation: Math.max(5, controls.deformation * 0.5),
    };
    sim[id] = tickSlope(s, c);
  }
  // Push critical alert once when focus crosses 80
  const focus = sim[state.selectedSlopeId];
  const incidents = state.incidents;
  if (focus && focus.risk >= 80 && !incidents.some((i) => i.id === 'AUTO-CRIT')) {
    incidents.unshift({ id: 'AUTO-CRIT', title: '🔴 CRITICAL ALERT (simulated)', detail: `${state.selectedSlopeId} risk ${focus.risk.toFixed(0)}/100 · heavy rain + saturation + movement`, ts: new Date().toLocaleTimeString(), level: 'critical' });
  }
  state = { ...state, sim, tick: state.tick + 1, controls, scenarioSec, incidents: incidents.slice(0, 20) };
  emit();
}

export function resetNESim() {
  state = { ...state, sim: initSim(), tick: 0, scenarioSec: 0, scenarioOn: false, controls: DEFAULT_CONTROLS, incidents: state.incidents.filter((i) => i.id !== 'AUTO-CRIT') };
  emit();
}

export function pushIncident(title: string, detail: string, level = 'info') {
  state = { ...state, incidents: [{ id: `NE-2026-${String(Math.floor(10000 + Math.random() * 89999))}`, title, detail, ts: new Date().toLocaleTimeString(), level }, ...state.incidents].slice(0, 20) };
  emit();
}

// Bridge sim → sensor provider feed (soil/tilt/movement/battery per sensor)
import { NE_SENSORS } from '../data/northeast';
hookSensorFeed((): SensorReading[] => {
  return NE_SENSORS.map((m, i) => {
    const s = state.sim[m.slopeId];
    const risk = s?.risk ?? 40;
    const online = !(m.id === 'NL-012' && state.tick % 23 > 19); // one flaky demo node
    const st = !online ? 'OFFLINE' : risk >= 80 ? 'CRITICAL' : risk >= 60 ? 'HIGH' : risk >= 40 ? 'WARNING' : 'NORMAL';
    return {
      id: m.id,
      soilMoisturePct: s ? Math.round(s.soilPct) : 60,
      tiltDeg: Math.round(((s?.groundMoveMm ?? 5) * 0.28 + (i % 3) * 0.4 + 1.2) * 10) / 10,
      groundMoveMm: s ? Math.round(s.groundMoveMm * 10) / 10 : 5,
      batteryPct: Math.max(8, 92 - ((state.tick + i * 7) % 40)),
      state: st,
      updatedAgoSec: 4 + ((state.tick + i * 3) % 12),
    };
  });
});
