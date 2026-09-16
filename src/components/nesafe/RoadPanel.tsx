'use client';
/** 3D road intelligence + lower-hazard route alternatives (honest labels). */
import { useState } from 'react';
import { NE_ROADS } from '@/nesafe/data/northeast';
import { routeOptions } from '@/nesafe/utils/safeRoute';
import { useNESafe, selectedSim } from '@/nesafe/store/nesafeStore';
import ModeBadge from './ModeBadge';

const STC: Record<string, string> = { OPEN: '#34d399', CAUTION: '#fbbf24', 'HIGH RISK': '#fb923c', CLOSED: '#ff5470' };

export default function RoadPanel() {
  const { selectedSlopeId } = useNESafe();
  const sim = selectedSim();
  const [sel, setSel] = useState(NE_ROADS[0].id);
  const road = NE_ROADS.find((r) => r.id === sel) ?? NE_ROADS[0];
  const alts = routeOptions('Shillong', 'Dawki');
  return (
    <div className="nesafe-glass">
      <div className="nesafe-row" style={{ justifyContent: 'space-between' }}><b>🛣 3D ROAD INTELLIGENCE</b><ModeBadge /></div>
      <div className="nesafe-row" style={{ flexWrap: 'wrap' }}>
        {NE_ROADS.map((r) => (
          <button key={r.id} onClick={() => setSel(r.id)} className={r.id === sel ? 'nesafe-btn-on' : ''}>
            <i style={{ background: STC[r.status], width: 8, height: 8, borderRadius: 99, display: 'inline-block' }} /> {r.name}
          </button>
        ))}
      </div>
      <div className="nesafe-road-detail">
        <b>ROAD: {road.name}</b>
        <div>Current status: <b style={{ color: STC[road.status] }}>{road.status}</b> (demo)</div>
        <div>Nearby slope risk: <b>{sim.risk.toFixed(0)}/100</b></div>
        <div>Rainfall: <b>{sim.rainfallMmHr > 50 ? 'HIGH' : sim.rainfallMmHr > 20 ? 'MODERATE' : 'LOW'} (simulated)</b></div>
        <div>Recommended: <b>{sim.risk >= 60 ? 'Field inspection' : 'Routine patrol'}</b></div>
      </div>
      <b>🚗 ROUTE ALTERNATIVES · Shillong → Dawki</b>
      <div className="nesafe-routes">
        {alts.map((a) => (
          <div key={a.id} className={`nesafe-route nesafe-route-${a.color}`}>
            <b>{a.name}</b><span>{a.hazard}</span><small>ETA ~{a.etaMin} min (sim) · {a.note}</small>
          </div>
        ))}
      </div>
      <p className="nesafe-note">Selected slope: {selectedSlopeId} · dangerous sections pulse on the 3D terrain + MapLibre layer.</p>
    </div>
  );
}
