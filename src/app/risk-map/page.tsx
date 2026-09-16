'use client';
import dynamic from 'next/dynamic';
import { ModuleShell } from '@/platform/provenance';

const RiskGridMap = dynamic(() => import('@/platform/RiskGridMap'), {
  ssr: false, loading: () => <p className="text-xs">Loading GIS…</p>,
});

export default function RiskMapPage() {
  return (
    <ModuleShell title="NER Risk Heatmap" sub="Spatial grid: rainfall · soil · terrain · history · AI probability · roads · villages · infrastructure" status="DEMO" source="Grid API + OSM tiles">
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <RiskGridMap />
        <p className="text-[11px] text-slate-400 mt-2">Tiles © OpenStreetMap contributors. Colors track live grid state (currently DEMO-driven). State/district filter: click cells; full admin filters in /admin roadmap.</p>
      </div>
    </ModuleShell>
  );
}
