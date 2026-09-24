'use client';
/** Satellite BEFORE/AFTER/DEFORMATION comparison (simulated observation, honestly labeled). */
import { useState } from 'react';
import ModeBadge from './ModeBadge';
import { selectedSim } from '@/nesafe/store/nesafeStore';

export default function SatellitePanel() {
  const [tab, setTab] = useState<'BEFORE' | 'AFTER' | 'DEFORMATION'>('AFTER');
  const sim = selectedSim();
  const def = sim.satelliteDeformMm;
  return (
    <div className="nesafe-glass">
      <div className="nesafe-row" style={{ justifyContent: 'space-between' }}>
        <b>🛰 SATELLITE MONITORING</b><ModeBadge />
      </div>
      <p className="nesafe-note">SIMULATED SATELLITE OBSERVATION · pass DEMO-PASS-042 · deformation {def.toFixed(1)}mm feeds the AI risk engine.</p>
      <div className="nesafe-row">
        {(['BEFORE', 'AFTER', 'DEFORMATION'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`dx-touch ${tab === t ? 'nesafe-btn-on' : ''}`}>{t}</button>
        ))}
      </div>
      <div className={`nesafe-sat nesafe-sat-${tab.toLowerCase()}`} role="img" aria-label={`Simulated satellite ${tab} view`}>
        <div className="nesafe-sat-scan" />
        <span>SIMULATED · {tab}</span>
        {tab === 'DEFORMATION' && <b className="nesafe-deform">Δ {def.toFixed(1)}mm</b>}
      </div>
      <div className="nesafe-steps">
        <span>Satellite pass ↓</span><span>Image ↓</span><span>Terrain analysis ↓</span>
        <span>Change detection ↓</span><span>Deformation ↓</span><span>AI risk engine</span>
      </div>
    </div>
  );
}
