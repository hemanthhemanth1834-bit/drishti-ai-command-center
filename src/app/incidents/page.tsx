'use client';
import { useState } from 'react';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import { usePlatform } from '@/platform/usePlatform';
import { API_BASE } from '@/platform/api';

const TYPES = ['crack', 'slope_movement', 'landslide', 'road_blockage', 'flood', 'bridge_damage', 'other'];

export default function IncidentsPage() {
  const li = usePlatform<{ count: number; incidents: { id: string; type: string; severity: string; description: string; lat: number; lon: number; reporter: string; ai_suggestion: string; verified: boolean }[] }>('/api/v1/incidents?limit=30');
  const [f, setF] = useState({ lat: '25.57', lon: '91.89', type: 'crack', severity: 'moderate', description: '' });
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState('');
  const key = (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_GATEWAY_KEY as string)) || '';

  const submit = async () => {
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.append(k === 'type' ? 'incident_type' : k, v));
    if (file) fd.append('media', file);
    try {
      const r = await fetch(`${API_BASE}/api/v1/incidents`, { method: 'POST', headers: key ? { Authorization: `Bearer ${key}` } : {}, body: fd });
      const j = await r.json();
      setMsg(r.ok ? `Filed ${j.id} (UNVERIFIED) · AI: ${(j.ai_suggestion ?? []).join(' ') || '—'}` : `Rejected: ${j.detail ?? r.status}`);
      li.reload();
    } catch { setMsg('Backend unreachable — use Offline PWA queue instead.'); }
  };

  return (
    <ModuleShell title="Field Incidents" sub="Photo/video + GPS + type + severity → image analysis → DB → risk map → authority alert" status="LIVE" source="Incident API + offline queue">
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">NEW REPORT (PHOTO ≤15MB: jpg/png/webp · VIDEO: mp4/webm)</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2">
          <label>Lat <input value={f.lat} onChange={(e) => setF({ ...f, lat: e.target.value })} className="w-full bg-[#051424] border border-[#1b314b] rounded px-2 py-1" /></label>
          <label>Lon <input value={f.lon} onChange={(e) => setF({ ...f, lon: e.target.value })} className="w-full bg-[#051424] border border-[#1b314b] rounded px-2 py-1" /></label>
          <label>Type <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className="w-full bg-[#051424] border border-[#1b314b] rounded px-2 py-1">{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label>Severity <select value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value })} className="w-full bg-[#051424] border border-[#1b314b] rounded px-2 py-1">{['low', 'moderate', 'high', 'critical'].map((t) => <option key={t}>{t}</option>)}</select></label>
        </div>
        <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="description" className="w-full bg-[#051424] border border-[#1b314b] rounded px-2 py-1 text-xs mt-2" />
        <input type="file" accept="image/*,video/*" className="text-xs mt-2" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button onClick={submit} className="bg-[#00d2ff] text-black font-bold rounded px-3 py-1 text-xs mt-2">SUBMIT REPORT</button>
        {msg && <p className="text-xs mt-1">{msg}</p>}
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">QUEUE ({li.data?.count ?? '…'}) — UNVERIFIED UNTIL HUMAN REVIEW</div>
        {(li.data?.incidents ?? []).map((r) => (
          <div key={r.id} className="text-xs py-1 border-b border-[#1b314b] flex justify-between gap-2">
            <span>{r.id} · {r.type} · {r.severity} · {r.lat.toFixed(2)},{r.lon.toFixed(2)} · {r.ai_suggestion || 'no AI hint'}</span>
            <StatusBadge status={r.verified ? 'LIVE' : 'STALE'} small />
          </div>
        ))}
      </div>
    </ModuleShell>
  );
}
