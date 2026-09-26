// src/app/twin/page.tsx — 3D Digital Twin & Topography
'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/layout/Navbar';
import CinematicShell from '@/components/cinematic/CinematicShell';
import StatusHeader from '@/components/cinematic/StatusHeader';
import FloodTimeline from '@/components/three/FloodTimeline';
import SceneShell from '@/components/3d/SceneShell';
import TwinControls from '@/components/twin/TwinControls';
import { activeLayers, getCamPreset, prefersReducedMotion, DEFAULT_HAZARDS, type HazardState } from '@/components/twin/twinLayers';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import type { TwinEntity, TerrainMode } from '@/components/3d/TwinViewport';
import { Box, Waves, Flashlight, MousePointerClick, Package } from 'lucide-react';

const TwinViewport = dynamic(() => import('@/components/3d/TwinViewport'), {
  ssr: false,
});

export default function TwinPage() {
  const { live, connected } = useTelemetrySocket();
  const [surgeM, setSurgeM] = useState(0);
  const [spotlight, setSpotlight] = useState(true);
  const [selected, setSelected] = useState<TwinEntity | null>(null);
  const [drops, setDrops] = useState(0);
  const [events, setEvents] = useState<string[]>([]);
  const [terrain, setTerrain] = useState<TerrainMode>('satellite');
  // STEP 30 — command-center layer/camera state (presentation only, SIMULATION)
  const [hazards, setHazards] = useState<HazardState>(DEFAULT_HAZARDS);
  const [corridor, setCorridor] = useState(true);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [motionOK, setMotionOK] = useState(true);

  useEffect(() => {
    setMotionOK(!prefersReducedMotion());
  }, []);

  const alt = live?.alt_m ?? 120;
  const tLat = live?.lat ?? 17.385;
  const tLon = live?.lon ?? 78.4867;

  function actuateDrop() {
    setDrops((d) => d + 1);
    const target = selected?.label ?? 'Ward 14 drop zone';
    setEvents((e) =>
      [
        `${new Date().toLocaleTimeString()} — AIR-DROP ACTUATED → ${target} (simulated)`,
        ...e,
      ].slice(0, 8)
    );
  }

  return (
    <CinematicShell intensity={0.65} label="3D digital twin">
    <main className="min-h-screen text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <StatusHeader wsConnected={connected} />
      <div className="px-4 pt-4">
        <FloodTimeline baseSurgeM={0} onChange={(_h, w) => setSurgeM(Math.round(w * 10) / 10)} />
      </div>
      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-8 bg-[#051424] border border-[#1b314b] rounded-xl overflow-hidden">
          <div className="bg-[#081b2e] px-4 py-2 border-b border-[#1b314b] flex items-center gap-2">
            <Box className="w-4 h-4 text-[#00d2ff]" />
            <span className="text-xs font-bold text-white tracking-wider">
              SPATIAL ELEVATION TWIN // DRONE ALT {alt.toFixed(1)}m • SURGE +{surgeM.toFixed(1)}m
            </span>
            <span className="ml-auto flex items-center gap-1 bg-[#020b14] p-0.5 rounded border border-[#1b314b]">
              {(['satellite', 'grid'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setTerrain(m)}
                  className={`px-2.5 py-0.5 text-[10px] rounded transition-all ${
                    terrain === m ? 'bg-[#00d2ff] text-black font-bold' : 'text-slate-400'
                  }`}
                >
                  {m === 'satellite' ? 'SATELLITE' : 'GRID'}
                </button>
              ))}
            </span>
          </div>
          <SceneShell label="3D elevation twin with drone, surge plane and telemetry" streams>
          <div className="bg-black relative">
            <TwinViewport
              alt={alt}
              surgeM={surgeM}
              spotlight={spotlight}
              height={480}
              dropFlash={drops}
              batteryPct={live?.battery_pct ?? 100}
              signalPct={live?.signal_pct ?? 90}
              terrain={terrain}
              mapLat={tLat}
              mapLon={tLon}
              onSelect={setSelected}
              hazards={hazards}
              corridor={corridor}
              camPreset={presetId ? { dist: getCamPreset(presetId).dist, focus: getCamPreset(presetId).focus } : null}
              motionOK={motionOK}
            />
            {/* Live telemetry HUD pinned inside the 3D viewport */}
            <div className="absolute top-3 right-3 w-52 bg-[#030d17]/85 backdrop-blur border border-[#00d2ff]/40 rounded-lg p-2.5 text-[10px] font-mono pointer-events-none">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#1b314b]">
                <span className="font-bold text-white">{live?.drone_id ?? 'ACQUIRING…'}</span>
                <span className="flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <span className={connected ? 'text-emerald-400' : 'text-rose-400'}>
                    {connected ? 'LIVE' : 'OFFLINE'}
                  </span>
                </span>
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-slate-300">
                <span className="text-slate-500">ALT</span>
                <span className="text-right text-white">{alt.toFixed(1)} m</span>
                <span className="text-slate-500">SPD</span>
                <span className="text-right text-white">{(live?.speed_ms ?? 0).toFixed(1)} m/s</span>
                <span className="text-slate-500">MODE</span>
                <span className="text-right text-[#00d2ff]">{live?.mode ?? '—'}</span>
                <span className="text-slate-500">TICK</span>
                <span className="text-right text-white">#{live?.tick ?? '—'}</span>
              </div>
              <div className="mt-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>BATT</span>
                  <span className="text-white">{(live?.battery_pct ?? 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 mt-0.5 rounded bg-[#091a2e]">
                  <div
                    className={`h-full rounded ${
                      (live?.battery_pct ?? 100) > 50
                        ? 'bg-emerald-400'
                        : (live?.battery_pct ?? 100) > 20
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, live?.battery_pct ?? 100))}%` }}
                  />
                </div>
              </div>
              <div className="mt-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>SIG</span>
                  <span className="text-white">{(live?.signal_pct ?? 0).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 mt-0.5 rounded bg-[#091a2e]">
                  <div
                    className="h-full rounded bg-[#00d2ff]"
                    style={{ width: `${Math.max(0, Math.min(100, live?.signal_pct ?? 0))}%` }}
                  />
                </div>
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-[#1b314b] text-slate-500">
                {(live?.lat ?? 0).toFixed(4)}°N, {(live?.lon ?? 0).toFixed(4)}°E
              </div>
            </div>
          </div>
          </SceneShell>
          <div className="px-4 py-2 border-t border-[#1b314b] text-[11px] text-slate-400 flex items-center gap-2 flex-wrap" role="status" aria-label="Active command layers">
            <MousePointerClick className="w-3.5 h-3.5 text-[#00d2ff]" />
            Click a marker to pick an entity • drag-free orbit cam • fog depth 12–30u
            <span className="ml-auto text-slate-500">
              LAYERS: {activeLayers(hazards, corridor).join(' + ') || 'NONE'} · VIEW: {presetId ? getCamPreset(presetId).label : 'FREE'} · {motionOK ? 'MOTION ON' : 'REDUCED MOTION'}
            </span>
          </div>
          <div className="px-4 py-2 border-t border-[#1b314b] text-[10px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
            <span className="font-bold text-slate-300">LEGEND:</span>
            {[
              ['#00d2ff', 'Drone'],
              ['#34d399', 'Boat'],
              ['#fbbf24', 'Ambulance'],
              ['#38bdf8', 'Hospital'],
              ['#a78bfa', 'Shelter'],
              ['#f59e0b', 'Bridge'],
              ['#ef4444', 'Fire tender'],
              ['#fb923c', 'Flood cell'],
              ['#f87171', 'Fire cell'],
            ].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />
                {l}
              </span>
            ))}
          </div>
        </section>

        <section className="lg:col-span-4 flex flex-col gap-4">
          <TwinControls
            hazards={hazards}
            onHazards={setHazards}
            corridor={corridor}
            onCorridor={setCorridor}
            presetId={presetId}
            onPreset={setPresetId}
          />
          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
              <Waves className="w-4 h-4 text-[#00d2ff]" /> HYDRAULIC SURGE PLANE
            </div>
            <label className="block mt-3 text-[11px] text-slate-400">
              WATER RISE: <span className="text-white font-bold">+{surgeM.toFixed(1)}m</span>
              <span className="text-slate-500"> (max +3.8m)</span>
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Disaster scenario presets (simulation)">
              {([
                ['Flood', 2.4], ['Storm', 1.8], ['Cyclone', 3.2], ['Landslide', 0.6], ['Fire', 0],
              ] as const).map(([label, surge]) => (
                <button
                  key={label}
                  onClick={() => {
                    setSurgeM(surge);
                    setEvents((e) => [`${new Date().toLocaleTimeString()} — SCENARIO ${label.toUpperCase()} loaded (SIMULATION, not a real event)`, ...e].slice(0, 8));
                  }}
                  className="px-2 py-1 rounded text-[10px] font-bold border border-[#1b314b] bg-[#091a2e] hover:border-[#00d2ff]/60 text-slate-200"
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={3.8}
              step={0.1}
              value={surgeM}
              onChange={(e) => setSurgeM(Number(e.target.value))}
              className="w-full mt-2 accent-cyan-400"
            />
            <button
              onClick={() => setSpotlight((s) => !s)}
              className="mt-3 w-full py-1.5 rounded text-xs font-bold border border-[#1b314b] bg-[#091a2e] hover:border-[#00d2ff]/60 flex items-center justify-center gap-1.5"
            >
              <Flashlight className="w-3.5 h-3.5 text-amber-300" />
              SPOTLIGHT CONE: {spotlight ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="text-xs font-bold text-white pb-3 border-b border-[#1b314b]">
              PICKED ENTITY
            </div>
            <div className="mt-2 text-xs">
              {selected ? (
                <div className="bg-[#091a2e] p-2.5 rounded border border-[#00d2ff]/40">
                  <div className="text-[#00d2ff] font-bold">{selected.label}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">kind: {selected.kind}</div>
                  {selected.risk && (
                    <div className="text-amber-300 text-[11px] mt-1">RISK: {selected.risk}</div>
                  )}
                  <div className="text-slate-500 text-[10px] mt-1">
                    SOURCE: SIMULATION · Twin markers · action: {selected.kind === 'hazard' ? 'avoid + report' : 'track + dispatch'}
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-[11px]">No entity selected — click a marker.</div>
              )}
            </div>
            <button
              onClick={actuateDrop}
              className="mt-3 w-full py-2 bg-[#00d2ff] hover:bg-[#00b0d6] text-black text-xs font-bold rounded flex items-center justify-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5" /> ACTUATE AIR-DROP
            </button>
          </div>

          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="text-xs font-bold text-white pb-2 border-b border-[#1b314b]">
              ACTUATOR EVENT LOG
            </div>
            <div className="mt-2 space-y-1 text-[11px] text-slate-300">
              {events.length === 0 && (
                <div className="text-slate-500">No actuations yet.</div>
              )}
              {events.map((e, i) => (
                <div key={i} className="p-1.5 rounded bg-[#081a2c] border border-[#132d4a]">
                  {e}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
    </CinematicShell>
  );
}
