'use client';
import { useState } from 'react';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import { usePlatform } from '@/platform/usePlatform';
import { API_BASE, hasKey } from '@/platform/api';
import VizFigure from '@/platform/VizFigure';

export default function HistoryPage() {
  const tr = usePlatform<{ yearly: Record<string, number>; by_severity: Record<string, number>; avg_rainfall_by_severity_mm: Record<string, number>; hotspots: unknown[]; data_status: string; note: string }>('/api/v1/history/trends');
  const li = usePlatform<{ count: number; incidents: { id: string; date: string; lat: number; lon: number; severity: string; source: string; verification: string }[] }>('/api/v1/history/incidents?limit=30');
  const [msg, setMsg] = useState('');
  const upload = async (f: File) => {
    const fd = new FormData();
    fd.append('file', f);
    try {
      const r = await fetch(`${API_BASE}/api/v1/history/import`, {
        method: 'POST', headers: hasKey() ? { Authorization: `Bearer ${(process.env.NEXT_PUBLIC_GATEWAY_KEY as string) ?? ''}` } : {},
        body: fd,
      });
      const j = await r.json();
      setMsg(r.ok ? `Imported ${j.imported} rows (verification: ${j.verification})` : `Rejected: ${j.detail ?? r.status}`);
    } catch { setMsg('Backend unreachable'); }
  };
  return (
    <ModuleShell title="Historical Landslide Database" sub="Schema + CSV ingest + trends. No verified statistics fabricated — seeds are DEMO." status={tr.data?.data_status ?? 'DEMO'} source="DB incidents (demo + imports)">
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">TRENDS</div>
        <div className="text-xs mt-1">Yearly: {JSON.stringify(tr.data?.yearly ?? {})}</div>
        <div className="text-xs">By severity: {JSON.stringify(tr.data?.by_severity ?? {})}</div>
        <div className="text-xs">Avg rainfall by severity: {JSON.stringify(tr.data?.avg_rainfall_by_severity_mm ?? {})}</div>
        <p className="text-[11px] text-slate-400 mt-1">{tr.data?.note}</p>
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">CSV IMPORT (VERIFIED DATASETS)</div>
        <input type="file" accept=".csv" className="text-xs mt-2" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
        {msg && <p className="text-xs mt-1">{msg}</p>}
        <p className="text-[11px] text-slate-400 mt-1">Schema: GET /api/v1/history/schema. Casualties: official figures only, else “unknown”.</p>
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">EVENT CONTEXT (ILLUSTRATIVE — NOT HISTORICAL EVIDENCE)</div>
        <div className="nesafe-vizgrid mt-2">
          <VizFigure src="/img/dis-flood.svg" alt="River flood over roads and houses" caption="Flood events" status="DEMO" />
          <VizFigure src="/img/dis-cyclone.svg" alt="Cyclone spiral over coastline" caption="Cyclone events" status="DEMO" />
          <VizFigure src="/img/dis-landslide.svg" alt="Landslide affecting a mountain road" caption="Landslide events" status="DEMO" />
        </div>
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">RECORDS ({li.data?.count ?? '…'})</div>
        {(li.data?.incidents ?? []).map((r) => (
          <div key={r.id} className="text-xs py-1 border-b border-[#1b314b] flex justify-between">
            <span>{r.date} · {r.lat.toFixed(2)},{r.lon.toFixed(2)} · {r.severity}</span>
            <span><StatusBadge status={r.verification === 'demo' ? 'DEMO' : 'EXTERNAL'} small /> {r.source}</span>
          </div>
        ))}
      </div>
    </ModuleShell>
  );
}
