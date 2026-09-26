'use client';
/**
 * STEP 31 — ModuleStatusGrid: the 14 command-module links, each with an
 * honestly derived status pill. Backend-backed modules probe ONE shared
 * backend health endpoint; weather uses the keyless Open-Meteo feed;
 * satellite is definitionally LATEST_AVAILABLE (daily NRT); simulation
 * pages are definitionally SIMULATION; location reflects browser online
 * state against the keyless OSM ecosystem. Nothing is assumed live.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/platform/provenance';
import { get } from '@/platform/api';
import { getWeather } from '@/lib/liveServices';

interface Module {
  href: string;
  label: string;
  kind: 'backend' | 'weather' | 'satellite' | 'sim' | 'location';
}

const MODULES: Module[] = [
  { href: '/drones', label: 'DRONE SWARM & SAR', kind: 'sim' },
  { href: '/twin', label: '3D DIGITAL TWIN', kind: 'sim' },
  { href: '/location', label: 'LOCATION INTEL', kind: 'location' },
  { href: '/simulation', label: 'WHAT-IF COPILOT', kind: 'sim' },
  { href: '/resources', label: 'HOSPITAL ICU', kind: 'backend' },
  { href: '/shelter', label: 'SHELTER SCANNER', kind: 'backend' },
  { href: '/reunion', label: 'OP-MILAN REUNION', kind: 'backend' },
  { href: '/recovery', label: 'RECOVERY & AUDIT', kind: 'backend' },
  { href: '/weather', label: 'WEATHER INTEL', kind: 'weather' },
  { href: '/satellite', label: 'SATELLITE INTEL', kind: 'satellite' },
  { href: '/sensors', label: 'SENSOR NETWORK', kind: 'backend' },
  { href: '/roads', label: 'ROAD INTEL', kind: 'backend' },
  { href: '/response', label: 'RESPONSE BOARD', kind: 'backend' },
  { href: '/alerts', label: 'ALERT CENTER', kind: 'backend' },
];

const STATIC_STATE: Record<string, string> = {
  sim: 'SIMULATION',
  satellite: 'LATEST_AVAILABLE',
};

export default function ModuleStatusGrid() {
  const [states, setStates] = useState<Record<string, string>>({});

  useEffect(() => {
    let dead = false;
    const ctrl = new AbortController();
    (async () => {
      const next: Record<string, string> = {};
      const [be, wx] = await Promise.all([
        get<{ status?: string }>('/api/v1/model-health').catch(() => ({ data: null as never, status: 'OFFLINE' as const })),
        getWeather(21.5, 79.0, ctrl.signal).catch(() => ({ data: null as never, state: 'OFFLINE' as const, source: '', updatedAt: null })),
      ]);
      if (dead) return;
      const backendUp = Boolean(be.data);
      for (const m of MODULES) {
        if (m.kind === 'backend') next[m.href] = backendUp ? 'LIVE' : 'OFFLINE';
        else if (m.kind === 'weather') next[m.href] = (wx as { state?: string }).state ?? 'OFFLINE';
        else if (m.kind === 'location') {
          next[m.href] = typeof navigator !== 'undefined' && !navigator.onLine ? 'OFFLINE' : 'EXTERNAL';
        }
        else next[m.href] = STATIC_STATE[m.kind];
      }
      setStates(next);
    })();
    return () => { dead = true; ctrl.abort(); };
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2 text-[11px]" role="list" aria-label="Command modules with live status">
      {MODULES.map((m) => (
        <Link
          key={m.href}
          href={m.href}
          role="listitem"
          className="px-3 py-2 rounded-lg bg-[#091a2e] border border-[#1b314b] hover:border-[#00d2ff]/60 text-slate-200 font-bold text-center min-h-[44px] flex flex-col items-center justify-center gap-1"
        >
          {m.label}
          <StatusBadge status={states[m.href] ?? 'OFFLINE'} small />
        </Link>
      ))}
    </div>
  );
}
