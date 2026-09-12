'use client';
import { useSyncExternalStore } from 'react';

/** Shared ops state (scenario + spillway) so every route reacts to the same truth. */
export type OpsState = {
  scenario: string;
  /** Spillway discharge in thousand cusecs. */
  spillwayK: number;
  /** Acknowledged alert ids (session-scoped). */
  acked: string[];
};

let state: OpsState = { scenario: 'nominal', spillwayK: 45, acked: [] };
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
