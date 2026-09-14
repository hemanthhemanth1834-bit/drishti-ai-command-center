'use client';
import { useMemo } from 'react';
import { useSyncExternalStore } from 'react';
import { useOps } from './opsStore';
import type { RiskLevel } from '@/data/providers';

/**
 * DRISHTI-X shared intelligence layer (V3).
 *
 * One coherent system state so COMMAND / RISK / ALERTS / EMERGENCY, the 3D
 * globe, AI CORE, radar, telemetry and status indicators all react to the
 * SAME underlying truth. Same lightweight `useSyncExternalStore` module
 * pattern as opsStore/appStore — no new dependencies.
 *
 * Data-trust rule: only real application outputs are stored here
 * (risk-check results, SOS phase+coords, evaluated alerts, scenario).
 * Anything estimated is labeled EST at the display site, never here.
 */

export type IntelTone = 'ok' | 'warn' | 'critical';
export type SosPhase = 'idle' | 'locking' | 'active';

export type DrishtiEventType = 'SENSOR' | 'RISK' | 'ALERT' | 'SOS' | 'SYSTEM' | 'NETWORK';
export type DrishtiEventSeverity = 'info' | 'watch' | 'warning' | 'critical';
export type DrishtiEventStatus = 'active' | 'ack' | 'resolved';

export type DrishtiEvent = {
  id: string;
  type: DrishtiEventType;
  severity: DrishtiEventSeverity;
  title: string;
  detail?: string;
  lat?: number;
  lon?: number;
  place?: string;
  /** Where the event came from (route or engine name). Never a backend claim. */
  source: string;
  ts: number;
  status: DrishtiEventStatus;
};

export type RiskSnapshot = {
  score: number;
  level: RiskLevel;
  confidence: number;
  placeName: string;
  lat: number;
  lon: number;
  assessedAt: number;
  source: 'risk-check';
};

export type SosSnapshot = {
  phase: SosPhase;
  lat: number | null;
  lon: number | null;
  startedAt: number | null;
};

export type LatestAlert = {
  id: string;
  level: 'critical' | 'warning' | 'info';
  title: string;
  ts: number;
  source: string;
};

type IntelState = {
  risk: RiskSnapshot | null;
  sos: SosSnapshot;
  latestAlert: LatestAlert | null;
  events: DrishtiEvent[];
};

const MAX_EVENTS = 30;

let state: IntelState = {
  risk: null,
  sos: { phase: 'idle', lat: null, lon: null, startedAt: null },
  latestAlert: null,
  events: [],
};

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function getIntel(): IntelState {
  return state;
}

/* ---------------- pure shared rules (single definition of truth) ---------------- */

/** Citizen risk level → 0-100 score. Shared with RiskVisualizer. */
export const RISK_SCORE: Record<RiskLevel, number> = { low: 12, moderate: 42, high: 72, critical: 94 };

/**
 * Scenario/spillway drill surrogate → 0-100 score.
 * SAME formula as the command hero ticker and the What-If surrogate.
 */
export function scenarioScore(scenario: string, spillwayK: number): number {
  return Math.min(100, Math.round(30 + spillwayK * 1.1 + (scenario === 'storm' ? 18 : 0)));
}

/**
 * Score → AI tone. PRESERVED V2 rule: >70 critical, >40 warn, else ok.
 * Do not retune without updating every consumer (AiCoreScene, globe, ticker).
 */
export function toneForScore(score: number): IntelTone {
  if (score > 70) return 'critical';
  if (score > 40) return 'warn';
  return 'ok';
}

const TONE_RANK: Record<IntelTone, number> = { ok: 0, warn: 1, critical: 2 };

/** Max-severity resolution across concurrent signals. SOS active always wins. */
export function maxTone(...tones: IntelTone[]): IntelTone {
  return tones.reduce((a, b) => (TONE_RANK[b] > TONE_RANK[a] ? b : a), 'ok' as IntelTone);
}

/** Score → 4-state threat label for display (tone rules above still govern color). */
export function threatForScore(score: number): RiskLevel {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'moderate';
  return 'low';
}

/* ---------------- actions ---------------- */

export function setRiskResult(r: Omit<RiskSnapshot, 'assessedAt'> & { assessedAt?: number }) {
  state = {
    ...state,
    risk: { ...r, assessedAt: r.assessedAt ?? Date.now() },
  };
  emit();
}

export function clearRisk() {
  if (state.risk === null) return;
  state = { ...state, risk: null };
  emit();
}

