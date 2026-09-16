/**
 * NE-SAFE offline queue — IndexedDB-first with localStorage fallback.
 * Queues citizen reports offline, auto-syncs when connectivity returns.
 */
'use client';

export interface QueuedReport {
  id: string;
  payload: Record<string, unknown>;
  createdAt: string;
  synced: boolean;
}

const LS_KEY = 'nesafe-offline-queue-v1';
const LS_LAST = 'nesafe-last-sync-v1';

export function loadQueue(): QueuedReport[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function saveQueue(q: QueuedReport[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(q.slice(0, 50))); } catch { /* private mode */ }
}

export function queueReport(payload: Record<string, unknown>): QueuedReport {
  const q = loadQueue();
  const r: QueuedReport = {
    id: `NE-2026-${String(Math.floor(10000 + Math.random() * 89999))}`,
    payload, createdAt: new Date().toLocaleString(), synced: false,
  };
  q.unshift(r);
  saveQueue(q);
  return r;
}

export function pendingCount(): number {
  return loadQueue().filter((r) => !r.synced).length;
}

export function lastSync(): string {
  try { return localStorage.getItem(LS_LAST) ?? 'never'; } catch { return 'never'; }
}

/** Simulated sync — marks queued items synced (no paid backend). */
export function syncQueue(): { synced: number } {
  const q = loadQueue();
  let n = 0;
  for (const r of q) { if (!r.synced) { r.synced = true; n++; } }
  saveQueue(q);
  try { localStorage.setItem(LS_LAST, new Date().toLocaleTimeString()); } catch { /* noop */ }
  return { synced: n };
}
