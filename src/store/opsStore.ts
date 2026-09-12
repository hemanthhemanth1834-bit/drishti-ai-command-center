'use client';
import { useSyncExternalStore } from 'react';

/** Shared ops state (scenario + spillway) so every route reacts to the same truth. */
export type OpsState = {
  scenario: string;
  /** Spillway discharge in thousand cusecs. */
  spillwayK: number;
  /** Acknowledged alert ids (session-scoped). */
  acked: string[];
  /** Active presentation demo (drives scenario + spillway through phases). */
  demo: { id: DemoId; phase: number } | null;
};

export type DemoId = 'flood' | 'cyclone' | 'fire' | 'quake';

export const DEMO_PHASES = [
  'NORMAL',
  'WATCH',
  'WARNING',
  'CRITICAL',
  'EVACUATION',
  'RESCUE',
  'RECOVERY',
] as const;

export const DEMO_META: Record<DemoId, { emoji: string; label: string }> = {
  flood: { emoji: '🌊', label: 'FLOOD' },
  cyclone: { emoji: '🌀', label: 'CYCLONE' },
  fire: { emoji: '🔥', label: 'URBAN FIRE' },
  quake: { emoji: '🌎', label: 'EARTHQUAKE' },
};

/** Per-phase {scenario, spillwayK} scripts. Phases escalate then stand down. */
export const DEMO_SCRIPTS: Record<DemoId, { scenario: string; spillwayK: number }[]> = {
  flood: [
    { scenario: 'nominal', spillwayK: 44 },
    { scenario: 'nominal', spillwayK: 50 },
    { scenario: 'storm', spillwayK: 58 },
    { scenario: 'storm', spillwayK: 68 },
    { scenario: 'swarm-surge', spillwayK: 60 },
    { scenario: 'swarm-surge', spillwayK: 48 },
    { scenario: 'nominal', spillwayK: 44 },
  ],
  cyclone: [
    { scenario: 'nominal', spillwayK: 40 },
    { scenario: 'swarm-surge', spillwayK: 44 },
    { scenario: 'storm', spillwayK: 54 },
    { scenario: 'storm', spillwayK: 66 },
    { scenario: 'storm', spillwayK: 58 },
    { scenario: 'nominal', spillwayK: 46 },
    { scenario: 'nominal', spillwayK: 42 },
  ],
  fire: [
    { scenario: 'nominal', spillwayK: 38 },
    { scenario: 'swarm-surge', spillwayK: 40 },
    { scenario: 'swarm-surge', spillwayK: 44 },
    { scenario: 'gps-denied', spillwayK: 42 },
    { scenario: 'swarm-surge', spillwayK: 38 },
    { scenario: 'nominal', spillwayK: 36 },
    { scenario: 'nominal', spillwayK: 35 },
  ],
  quake: [
    { scenario: 'nominal', spillwayK: 38 },
    { scenario: 'gps-denied', spillwayK: 40 },
    { scenario: 'gps-denied', spillwayK: 44 },
    { scenario: 'storm', spillwayK: 48 },
    { scenario: 'swarm-surge', spillwayK: 42 },
    { scenario: 'nominal', spillwayK: 38 },
    { scenario: 'nominal', spillwayK: 36 },
  ],
};

function applyDemo(id: DemoId, phase: number) {
  const step = DEMO_SCRIPTS[id][phase];
  state = {
    ...state,
    demo: { id, phase },
    scenario: step.scenario,
    spillwayK: step.spillwayK,
    acked: [],
  };
  emit();
}

export function startDemo(id: DemoId) {
  applyDemo(id, 0);
}

export function demoStep(dir: 1 | -1) {
  if (!state.demo) return;
  const next = Math.max(0, Math.min(DEMO_PHASES.length - 1, state.demo.phase + dir));
  applyDemo(state.demo.id, next);
}

/** Jump straight to a phase (Mission Replay scrubber). Same engine, no duplicate. */
export function demoGoto(phase: number) {
  if (!state.demo) return;
  applyDemo(state.demo.id, Math.max(0, Math.min(DEMO_PHASES.length - 1, phase)));
}

/** Per-phase story captions. Flood = Vijayawada flood response narrative. */
export const DEMO_NARRATIVE: Record<DemoId, string[]> = {
  flood: [
    'Vijayawada normal ops. Barrage gates metered, river steady.',
    'Heavy rain upstream. Inflow rising, bund patrols out.',
    'Water rising past watch marks. Low wards alerted.',
    'CRITICAL: discharge over 45k cusecs. NH-65 underpass flooding.',
    'Evacuation: buses PB-08/PB-11 to City Sports Complex.',
    'Drone search: FLIR over Ward 14 bund riverbed. Boats RB-07/RB-11 out.',
    'Water receding. Relief + damage audit begin.',
  ],
  cyclone: [
    'Coast normal. Bay watch routine.',
    'Depression forms. Fishermen recalled, control room active.',
    'Storm track converging. Coastal wards alerted.',
    'CRITICAL: landfall window. Surge + destructive winds.',
    'Evacuation: coastal villages to cyclone shelters.',
    'Drone survey of surge damage. Rescue columns moving.',
    'Stand down. Power + road restoration.',
  ],
  fire: [
    'Industrial belt normal. Audits current.',
    'Heat + dry spell. Extra watch on chemical cluster.',
    'Smoke reported. Tenders staged, siren drill route open.',
    'CRITICAL: smoke + comms degraded. Dead-reckoning ops.',
    'Evacuation: downwind blocks to Riverbend Hall.',
    'Drone FLIR mapping hotspots. Fire lines holding.',
    'Cooling + air-quality watch. Audit resumes.',
  ],
  quake: [
    'Region normal. Seismic Zone II baseline.',
    'Tremor swarm. Structures check, comms tested.',
    'Strong tremor. GPS degraded, dead-reckoning on.',
    'CRITICAL: damage reports inbound. Hospitals on standby.',
    'Evacuation: unsafe blocks to open grounds.',
    'Drone + dog-squad search. Triage at District General.',
    'Aftershock watch. PDNA audit opens.',
  ],
};

export function stopDemo() {
  state = { ...state, demo: null, scenario: 'nominal', spillwayK: 45, acked: [] };
  emit();
}

let state: OpsState = { scenario: 'nominal', spillwayK: 45, acked: [], demo: null };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getOps(): OpsState {
  return state;
}

export function setOps(patch: Partial<OpsState>) {
  state = { ...state, ...patch };
  emit();
}

export function ackAlert(id: string) {
  if (!state.acked.includes(id)) setOps({ acked: [...state.acked, id] });
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useOps(): OpsState {
  return useSyncExternalStore(subscribe, getOps, getOps);
}