export function setSosPhase(phase: SosPhase, coords?: { lat: number; lon: number } | null) {
  const old = state.sos;
  state = {
    ...state,
    sos: {
      phase,
      lat: coords?.lat ?? old.lat,
      lon: coords?.lon ?? old.lon,
      startedAt: phase === 'idle' ? null : (old.startedAt ?? Date.now()),
    },
  };
  if (old.phase !== phase || (coords != null && (coords.lat !== old.lat || coords.lon !== old.lon))) emit();
}

export function setLatestAlert(a: Omit<LatestAlert, 'ts'> & { ts?: number }) {
  state = { ...state, latestAlert: { ...a, ts: a.ts ?? Date.now() } };
  emit();
}

/** Append to the session-scoped event timeline. Dedupe by id (replace + re-sort). */
export function pushEvent(e: Omit<DrishtiEvent, 'ts' | 'status'> & { ts?: number; status?: DrishtiEventStatus }) {
  const full: DrishtiEvent = {
    ...e,
    ts: e.ts ?? Date.now(),
    status: e.status ?? 'active',
  };
  const rest = state.events.filter((x) => x.id !== full.id);
  rest.push(full);
  rest.sort((a, b) => a.ts - b.ts);
  state = { ...state, events: rest.slice(-MAX_EVENTS) };
  emit();
}

export function resolveEvent(id: string) {
  const ev = state.events.find((x) => x.id === id);
  if (!ev || ev.status === 'resolved') return;
  state = { ...state, events: state.events.map((x) => (x.id === id ? { ...x, status: 'resolved' as const } : x)) };
  emit();
}

/* ---------------- derived system view (single source of truth) ---------------- */

export type FocusKind = 'sos' | 'risk' | null;

export type IntelView = {
  /** Drill/scenario surrogate score (same number as the command ticker). */
  scenarioScore: number;
  /** Citizen risk-check score, if a check has run this session. */
  riskCheckScore: number | null;
  /** Effective system score = max drill, risk-check; SOS forces 100. */
  effectiveScore: number;
  /** Effective AI tone after max-severity resolution. Drives core/globe/ticker. */
  aiTone: IntelTone;
  /** 4-state threat label for display. */
  threatLevel: RiskLevel;
  risk: RiskSnapshot | null;
  sos: SosSnapshot;
  /** Geo-engine focus: SOS wins over risk-check, else neutral. Real coords only. */
  focus: { kind: Exclude<FocusKind, null>; lat: number; lon: number; label: string } | null;
  latestAlert: LatestAlert | null;
  events: DrishtiEvent[];
};

/**
 * One hook for the whole intelligence picture. Subscribes to opsStore +
 * intelStore so every consumer re-renders on the same truth. Memoized so
 * consumers don't pay for unrelated updates beyond the two subscriptions.
 */
export function useIntel(): IntelView {
  const ops = useOps();
  const intel = useSyncExternalStore(subscribe, getIntel, getIntel);
  return useMemo(() => {
    const sScore = scenarioScore(ops.scenario, ops.spillwayK);
    const rScore = intel.risk ? intel.risk.score : null;
    const sosActive = intel.sos.phase !== 'idle';
    const effectiveScore = sosActive ? 100 : Math.max(sScore, rScore ?? 0);
    const aiTone: IntelTone = sosActive
      ? 'critical'
      : maxTone(toneForScore(sScore), intel.risk ? toneForScore(intel.risk.score) : 'ok');
    const focus =
      sosActive && intel.sos.lat != null && intel.sos.lon != null
        ? {
            kind: 'sos' as const,
            lat: intel.sos.lat,
            lon: intel.sos.lon,
            label: 'SOS BEACON',
          }
        : intel.risk
          ? {
              kind: 'risk' as const,
              lat: intel.risk.lat,
              lon: intel.risk.lon,
              label: intel.risk.placeName,
            }
          : null;
    return {
      scenarioScore: sScore,
      riskCheckScore: rScore,
      effectiveScore,
      aiTone,
      threatLevel: threatForScore(effectiveScore),
      risk: intel.risk,
      sos: intel.sos,
      focus,
      latestAlert: intel.latestAlert,
      events: intel.events,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ops.scenario, ops.spillwayK, intel]);
}

/** Raw snapshot access for non-React call sites (event publishers in handlers). */
export function getIntelSnapshot(): IntelState {
  return state;
}
