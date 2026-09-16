'use client';
/** Provenance UI: every important value shows SOURCE / UPDATED / STATUS. */
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import CinematicShell from '@/components/cinematic/CinematicShell';
import type { DataStatus } from './api';

const COLORS: Record<string, string> = {
  LIVE: '#34d399', MODEL: '#34d399', FORECAST: '#00d2ff', EXTERNAL: '#00d2ff',
  DEMO: '#fbbf24', SIMULATION: '#fbbf24', MIXED: '#fbbf24',
  OFFLINE: '#64748b', STALE: '#fb923c', NOT_CONFIGURED: '#fb923c',
  NOT_AVAILABLE: '#64748b',
};

export function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const c = COLORS[status] ?? '#7d93a8';
  return (
    <span
      style={{
        fontSize: small ? 9 : 10, fontWeight: 800, letterSpacing: '0.1em',
        color: c, border: `1px solid ${c}88`, background: `${c}14`,
        borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

export function Provenance({ source, updated, status }: { source?: string; updated?: string; status?: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 11, color: '#7d93a8', marginTop: 8 }}>
      <span>SOURCE: <b style={{ color: '#cbd5e1' }}>{source ?? '—'}</b></span>
      {updated && <span>UPDATED: <b style={{ color: '#cbd5e1' }}>{updated}</b></span>}
      {status && <span>STATUS: <StatusBadge status={status} small /></span>}
    </div>
  );
}

export function ModuleShell({ title, sub, status, source, children, right }: {
  title: string; sub?: string; status?: string; source?: string;
  children: React.ReactNode; right?: React.ReactNode;
}) {
  return (
    <CinematicShell intensity={0.5} label={title}>
      <Navbar wsConnected={false} />
      <main className="min-h-screen text-slate-200 font-mono">
      <div className="p-4 max-w-5xl mx-auto flex flex-col gap-3 pb-20">
        <div className="dx-hud">
          <div className="dx-hud-edge" />
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div className="dx-micro">DRISHTI-X INTELLIGENCE</div>
              <h1 className="text-xl font-extrabold text-white">{title}</h1>
              {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {status && <StatusBadge status={status} />}
              {right}
            </div>
          </div>
          {(source || status) && <Provenance source={source} status={status} updated={new Date().toLocaleString()} />}
        </div>
        {children}
      </div>
      </main>
    </CinematicShell>
  );
}

export function WhyList({ items }: { items: { label: string; pct?: number }[] }) {
  return (
    <ul style={{ listStyle: 'none', margin: '8px 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
      {items.map((w) => (
        <li key={w.label} style={{ fontSize: 12, background: 'rgba(2,11,20,.6)', border: '1px solid #1b314b', borderRadius: 7, padding: '5px 9px', color: '#cbd5e1' }}>
          {w.label}{w.pct !== undefined && <b style={{ float: 'right' }}>{w.pct}%</b>}
        </li>
      ))}
    </ul>
  );
}
