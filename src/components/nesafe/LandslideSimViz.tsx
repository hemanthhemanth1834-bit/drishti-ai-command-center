'use client';
/** Optional visual landslide chain for a critical slope — clearly SIMULATED. */
import { useEffect, useState } from 'react';
import { selectedSim } from '@/nesafe/store/nesafeStore';

const STEPS = ['rainfall', 'water accumulation', 'soil saturation', 'ground movement', 'cracks', 'slope deformation', 'landslide simulation'];

export default function LandslideSimViz() {
  const [step, setStep] = useState(0);
  const [on, setOn] = useState(false);
  const sim = selectedSim();
  useEffect(() => {
    if (!on) return;
    if (step >= STEPS.length) return;
    const id = setTimeout(() => setStep((s) => s + 1), 900);
    return () => clearTimeout(id);
  }, [on, step]);
  return (
    <div className="nesafe-glass">
      <div className="nesafe-row" style={{ justifyContent: 'space-between' }}>
        <b>🌋 3D LANDSLIDE SIMULATION</b>
        <button onClick={() => { setOn(true); setStep(0); }}>PLAY CHAIN</button>
      </div>
      <p className="nesafe-note">SIMULATED HAZARD VISUALIZATION · does not predict exact failure time.</p>
      <div className="nesafe-chain">
        {STEPS.map((s, i) => (
          <span key={s} className={on && i < step ? 'hit' : ''} style={{ opacity: on && i < step ? 1 : 0.45 }}>
            {s}{i < STEPS.length - 1 ? ' ↓ ' : ''}
          </span>
        ))}
      </div>
      <div className="nesafe-slopebar">
        <i style={{ width: `${Math.min(100, on ? step * 15 : sim.risk)}%` }} />
      </div>
      {!on && <p className="nesafe-note">Open a critical slope, then play the chain. Terrain + risk react in demo feed.</p>}
    </div>
  );
}
