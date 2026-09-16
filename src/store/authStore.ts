'use client';
/** Operator session: JWT lives in memory only (never localStorage).
 * Only the non-secret operator ID is remembered across reloads.
 */
import { useSyncExternalStore } from 'react';
import { API_BASE } from '@/platform/api';

export interface Identity { sub: string; role: string; permissions: string[] }
interface AuthState { token: string | null; identity: Identity | null; rememberedId: string }

const ID_KEY = 'drishti-operator-id';
let state: AuthState = { token: null, identity: null, rememberedId: '' };
try { state.rememberedId = localStorage.getItem(ID_KEY) ?? ''; } catch { /* ssr/private */ }

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function snap(): AuthState { return state; }
function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, snap, snap);
}

export async function signIn(username: string, secret: string, remember: boolean): Promise<{ ok: boolean; error?: string; identity?: Identity }> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(`${API_BASE}/api/v1/auth/token`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, secret }), signal: ctrl.signal,
    });
    clearTimeout(t);
    if (r.status === 503) return { ok: false, error: 'Sign-in is not configured on this server (demo build).' };
    if (r.status === 429) return { ok: false, error: 'Too many attempts. Please wait and try again later.' };
    if (!r.ok) return { ok: false, error: 'Invalid email or password.' };
    const j = await r.json();
    const me: Response = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${j.access_token}` },
    });
    const identity: Identity = me.ok ? await me.json() : { sub: j.sub, role: j.role, permissions: [] };
    state = { token: j.access_token as string, identity, rememberedId: remember ? username : state.rememberedId };
    try {
      if (remember) localStorage.setItem(ID_KEY, username);
      else localStorage.removeItem(ID_KEY);
    } catch { /* noop */ }
    emit();
    return { ok: true, identity };
  } catch {
    return { ok: false, error: 'Unable to connect to the authentication service. Please check your connection and try again.' };
  }
}

export async function signOut(): Promise<void> {
  try {
    if (state.token) {
      await fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: 'POST', headers: { Authorization: `Bearer ${state.token}` },
      });
    }
  } catch { /* server audit best-effort; client state clears regardless */ }
  state = { token: null, identity: null, rememberedId: state.rememberedId };
  emit();
}

export function authHeader(): Record<string, string> {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}
