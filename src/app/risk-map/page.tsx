'use client';
import dynamic from 'next/dynamic';
import { ModuleShell } from '@/platform/provenance';
import VizFigure from '@/platform/VizFigure';

const RiskGridMap = dynamic(() => import('@/platform/RiskGridMap'), {
  ssr: false, loading: () => <p className="text-xs">Loading GIS…</p>,
});

export default function RiskMapPage() {
  return (
    <ModuleShell title="NER Risk Heatmap" sub="Spatial grid: rainfall · soil · terrain · history · AI probability · roads · villages · infrastructure" status="DEMO" source="Grid API + OSM tiles">
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <RiskGridMap />
        <div className="dx-micro mt-3">CONTEXT REFERENCES (BELOW MAP — MAP STAYS PRIMARY)</div>
        <div className="nesafe-vizgrid mt-2">
          <VizFigure src="/img/terrain.svg" alt="Terrain contour and slope diagram" caption="Terrain preview" status="DEMO" />
          <VizFigure src="/img/dis-landslide.svg" alt="Landslide affecting a mountain road" caption="Landslide example" status="DEMO" />
          <VizFigure src="/img/sat-change.svg" alt="Reference change detection with highlighted disturbed area" caption="Satellite preview" status="DEMO" />
        </div>
        <p className="text-[11px] text-slate-400 mt-2">Tiles © OpenStreetMap contributors. Colors track live grid state (currently DEMO-driven). State/district filter: click cells; full admin filters in /admin roadmap.</p>
      </div>
    </ModuleShell>
  );
}
