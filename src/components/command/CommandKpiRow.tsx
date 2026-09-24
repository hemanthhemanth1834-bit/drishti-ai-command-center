'use client';
/**
 * CommandKpiRow — real-data operational KPIs for the Command Center.
 *
 * Every card reads a production backend API first and degrades to a LABELED
 * DEMO/OFFLINE fallback. Nothing here is simulated as live:
 *   ACTIVE INCIDENTS  <- GET /api/v1/incidents?limit=100 (count + critical)
 *   RAINFALL 24H      <- GET /api/v1/rainfall/current (Krishna Basin)
 *   STATES REGISTRY   <- GET /api/regions/states (DB-driven geography)
 *   RESPONSE QUEUE    <- GET /api/v1/response/queue (P1-P4 triage depth)
 *   MODEL HEALTH      <- GET /api/v1/model-health (HEALTHY vs NOT AVAILABLE)
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { get } from '@/platform/api';
import { StatusBadge } from '@/platform/provenance';
import { DEMO_INCIDENTS } from '@/data/operational';

interface Card {
  label: string;
  value: string;
  sub: string;
  state: string;
  href: string;
  accent: string;
}

const FALLBACK: Card[] = [
  {
    label: 'Active Incidents', value: String(DEMO_INCIDENTS.length), sub: 'DEMO registry rows',
    state: 'DEMO', href: '/incidents', accent: '#00d2ff',
  },
  {
    label: 'Critical Incidents',
    value: String(DEMO_INCIDENTS.filter((d) => d.severity === 'CRITICAL').length),
    sub: 'DEMO registry rows', state: 'DEMO', href: '/incidents', accent: '#ff5470',
  },
  {
    label: 'Rainfall 24h · Basin', value: '—', sub: 'backend unreachable',
    state: 'OFFLINE', href: '/weather', accent: '#38bdf8',
  },
  {
    label: 'States in Registry', value: '—', sub: 'backend unreachable',
    state: 'OFFLINE', href: '/regions', accent: '#34d399',
  },
  {
    label: 'Response Queue', value: '—', sub: 'backend unreachable',
    state: 'OFFLINE', href: '/response', accent: '#fbbf24',
  },
  {
    label: 'Model Health', value: '—', sub: 'backend unreachable',
    state: 'OFFLINE', href: '/model-health', accent: '#a78bfa',
  },
];

interface IncidentRow { severity?: string }
interface RainfallResp { rain_24h_mm?: number | null; source?: string; data_status?: string }
interface StatesResp { states?: unknown[]; count?: number }
interface QueueResp { count?: number }
interface ModelResp { status?: string; model_version?: string; data_kind?: string }

export default function CommandKpiRow() {
  const [cards, setCards] = useState<Card[]>(FALLBACK);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let dead = false;
    const ctrl = new AbortController();
    (async () => {
      const [inc, rain, states, queue, model] = await Promise.all([
        get<{ count?: number; incidents?: IncidentRow[] }>('/api/v1/incidents?limit=100'),
        get<RainfallResp>('/api/v1/rainfall/current?lat=17.38&lon=78.48'),
        get<StatesResp>('/api/regions/states?country=IN'),
        get<QueueResp>('/api/v1/response/queue'),
        get<ModelResp>('/api/v1/model-health'),
      ]);
      if (dead) return;
      const next: Card[] = [...FALLBACK];
      if (inc.data) {
        const rows = inc.data.incidents ?? [];
        const crit = rows.filter(
          (r) => String(r.severity ?? '').toLowerCase() === 'critical',
        ).length;
        next[0] = {
          label: 'Active Incidents', value: String(inc.data.count ?? rows.length),
          sub: 'LIVE incident registry', state: 'LIVE', href: '/incidents', accent: '#00d2ff',
        };
        next[1] = {
          label: 'Critical Incidents', value: String(crit),
          sub: 'severity = critical', state: 'LIVE', href: '/incidents', accent: '#ff5470',
        };
      }
      if (rain.data) {
        next[2] = {
          label: 'Rainfall 24h · Basin',
          value: rain.data.rain_24h_mm != null ? `${rain.data.rain_24h_mm}mm` : '—',
          sub: String(rain.data.source ?? 'rainfall API'),
          state: String(rain.data.data_status ?? 'LIVE'),
          href: '/weather', accent: '#38bdf8',
        };
      }
      if (states.data) {
        const n = states.data.count ?? states.data.states?.length ?? 0;
        next[3] = {
          label: 'States in Registry', value: String(n),
          sub: 'DB-driven geography', state: 'LIVE', href: '/regions', accent: '#34d399',
        };
      }
      if (queue.data) {
        next[4] = {
          label: 'Response Queue', value: String(queue.data.count ?? 0),
          sub: 'P1–P4 triage depth', state: 'LIVE', href: '/response', accent: '#fbbf24',
        };
      }
      if (model.data) {
        next[5] = {
          label: 'Model Health', value: String(model.data.status ?? 'UNKNOWN'),
          sub: `${model.data.model_version ?? 'no version'} · ${model.data.data_kind ?? ''}`.trim(),
          state: model.data.status === 'HEALTHY' ? 'MODEL' : 'NOT_AVAILABLE',
          href: '/model-health', accent: '#a78bfa',
        };
      }
      setCards(next);
      setLive(Boolean(inc.data || rain.data || states.data || queue.data || model.data));
    })();
    return () => { dead = true; ctrl.abort(); };
  }, []);

  return (
    <section className="px-4 py-2.5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3" aria-label="Operational key metrics">
      {cards.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          className="dx-kpi dx-touch bg-[#091a2e]/85 backdrop-blur p-2 rounded border border-[#1b314b] hover:border-[#00d2ff]/50 transition-colors min-w-0"
        >
          <div className="text-[10px] text-slate-400 uppercase truncate">{c.label}</div>
          <div className="text-xl font-bold tnum truncate" style={{ color: c.accent }}>
            {c.value}
          </div>
          <div className="mt-1 flex items-center gap-1.5 min-w-0">
            <StatusBadge status={c.state} small />
            <span className="text-[10px] text-slate-500 truncate" title={c.sub}>{c.sub}</span>
          </div>
        </Link>
      ))}
      <span className="sr-only" role="status">
        {live ? 'Key metrics live from production backend.' : 'Key metrics showing labeled fallback.'}
      </span>
    </section>
  );
}
