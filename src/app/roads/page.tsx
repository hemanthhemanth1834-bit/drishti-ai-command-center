'use client';
import { useState } from 'react';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import { usePlatform } from '@/platform/usePlatform';
import { post } from '@/platform/api';

export default function RoadsPage() {
  const li = usePlatform<{ roads: { id: string; name: string; status: string; cause: string; alternate_route: string; bridge_status: string; eta_clearance_min: number }[] }>('/api/v1/roads');
  const [f, setF] = useState({ road_id: 'RD-01', status: 'BLOCKED', cause: 'debris' });
  const [msg, setMsg] = useState('');
  const [impact, setImpact] = useState<unknown>(null);

  const send = async () => {
    const r = await post('/api/v1/roads/blockage', f, true);
    setMsg(r.data ? `Updated ${(r.data as { status: string }).status}` : `Failed (${r.note ?? r.status}) — needs operator key`);
    li.reload();
  };
  const loadImpact = async (id: string) => {
    const { get } = await import('@/platform/api');
    setImpact((await get(`/api/v1/roads/${id}/impact`)).data);
  };

  return (
    <ModuleShell title="Road Intelligence" sub="OSM-linked registry · blockage reports · impact (villages + nearest units)" status="DEMO" source="Road registry (demo seed + field reports)">
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">SEGMENTS</div>
        {(li.data?.roads ?? []).map((r) => (
          <div key={r.id} className="text-xs py-1 border-b border-[#1b314b]">
            <div className="flex justify-between"><b className="text-white">{r.name}</b><StatusBadge status={r.status === 'OPEN' ? 'LIVE' : r.status === 'UNKNOWN' ? 'NOT_AVAILABLE' : 'SIMULATION'} small /></div>
            <div className="text-slate-400">{r.status} · cause: {r.cause || '—'} · alt: {r.alternate_route || '—'} · bridge: {r.bridge_status} · ETA {r.eta_clearance_min}min</div>
            <button onClick={() => loadImpact(r.id)} className="text-[#7de9ff] text-[11px]">impact analysis →</button>
          </div>
        ))}
        {impact !== null && <pre className="text-[10px] bg-black/40 rounded p-2 mt-1 overflow-auto max-h-40">{JSON.stringify(impact, null, 1)}</pre>}
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">REPORT BLOCKAGE (OPERATOR)</div>
        <div className="flex gap-2 text-xs mt-2 flex-wrap">
          <input value={f.road_id} onChange={(e) => setF({ ...f, road_id: e.target.value })} className="w-24 bg-[#051424] border border-[#1b314b] rounded px-2 py-1" />
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className="bg-[#051424] border border-[#1b314b] rounded px-2 py-1">{['OPEN', 'PARTIALLY_BLOCKED', 'BLOCKED', 'HIGH RISK', 'UNKNOWN'].map((s) => <option key={s}>{s}</option>)}</select>
          <input value={f.cause} onChange={(e) => setF({ ...f, cause: e.target.value })} placeholder="cause" className="bg-[#051424] border border-[#1b314b] rounded px-2 py-1" />
          <button onClick={send} className="bg-[#00d2ff] text-black font-bold rounded px-3">SEND</button>
        </div>
        {msg && <p className="text-xs mt-1">{msg}</p>}
      </div>
    </ModuleShell>
  );
}
