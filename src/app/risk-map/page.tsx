'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import VizFigure from '@/platform/VizFigure';
import { get } from '@/platform/api';
import { BASE_LAYERS, EO_LAYERS, HISTORICAL_PRESETS, type Preset } from '@/platform/eoLayers';
import { googleStatus } from '@/platform/mapProvider';
import type { InspectPoint } from '@/platform/RiskGridMap';

const RiskGridMap = dynamic(() => import('@/platform/RiskGridMap'), {
  ssr: false, loading: () => <p className="text-xs">Loading GIS…</p>,
});
const DisasterMap = dynamic(() => import('@/components/map/DisasterMap'), {
  ssr: false, loading: () => <p className="text-xs">Loading operational overlay…</p>,
});

interface Cell {
  id: string; lat: number; lon: number; probability: number; risk_level: string;
  slope_deg: number; rainfall_24h: number; history_count: number;
  nearby_roads: number; nearby_places: number; simulated: boolean;
}

const GROUPS = ['Earth observation', 'Disaster', 'Environment', 'Infrastructure', 'Intelligence'] as const;

export default function RiskMapPage() {
  const [base, setBase] = useState('dark');
  const [eoOn, setEoOn] = useState<string[]>(['viirs-true', 'ai-risk', 'incidents']);
  const [compare, setCompare] = useState(0.85);
  const [preset, setPreset] = useState<Preset | null>(null);
  const [inspect, setInspect] = useState<InspectPoint | null>(null);
  const [liveLayers, setLiveLayers] = useState<Record<string, 'LIVE' | 'UNAVAILABLE'>>({});
  const [cells, setCells] = useState<Cell[]>([]);
  const [gridStatus, setGridStatus] = useState('DEMO');
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    get<{ cells: Cell[]; data_status: string }>('/api/v1/grid/risk-cells?step=1.0').then((r) => {
      if (r.data) { setCells(r.data.cells); setGridStatus(r.data.data_status); }
    });
  }, []);

  const toggle = (id: string) => setEoOn((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const onLayerStatus = (id: string, s: 'LIVE' | 'UNAVAILABLE') => setLiveLayers((p) => ({ ...p, [id]: s }));
  const statusOf = (id: string) => liveLayers[id] ?? EO_LAYERS.find((e) => e.id === id)?.status ?? 'DEMO';

  return (
    <ModuleShell title="Disaster Intelligence Map" sub="Live satellite + risk grid + incidents + infrastructure. Every layer shows measured status." status={online ? 'LIVE' : 'OFFLINE'} source="NASA GIBS · OpenStreetMap · DRISHTI-X grid API">
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <details className="lg:col-span-1 text-xs" open>
            <summary className="dx-micro cursor-pointer">LAYER CONTROL</summary>
            <div className="mt-2">
              <div className="dx-micro">BASE</div>
              <select value={base} onChange={(e) => setBase(e.target.value)} className="w-full bg-[#051424] border border-[#1b314b] rounded px-2 py-1 text-xs mt-1" aria-label="Base map">
                {BASE_LAYERS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">Google Maps: {googleStatus().status} — {googleStatus().detail}</p>
            </div>
            {GROUPS.map((g) => (
              <div key={g} className="mt-2">
                <div className="dx-micro">{g.toUpperCase()}</div>
                {EO_LAYERS.filter((e) => e.group === g).map((e) => (
                  <label key={e.id} className="flex items-start gap-2 py-1 text-slate-300" title={`${e.note}${e.fallback ? ` Fallback: ${e.fallback}` : ''}`}>
                    <input type="checkbox" checked={eoOn.includes(e.id)} disabled={e.kind === 'stub'} onChange={() => toggle(e.id)} className="mt-0.5" />
                    <span className={e.kind === 'stub' ? 'opacity-60' : ''}>
                      {e.name} <StatusBadge status={statusOf(e.id)} small />
                      <span className="block text-[10px] text-slate-500">{e.note}</span>
                    </span>
                  </label>
                ))}
              </div>
            ))}
            {eoOn.includes('modis-721') && (
              <div className="mt-2">
                <div className="dx-micro">COMPARE: 7-2-1 WATER VIEW OPACITY</div>
                <input type="range" min={0} max={1} step={0.05} value={compare} onChange={(e) => setCompare(Number(e.target.value))} className="w-full" aria-label="Water-view overlay opacity" />
              </div>
            )}
            <div className="mt-2">
              <div className="dx-micro">REGION PRESETS</div>
              {HISTORICAL_PRESETS.map((p) => (
                <button key={p.id} onClick={() => setPreset(p)} className="block text-left w-full text-[11px] text-[#7de9ff] hover:underline py-0.5">
                  {p.name}
                </button>
              ))}
              {preset && <p className="text-[10px] text-slate-500 mt-1">{preset.note}</p>}
            </div>
          </details>
          <div className="lg:col-span-3">
            <RiskGridMap base={base} eoOn={eoOn} compare={compare} preset={preset} cells={cells} gridStatus={gridStatus} onInspect={setInspect} onLayerStatus={onLayerStatus} />
            <div className="flex gap-4 flex-wrap text-xs text-slate-300 mt-2" aria-label="Legend">
              <span><i style={{ background: '#34d399' }} className="inline-block w-2.5 h-2.5" /> LOW</span>
              <span><i style={{ background: '#fbbf24' }} className="inline-block w-2.5 h-2.5" /> MODERATE</span>
              <span><i style={{ background: '#fb923c' }} className="inline-block w-2.5 h-2.5" /> HIGH</span>
              <span><i style={{ background: '#ff5470' }} className="inline-block w-2.5 h-2.5" /> CRITICAL</span>
              <span><i style={{ background: '#00d2ff' }} className="inline-block w-2.5 h-2.5 rounded-full" /> SENSOR</span>
              <span><i style={{ background: '#34d399' }} className="inline-block w-2.5 h-2.5 rounded-full" /> SHELTER</span>
              <span><i style={{ background: '#7de9ff' }} className="inline-block w-2.5 h-2.5" /> SATELLITE/EO</span>
              <span>STATUS: {gridStatus} · {cells.length} cells · {!online && 'OFFLINE — cached tiles only, nothing claimed live'}</span>
            </div>
          </div>
        </div>
      </div>

      {inspect && (
        <div className="dx-hud" role="dialog" aria-label="Satellite intelligence for selected point">
          <div className="dx-hud-edge" />
          <div className="dx-micro">SATELLITE INTELLIGENCE — CLICKED POINT</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2">
            <div>Location<br /><b className="text-white">{inspect.lat}, {inspect.lon}</b></div>
            <div>Source<br /><b className="text-white">{eoOn.includes('viirs-true') ? 'VIIRS SNPP True Color' : eoOn.includes('modis-true') ? 'MODIS Terra' : 'Base map only'}</b></div>
            <div>Acquired<br /><b className="text-white">{eoOn.some((id) => ['viirs-true', 'modis-true', 'modis-721'].includes(id)) ? 'Latest daily NRT composite' : '—'}</b></div>
            <div>Status<br /><StatusBadge status={eoOn.some((id) => liveLayers[id] === 'LIVE') ? 'LIVE' : !online ? 'OFFLINE' : 'DEMO'} /></div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Imagery: NASA Worldview/GIBS (daily, ~1-day latency). Analysis layers (risk/incidents) come from DRISHTI-X APIs with their own provenance.</p>
        </div>
      )}

      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">OPERATIONAL OVERLAY — RISK · EVACUATION · RESPONDERS · INFRA · SAT · WX · QUAKE · FIRE</div>
        <p className="text-[11px] text-slate-400 mt-1 mb-2">
          Unified 8-layer view with live USGS earthquakes and position preserved across refresh.
          Fire markers stay off until a FIRMS key is configured — hotspots are never synthesized.
        </p>
        <DisasterMap height={440} />
      </div>

      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">RECENT EARTH OBSERVATION (LIVE COMPOSITES, NOT ARCHIVE STILLS)</div>
        <div className="nesafe-vizgrid mt-2">
          <VizFigure src="/img/sat-before.svg" alt="Reference landscape before event, green terrain" caption="Landscape reference (render)" status="DEMO" />
          <VizFigure src="/img/sat-after.svg" alt="Reference landscape after event, disturbed terrain" caption="Change concept (render)" status="DEMO" />
          <VizFigure src="/img/sat-change.svg" alt="Reference change detection with highlighted disturbed area" caption="Detection concept (render)" status="DEMO" />
        </div>
        <p className="text-[11px] text-slate-400 mt-2">Tiles © OpenStreetMap contributors · CARTO · Esri/Maxar · OpenTopoMap · Imagery © NASA Worldview/GIBS. Colors track live grid state ({gridStatus}-driven).</p>
      </div>
    </ModuleShell>
  );
}
