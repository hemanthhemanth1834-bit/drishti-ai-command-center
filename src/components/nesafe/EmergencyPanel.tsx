'use client';
/** Emergency units animate along demo routes; incident card on click. */
import { useEffect, useState } from 'react';
import { selectedSim, useNESafe } from '@/nesafe/store/nesafeStore';
import { NE_SLOPES } from '@/nesafe/data/northeast';
import ModeBadge from './ModeBadge';

const UNITS = [
  { id: 'FIRE-1', icon: '🚒', label: 'Fire', off: 0 },
  { id: 'AMB-2', icon: '🚑', label: 'Ambulance', off: 0.25 },
  { id: 'POL-3', icon: '🚓', label: 'Police', off: 0.5 },
  { id: 'TEAM-4', icon: '👷', label: 'Response team', off: 0.7 },
  { id: 'DRN-5', icon: '🚁', label: 'Drone', off: 0.4 },
];

export default function EmergencyPanel() {
  const [t, setT] = useState(0);
  const [open, setOpen] = useState(false);
  const { selectedSlopeId } = useNESafe();
  const sim = selectedSim();
  const slope = NE_SLOPES.find((s) => s.id === selectedSlopeId)!;
  useEffect(() => {
    const id = setInterval(() => setT((v) => (v + 0.02) % 1), 120);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="nesafe-glass">
      <div className="nesafe-row" style={{ justifyContent: 'space-between' }}><b>🚑 EMERGENCY RESPONSE (demo movement)</b><ModeBadge /></div>
      <div className="nesafe-evac-road" onClick={() => setOpen((v) => !v)} role="button" tabIndex={0} aria-label="Open incident card">
        <div className="nesafe-evac-line" />
        {UNITS.map((u) => (
          <span key={u.id} className="nesafe-unit" style={{ left: `${((t + u.off) % 1) * 92}%` }} title={`${u.label} ${u.id}`}>{u.icon}</span>
        ))}
      </div>
      {open && (
        <div className="nesafe-incident">
          <b>INCIDENT #042 · CRITICAL (simulated)</b>
          <div>Risk: <b>{sim.risk.toFixed(0)}</b> · {slope.name}</div>
          <div>Population exposed: <b>{slope.populationExposed.toLocaleString()} (demo)</b></div>
          <div>Nearest team: <b>12 km</b> · ETA <b>24 min</b> (simulated)</div>
          <div>Status: <b className="nesafe-live-dot">TEAM DISPATCHED</b></div>
        </div>
      )}
      <p className="nesafe-note">Units move along roads in DEMO MODE. No real dispatch backend.</p>
    </div>
  );
}
