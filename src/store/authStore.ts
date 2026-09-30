'use client';
/** Operator session: JWT lives in memory only (never localStorage).
 * Only the non-secret operator ID is remembered across reloads.
 */
import { useSyncExternalStore } from 'react';
import { API_BASE } from '@/platform/api';
import { setApp } from '@/store/appStore';
import { connectionErrorMessage } from './authErrors';

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

let restorePromise: Promise<boolean> | null = null;

/** Restore a persisted httpOnly-cookie session (refresh-safe).
 * Never touches localStorage/sessionStorage with tokens. Returns true when
 * the server recognizes the session cookie; false clears nothing (the server
 * already rejected the cookie). Result is cached per page load.
 *
 * The /me probe carries a hard timeout: a stalled request must never leave
 * callers (e.g. AuthGate's "Restoring session…" splash) hanging forever.
 * Failures reset the cache so a later attempt can retry. */
export function restoreSession(): Promise<boolean> {
  if (state.token || state.identity) return Promise.resolve(true);
  if (!restorePromise) {
    restorePromise = (async () => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10000);
      try {
        const r = await fetch(`${API_BASE}/api/v1/auth/me`, { credentials: 'include', signal: ctrl.signal });
        if (!r.ok) return false;
        const j = await r.json();
        state = {
          token: null,
          identity: {
            sub: String(j.sub ?? '?'),
            role: String(j.role ?? 'citizen'),
            permissions: Array.isArray(j.permissions) ? j.permissions.map(String) : [],
          },
          rememberedId: state.rememberedId,
        };
        emit();
        return true;
      } catch {
        return false;
      } finally {
        clearTimeout(t);
      }
    })();
    // Never cache a failure/hang forever — a later attempt may retry.
    restorePromise.then((ok) => { if (!ok) restorePromise = null; });
  }
  return restorePromise;
}

export async function signIn(username: string, secret: string, remember: boolean): Promise<{ ok: boolean; error?: string; identity?: Identity }> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(`${API_BASE}/api/v1/auth/token`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, secret, remember }), signal: ctrl.signal,
      credentials: 'include',
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
    return { ok: false, error: connectionErrorMessage() };
  }
}

/** Public session: mints a real backend-enforced public_user JWT (in memory only).
 * Powers CONTINUE AS PUBLIC USER as an authenticated limited session, not a flag. */
export async function signInPublic(): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(`${API_BASE}/api/v1/auth/public-token`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: 'web' }), signal: ctrl.signal,
      credentials: 'include',
    });
    clearTimeout(t);
    if (r.status === 503) return { ok: false, error: 'Public access is not configured on this server.' };
    if (r.status === 429) return { ok: false, error: 'Too many attempts. Please wait and try again later.' };
    if (!r.ok) return { ok: false, error: 'Could not start a public session.' };
    const j = await r.json();
    state = {
      token: j.access_token as string,
      identity: { sub: String(j.sub ?? 'public'), role: 'public_user', permissions: [] },
      rememberedId: state.rememberedId,
    };
    try { setApp({ mode: 'public' }); } catch { /* store unavailable (ssr) */ }
    emit();
    return { ok: true };
  } catch {
    return { ok: false, error: connectionErrorMessage() };
  }
}

export async function signOut(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/v1/auth/logout`, {
      method: 'POST',
      headers: state.token ? { Authorization: `Bearer ${state.token}` } : {},
      credentials: 'include',
    });
  } catch { /* server audit/cookie-clear best-effort; client state clears regardless */ }
  state = { token: null, identity: null, rememberedId: state.rememberedId };
  restorePromise = null;
  emit();
}

export function authHeader(): Record<string, string> {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}
