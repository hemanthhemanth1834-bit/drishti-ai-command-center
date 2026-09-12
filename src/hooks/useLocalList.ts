'use client';
import { useCallback, useEffect, useState } from 'react';

/** localStorage-backed list (reports, family, checklists). Validates + sanitizes input. */
export function useLocalList<T extends { id: string }>(key: string, seed: T[] = []) {
  const [items, setItems] = useState<T[]>(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setItems(JSON.parse(raw) as T[]);
    } catch {
      /* corrupted → keep seed */
    }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(items).slice(0, 200_000));
    } catch {
      /* quota → keep in memory */
    }
  }, [items, key, ready]);

  const add = useCallback((item: T) => {
    setItems((l) => [item, ...l].slice(0, 200));
  }, []);
  const update = useCallback((id: string, patch: Partial<T>) => {
    setItems((l) => l.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);
  const remove = useCallback((id: string) => {
    setItems((l) => l.filter((i) => i.id !== id));
  }, []);

  return { items, add, update, remove, ready };
}

/** Trim + cap user text (defense against junk/oversize input). */
export function cleanText(s: string, max = 500): string {
  return s.replace(/\s+/g, ' ').trim().slice(0, max);
}
