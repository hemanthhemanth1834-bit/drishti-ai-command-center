'use client';
import { useSyncExternalStore } from 'react';

export type AppMode = 'public' | 'command';
export type Lang = 'en' | 'te' | 'hi';
export type QualityMode = 'high' | 'medium' | 'low';

type A11y = { largeText: boolean; highContrast: boolean; reduceMotion: boolean };
type AppState = {
  mode: AppMode;
  lang: Lang;
  a11y: A11y;
  qualityMode: QualityMode;
  soundEnabled: boolean;
};

const KEY = 'drishti-app-v2';

function detectOptimalQuality(): QualityMode {
  if (typeof window === 'undefined') return 'high';
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return 'low';
    }
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const cores = navigator.hardwareConcurrency ?? 4;
    // @ts-ignore deviceMemory is available in Chrome/Edge
    const memory = (navigator as any).deviceMemory ?? 4;

    if (isMobile || cores <= 2 || memory < 4) return 'low';
    if (cores <= 4 || memory < 8) return 'medium';
    return 'high';
  } catch {
    return 'medium';
  }
}

function load(): AppState {
  const fallback: AppState = {
    mode: 'command',
    lang: 'en',
    a11y: { largeText: false, highContrast: false, reduceMotion: false },
    qualityMode: detectOptimalQuality(),
    soundEnabled: false,
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      ...parsed,
      a11y: { ...fallback.a11y, ...(parsed.a11y || {}) },
      qualityMode: parsed.qualityMode || detectOptimalQuality(),
    };
  } catch {
    return fallback;
  }
}

let state: AppState = {
  mode: 'command',
  lang: 'en',
  a11y: { largeText: false, highContrast: false, reduceMotion: false },
  qualityMode: 'high',
  soundEnabled: false,
};
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
export function setQualityMode(mode: QualityMode) {
  setApp({ qualityMode: mode });
}
export function setSoundEnabled(enabled: boolean) {
  setApp({ soundEnabled: enabled });
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
/** App-wide UI prefs (mode, language, accessibility, quality), persisted locally. */
export function useApp(): AppState {
  return useSyncExternalStore(subscribe, getApp, () => state);
}
