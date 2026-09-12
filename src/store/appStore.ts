'use client';
import { useSyncExternalStore } from 'react';

export type AppMode = 'public' | 'command';
export type Lang = 'en' | 'te' | 'hi';

type A11y = { largeText: boolean; highContrast: boolean; reduceMotion: boolean };
type AppState = { mode: AppMode; lang: Lang; a11y: A11y };

const KEY = 'drishti-app-v1';

function load(): AppState {
  const fallback: AppState = {
    mode: 'command',
    lang: 'en',
    a11y: { largeText: false, highContrast: false, reduceMotion: false },
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

let state: AppState = { mode: 'command', lang: 'en', a11y: { largeText: false, highContrast: false, reduceMotion: false } };
let hydrated = false;
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode */
  }
}
function getApp(): AppState {
  if (!hydrated && typeof window !== 'undefined') {
    hydrated = true;
    state = load();
  }
  return state;
}
export function setApp(patch: Partial<AppState>) {
  state = { ...state, ...patch };
  emit();
}
export function setA11y(patch: Partial<A11y>) {
  setApp({ a11y: { ...getApp().a11y, ...patch } });
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
/** App-wide UI prefs (mode, language, accessibility), persisted locally. */
export function useApp(): AppState {
  return useSyncExternalStore(subscribe, getApp, () => state);
}
