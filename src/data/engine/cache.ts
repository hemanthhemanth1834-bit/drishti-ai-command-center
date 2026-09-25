/**
 * DRISHTI-X data engine — memory TTL cache with metadata (Step 22).
 * Cache-first reads protect public APIs. Stale entries are served only
 * when explicitly requested (offline fallback) and always labeled STALE.
 */
import type { CacheEntry } from './types';

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): CacheEntry<T> | null {
  const e = store.get(key) as CacheEntry<T> | undefined;
  return e ?? null;
}

/** True when the entry exists and has not expired at `at`. */
export function cacheFresh<T>(key: string, at: number = Date.now()): CacheEntry<T> | null {
  const e = cacheGet<T>(key);
  if (!e) return null;
  return Date.parse(e.expiresAt) > at ? e : null;
}

export function cacheSet<T>(entry: CacheEntry<T>): void {
  store.set(entry.key, entry as CacheEntry<unknown>);
}

export function cacheDelete(key: string): void {
  store.delete(key);
}

export function cacheClear(): void {
  store.clear();
}

export function cacheSize(): number {
  return store.size;
}

export function makeEntry<T>(key: string, data: T, ttlMs: number, source: string, status: CacheEntry<T>['status']): CacheEntry<T> {
  const created = Date.now();
  return {
    key,
    data,
    createdAt: new Date(created).toISOString(),
    expiresAt: new Date(created + ttlMs).toISOString(),
    source,
    status,
  };
}
