'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ModuleShell } from '@/platform/provenance';
import { usePlatform } from '@/platform/usePlatform';
import VizFigure from '@/platform/VizFigure';

export default function TerrainPage() {
  const [lat, setLat] = useState(25.57);
  const [lon, setLon] = useState(91.89);
  const [q, setQ] = useState('25.57,91.89');
  const t = usePlatform<Record<string, number | string>>(`/api/v1/terrain/analyze?lat=${q.split(',')[0]}&lon=${q.split(',')[1]}`);
  const d = t.data;
  return (
    <ModuleShell title="Terrain Intelligence" sub="Elevation · slope · aspect · curvature · roughness · drainage · hill-cutting → ML + twin" status={String(d?.data_status ?? 'DEMO')} source={String(d?.source ?? 'Procedural DEM (demo)')}>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="flex gap-2 text-xs flex-wrap">
          <label>Lat <input type="number" step="0.01" value={lat} onChange={(e) => setLat(Number(e.target.value))} className="w-24 bg-[#051424] border border-[#1b314b] rounded px-2 py-1" /></label>
          <label>Lon <input type="number" step="0.01" value={lon} onChange={(e) => setLon(Number(e.target.value))} className="w-24 bg-[#051424] border border-[#1b314b] rounded px-2 py-1" /></label>
          <button onClick={() => setQ(`${lat},${lon}`)} className="bg-[#00d2ff] text-black font-bold rounded px-3">ANALYZE</button>
          <Link href="/twin" className="text-[#7de9ff] text-xs self-center">Open 3D Digital Twin →</Link>
        </div>
        {d && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2">
            {[['Elevation', `${d.elevation_m}m`], ['Slope', `${d.slope_deg}°`], ['Aspect', `${d.aspect_deg}°`], ['Curvature', d.curvature], ['Roughness', d.roughness], ['Drainage', d.drainage], ['Hill-cut', d.hill_cutting], ['Terrain risk', d.terrain_risk]].map(([l, v]) => (
              <div key={l as string} className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2">
                <div className="dx-micro">{l}</div>
                <div className="text-base font-bold text-white">{String(v)}</div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-slate-400 mt-2">Swap the procedural DEM for SRTM/Copernicus DEM without changing this API or UI. Twin params: GET /api/v1/terrain/twin-params.</p>
        <div className="mt-2"><VizFigure src="/img/terrain.svg" alt="Terrain contour and slope diagram" caption="Contour + slope schematic — not a DEM render" status="DEMO" /></div>
      </div>
    </ModuleShell>
  );
}
