'use client';
/**
 * POST-LAUNCH TRUTHFULNESS PATCH — ModuleStatusGrid.
 * Each backend-backed module probes its OWN endpoint; a healthy
 * model-health response no longer marks unrelated modules LIVE.
 * Modules with no backend are labeled SIMULATION / DEMO / AVAILABLE
 * according to what their pages actually do:
 *  - reunion, recovery: no API calls anywhere -> SIMULATION
 *  - shelter: page states DEMO DATA -> DEMO
 *  - drones, twin, simulation: simulated links -> SIMULATION
 *  - location: works from keyless OSM + browser GPS, no permission
 *    required for search/map -> AVAILABLE (never a live-data claim)
 *  - satellite: GIBS daily NRT -> LATEST_AVAILABLE (definitionally true)
 *  - weather: measured getWeather() feed state (unchanged behavior)
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/platform/provenance';
import { get } from '@/platform/api';
import { getWeather } from '@/lib/liveServices';

interface Module {
  href: string;
  label: string;
  kind: 'probe' | 'weather' | 'satellite' | 'sim' | 'demo' | 'available';
  probe?: string;
}

const MODULES: Module[] = [
  { href: '/drones', label: 'DRONE SWARM & SAR', kind: 'sim' },
  { href: '/twin', label: '3D DIGITAL TWIN', kind: 'sim' },
  { href: '/location', label: 'LOCATION INTEL', kind: 'available' },
  { href: '/simulation', label: 'WHAT-IF COPILOT', kind: 'sim' },
  { href: '/resources', label: 'HOSPITAL ICU', kind: 'probe', probe: '/api/v1/resources' },
  { href: '/shelter', label: 'SHELTER SCANNER', kind: 'demo' },
  { href: '/reunion', label: 'OP-MILAN REUNION', kind: 'sim' },
  { href: '/recovery', label: 'RECOVERY & AUDIT', kind: 'sim' },
  { href: '/weather', label: 'WEATHER INTEL', kind: 'weather' },
  { href: '/satellite', label: 'SATELLITE INTEL', kind: 'satellite' },
  { href: '/sensors', label: 'SENSOR NETWORK', kind: 'probe', probe: '/api/v1/sensors/network' },
  { href: '/roads', label: 'ROAD INTEL', kind: 'probe', probe: '/api/v1/roads' },
  { href: '/response', label: 'RESPONSE BOARD', kind: 'probe', probe: '/api/v1/response/queue' },
  { href: '/alerts', label: 'ALERT CENTER', kind: 'probe', probe: '/api/v1/alerts?limit=1' },
];

const STATIC_STATE: Record<string, string> = {
  sim: 'SIMULATION',
  demo: 'DEMO',
  available: 'AVAILABLE',
  satellite: 'LATEST_AVAILABLE',
};

export default function ModuleStatusGrid() {
  const [states, setStates] = useState<Record<string, string>>({});

  useEffect(() => {
    let dead = false;
    const ctrl = new AbortController();
    (async () => {
      const next: Record<string, string> = {};
      const probed = MODULES.filter((m) => m.kind === 'probe');
      const results = await Promise.all(
        probed.map((m) =>
          get<unknown>(m.probe as string)
            .then((r) => ({ href: m.href, live: Boolean(r.data) }))
            .catch(() => ({ href: m.href, live: false })),
        ),
      );
      const liveByHref: Record<string, boolean> = {};
      for (const r of results) liveByHref[r.href] = r.live;
      const wx = await getWeather(21.5, 79.0, ctrl.signal).catch(
        () => ({ data: null as never, state: 'OFFLINE' as const, source: '', updatedAt: null }),
      );
      if (dead) return;
      for (const m of MODULES) {
        if (m.kind === 'probe') next[m.href] = liveByHref[m.href] ? 'LIVE' : 'OFFLINE';
        else if (m.kind === 'weather') next[m.href] = (wx as { state?: string }).state ?? 'OFFLINE';
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
