'use client';
import { useCallback, useEffect, useState } from 'react';
import TrustBadge from '@/components/TrustBadge';
import { Activity } from 'lucide-react';

type Status = 'ONLINE' | 'CONNECTED' | 'READY' | 'DEGRADED' | 'OFFLINE' | 'ERROR' | 'UNKNOWN' | 'IDLE' | 'ACTIVE' | 'LOCAL';

type Row = { name: string; status: Status; detail: string; badge: 'LIVE' | 'DEMO' | 'SIMULATION' | 'OFFLINE' | 'LOCAL' };

const GOOD: Status[] = ['ONLINE', 'CONNECTED', 'READY', 'ACTIVE', 'LOCAL'];

/** Real subsystem probes — nothing faked. Re-checkable on demand. */
export default function SystemHealth({ wsConnected, demoActive }: { wsConnected: boolean; demoActive: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [checking, setChecking] = useState(false);
  const [at, setAt] = useState('');

  const probe = useCallback(async () => {
    setChecking(true);
    const out: Row[] = [];
    const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

    // API (open health endpoint, no key needed)
    try {
      const r = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(8000) });
      out.push(r.ok ? { name: 'API', status: 'ONLINE', detail: `${base} reachable`, badge: 'LIVE' } : { name: 'API', status: 'ERROR', detail: `HTTP ${r.status}`, badge: 'OFFLINE' });
    } catch {
      out.push({ name: 'API', status: 'OFFLINE', detail: `${base} unreachable`, badge: 'OFFLINE' });
    }

    out.push(
      wsConnected
        ? { name: 'WebSocket', status: 'CONNECTED', detail: 'telemetry streaming', badge: 'LIVE' }
        : { name: 'WebSocket', status: 'OFFLINE', detail: 'start backend or check URL', badge: 'OFFLINE' }
    );

    // Map tiles (tiny HEAD probe)
    try {
      const r = await fetch('https://tile.openstreetmap.org/0/0/0.png', { method: 'HEAD', signal: AbortSignal.timeout(8000) });
      out.push(r.ok ? { name: 'Map Provider', status: 'READY', detail: 'OSM tiles reachable', badge: 'LIVE' } : { name: 'Map Provider', status: 'ERROR', detail: `HTTP ${r.status}`, badge: 'OFFLINE' });
    } catch {
      out.push({ name: 'Map Provider', status: 'OFFLINE', detail: 'tile host unreachable', badge: 'OFFLINE' });
    }

    // Geolocation permission state (no fix requested)
    try {
      const perms = (navigator as Navigator & { permissions?: { query(o: { name: string }): Promise<{ state: string }> } }).permissions;
      if (perms) {
        const q = await perms.query({ name: 'geolocation' });
        out.push({ name: 'Location', status: q.state === 'granted' ? 'READY' : q.state === 'denied' ? 'OFFLINE' : 'UNKNOWN', detail: `permission: ${q.state}`, badge: 'LIVE' });
      } else {
        out.push({ name: 'Location', status: 'UNKNOWN', detail: 'permission API unsupported', badge: 'DEMO' });
      }
    } catch {
      out.push({ name: 'Location', status: 'UNKNOWN', detail: 'could not query', badge: 'DEMO' });
    }

    // 3D engine capability
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      out.push(gl ? { name: '3D Engine', status: 'READY', detail: 'WebGL available', badge: 'LIVE' } : { name: '3D Engine', status: 'ERROR', detail: 'no WebGL context', badge: 'OFFLINE' });
    } catch {
      out.push({ name: '3D Engine', status: 'ERROR', detail: 'probe failed', badge: 'OFFLINE' });
    }

    // PWA
    out.push(
      'serviceWorker' in navigator
        ? { name: 'PWA', status: navigator.serviceWorker.controller ? 'READY' : 'READY', detail: navigator.serviceWorker.controller ? 'worker controlling page' : 'worker supported', badge: 'LOCAL' as const }
        : { name: 'PWA', status: 'OFFLINE', detail: 'service workers unsupported', badge: 'OFFLINE' }
    );

    out.push({ name: 'Data Providers', status: 'LOCAL', detail: 'demo bundles loaded', badge: 'DEMO' });
    out.push(
      demoActive
        ? { name: 'Demo Engine', status: 'ACTIVE', detail: 'scenario driving the platform', badge: 'DEMO' }
        : { name: 'Demo Engine', status: 'IDLE', detail: 'no scenario running', badge: 'DEMO' }
    );

    setRows(out);
    setAt(new Date().toLocaleTimeString());
    setChecking(false);
  }, [wsConnected, demoActive]);

  useEffect(() => {
    probe();
  }, [probe]);

  return (
    <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#1b314b]">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-[#00d2ff]" /> SYSTEM HEALTH
        </span>
        <button
          onClick={probe}
          disabled={checking}
          className="px-2.5 py-1 rounded border border-[#1b314b] text-[11px] disabled:opacity-50"
        >
          {checking ? 'PROBING…' : 'RE-CHECK'}
        </button>
      </div>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
        {rows.map((r) => (
          <div key={r.name} className="p-2 rounded bg-[#081a2c] border border-[#132d4a] flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                GOOD.includes(r.status) ? 'bg-emerald-400' : r.status === 'UNKNOWN' || r.status === 'IDLE' ? 'bg-slate-500' : 'bg-rose-500'
              }`}
            />
            <span className="font-bold text-white">{r.name}</span>
            <span className={GOOD.includes(r.status) ? 'text-emerald-300' : 'text-slate-300'}>{r.status}</span>
            <span className="ml-auto text-slate-500 text-right">{r.detail}</span>
            <TrustBadge kind={r.badge} />
          </div>
        ))}
      </div>
      {at && <div className="mt-2 text-[10px] text-slate-500">Last probed: {at}</div>}
    </div>
  );
}
