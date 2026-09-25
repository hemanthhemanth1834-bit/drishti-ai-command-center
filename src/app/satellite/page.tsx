'use client';
import dynamic from 'next/dynamic';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import { usePlatform } from '@/platform/usePlatform';
import VizFigure from '@/platform/VizFigure';
import DisasterImage from '@/components/visuals/DisasterImage';
import LiveImagery from '@/components/live/LiveImagery';
import { imagesByCategory } from '@/config/imageSources';

const SatelliteViewer = dynamic(() => import('@/components/satellite/SatelliteViewer'), {
  ssr: false,
  loading: () => <p className="text-xs text-slate-400">Loading satellite viewer…</p>,
});
const FirePanel = dynamic(() => import('@/components/fire/FirePanel'), {
  ssr: false,
  loading: () => <p className="text-xs text-slate-400">Loading fire intelligence…</p>,
});

const ADAPTERS = [
  { name: 'Copernicus Sentinel-1 (SAR)', use: 'surface change, all-weather', status: 'NOT_CONFIGURED', note: 'Free account needed (COPERNICUS_USER)' },
  { name: 'Copernicus Sentinel-2 (MSI)', use: 'vegetation, land cover', status: 'NOT_CONFIGURED', note: 'Free account needed' },
  { name: 'NASA GIBS (visualisation)', use: 'context layers, keyless WMTS', status: 'EXTERNAL', note: 'Usable client-side now' },
  { name: 'NASA Earthdata (bulk)', use: 'IMERG/GPM download', status: 'NOT_CONFIGURED', note: 'Free login needed (EARTHDATA_TOKEN)' },
  { name: 'ISRO/Bhoonidhi', use: 'open data where available', status: 'NOT_CONFIGURED', note: 'Access varies by dataset' },
  { name: 'Demo observation', use: 'pipeline development', status: 'DEMO', note: 'Clearly simulated' },
];

export default function SatellitePage() {
  const obs = usePlatform<{ count: number; observations: { id: number; lat: number; lon: number; change_pct: number; source: string; captured_at: string }[] }>('/api/v1/satellite/observations?limit=10');
  return (
    <ModuleShell title="Satellite Intelligence" sub="Imagery → preprocessing → change detection → risk engine. Gallery images are NEVER live observations." status="DEMO" source="SIMULATED + open tiles">
      <LiveImagery />
      <SatelliteViewer />
      <FirePanel />
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">PROVIDER ADAPTERS</div>
        {ADAPTERS.map((a) => (
          <div key={a.name} className="text-xs py-1 border-b border-[#1b314b]">
            <div className="flex justify-between"><b className="text-white">{a.name}</b><StatusBadge status={a.status} small /></div>
            <div className="text-slate-400">{a.use} · {a.note}</div>
          </div>
        ))}
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">BEFORE → AFTER → CHANGE DETECTION (REFERENCE RENDERS, NOT LIVE TASKING)</div>
        <div className="nesafe-vizgrid mt-2">
          <VizFigure src="/img/sat-before.svg" alt="Reference satellite view before event, green terrain" caption="Before (reference)" status="DEMO" />
          <VizFigure src="/img/sat-after.svg" alt="Reference satellite view after event, disturbed terrain" caption="After (reference)" status="DEMO" />
          <VizFigure src="/img/sat-change.svg" alt="Reference change detection with highlighted disturbed area" caption="Change Δ (reference)" status="DEMO" />
        </div>
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">REGISTRY SOURCES (LIVE PROVIDERS + OUTBOUND REFERENCES)</div>
        <div className="nesafe-vizgrid mt-2">
          {imagesByCategory('satellite').map((e) => (
            <DisasterImage key={e.id} entry={e} />
          ))}
        </div>
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">STORED OBSERVATIONS ({obs.data?.count ?? '…'})</div>
        {(obs.data?.observations ?? []).map((o) => (
          <div key={o.id} className="text-xs py-1 border-b border-[#1b314b] flex justify-between">
            <span>#{o.id} · {o.lat.toFixed(2)},{o.lon.toFixed(2)} · Δ {o.change_pct}%</span>
            <span className="text-slate-400">{o.source} · {o.captured_at?.slice(0, 16)}</span>
          </div>
        ))}
        <p className="text-[11px] text-slate-400 mt-2">Change detection: GET /api/v1/satellite/change?lat=&lon= (needs ≥2 obs). Before/after visual compare lives in the NE-SAFE satellite tab.</p>
      </div>
    </ModuleShell>
  );
}
