'use client';
/** Hackathon demo control panel — sliders + scenario playback + reset. */
import { DISASTER_SCRIPT } from '@/nesafe/engine/demoEngine';
import { resetNESim, setNESafe, useNESafe } from '@/nesafe/store/nesafeStore';

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="nesafe-slider">
      <span>{label} <b>{value}</b></span>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export default function DemoControlPanel() {
  const { controls, running, scenarioOn, scenarioSec } = useNESafe();
  const phase = [...DISASTER_SCRIPT].reverse().find((p) => scenarioSec >= p.atSec);
  return (
    <div className="nesafe-glass">
      <b>🎮 DEMO CONTROL PANEL</b>
      <Slider label="RAIN" value={controls.rain} onChange={(rain) => setNESafe({ controls: { ...controls, rain } })} />
      <Slider label="SOIL MOISTURE" value={controls.soil} onChange={(soil) => setNESafe({ controls: { ...controls, soil } })} />
      <Slider label="GROUND MOVEMENT" value={controls.movement} onChange={(movement) => setNESafe({ controls: { ...controls, movement } })} />
      <Slider label="SATELLITE DEFORMATION" value={controls.deformation} onChange={(deformation) => setNESafe({ controls: { ...controls, deformation } })} />
      <div className="nesafe-row" style={{ flexWrap: 'wrap' }}>
        <button onClick={() => setNESafe({ scenarioOn: true, scenarioSec: 0, running: true })}>▶ START SIMULATION</button>
        <button onClick={() => setNESafe({ running: !running })}>{running ? 'PAUSE' : 'SIMULATE'}</button>
        <button onClick={resetNESim}>RESET</button>
        <button onClick={() => setNESafe({ scenarioOn: !scenarioOn })}>{scenarioOn ? 'STOP SCRIPT' : 'SCRIPT: OFF'}</button>
      </div>
      {scenarioOn && <p className="nesafe-note">🎬 {String(Math.floor(scenarioSec / 60)).padStart(2, '0')}:{String(scenarioSec % 60).padStart(2, '0')} · {phase?.label} — 3D map, risk, alerts react live (demo).</p>}
      <details className="nesafe-script">
        <summary>Disaster script timeline</summary>
        <ul>{DISASTER_SCRIPT.map((p) => (<li key={p.atSec}>+{p.atSec}s — {p.label}</li>))}</ul>
      </details>
    </div>
  );
}
