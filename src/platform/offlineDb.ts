'use client';
/** Offline-first store: IndexedDB with localStorage fallback + sync engine.

Internet -> Cloud -> Sync Engine -> Field Device -> IndexedDB ->
Offline Queue -> Automatic Sync (never lose field reports).
*/

const DB = 'drishti-offline-v1';

type Row = { key: string; value: unknown; ts: number };

function ls(): Storage | null {
  try { return localStorage; } catch { return null; }
}

function idb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const open = indexedDB.open(DB, 1);
      open.onupgradeneeded = () => {
        const db = open.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('queue')) db.createObjectStore('queue', { keyPath: 'key' });
      };
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

async function idbPut(store: string, row: Row): Promise<boolean> {
  const db = await idb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(row);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch { resolve(false); }
  });
}

async function idbAll(store: string): Promise<Row[]> {
  const db = await idb();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(store, 'readonly');
      const q = tx.objectStore(store).getAll();
      q.onsuccess = () => resolve((q.result as Row[]) ?? []);
      q.onerror = () => resolve([]);
    } catch { resolve([]); }
  });
}

async function idbDel(store: string, key: string): Promise<void> {
  const db = await idb();
  if (!db) return;
  try { db.transaction(store, 'readwrite').objectStore(store).delete(key); } catch { /* noop */ }
}

export async function cachePut(key: string, value: unknown): Promise<void> {
  const row = { key, value, ts: Date.now() };
  if (!(await idbPut('kv', row))) {
    try { ls()?.setItem(`off:${key}`, JSON.stringify(row)); } catch { /* noop */ }
  }
}

export async function cacheGet<T>(key: string): Promise<{ value: T; ts: number } | null> {
  const rows = await idbAll('kv');
  const hit = rows.find((r) => r.key === key);
  if (hit) return { value: hit.value as T, ts: hit.ts };
  try {
    const raw = ls()?.getItem(`off:${key}`);
    if (raw) { const r = JSON.parse(raw); return { value: r.value as T, ts: r.ts }; }
  } catch { /* noop */ }
  return null;
}

export interface QueuedItem { key: string; kind: 'incident' | 'reading'; payload: Record<string, unknown> }

export async function queueAdd(kind: QueuedItem['kind'], payload: Record<string, unknown>): Promise<string> {
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const row = { key, value: { kind, payload }, ts: Date.now() };
  if (!(await idbPut('queue', row))) {
    const s = ls();
    if (s) {
      try {
        const arr = JSON.parse(s.getItem('off:queue') ?? '[]');
        arr.push({ key, ...(row.value as object) });
        s.setItem('off:queue', JSON.stringify(arr));
      } catch { /* noop */ }
    }
  }
  return key;
}

export async function queueList(): Promise<(QueuedItem & { key: string })[]> {
  const rows = await idbAll('queue');
  const out = rows.map((r) => ({ key: r.key, ...((r.value as object) as Omit<QueuedItem, 'key'>) }));
  if (out.length) return out;
  try {
    return JSON.parse(ls()?.getItem('off:queue') ?? '[]');
  } catch { return []; }
}

export async function queueClear(keys: string[]): Promise<void> {
  for (const k of keys) await idbDel('queue', k);
  try {
    const s = ls();
    if (s) {
      const arr = JSON.parse(s.getItem('off:queue') ?? '[]').filter((x: { key: string }) => !keys.includes(x.key));
      s.setItem('off:queue', JSON.stringify(arr));
    }
  } catch { /* noop */ }
}

/** Push the offline queue to /api/v1/sync/push. Returns per-item receipts. */
export async function syncNow(apiBase: string, key: string) {
  const items = await queueList();
  if (!items.length) return { synced: 0, receipts: [] as unknown[] };
  const res = await fetch(`${apiBase}/api/v1/sync/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify({
      device_id: 'field-pwa',
      items: items.map((i) => ({ client_id: i.key, kind: i.kind, payload: i.payload })),
    }),
  });
  if (!res.ok) throw new Error(`sync HTTP ${res.status}`);
  const j = await res.json();
  const accepted = (j.receipts ?? []).filter((r: { status: string }) => r.status === 'accepted').map((r: { client_id: string }) => r.client_id);
  await queueClear(accepted);
  return { synced: accepted.length, receipts: j.receipts };
}

export function onReconnect(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', fn);
  return () => window.removeEventListener('online', fn);
}
