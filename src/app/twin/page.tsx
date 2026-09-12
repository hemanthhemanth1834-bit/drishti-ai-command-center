// src/app/twin/page.tsx — 3D Digital Twin & Topography
'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/layout/Navbar';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import type { TwinEntity } from '@/components/3d/TwinViewport';
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

  const alt = live?.alt_m ?? 120;

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
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-8 bg-[#051424] border border-[#1b314b] rounded-xl overflow-hidden">
          <div className="bg-[#081b2e] px-4 py-2 border-b border-[#1b314b] flex items-center gap-2">
            <Box className="w-4 h-4 text-[#00d2ff]" />
            <span className="text-xs font-bold text-white tracking-wider">
              SPATIAL ELEVATION TWIN // DRONE ALT {alt.toFixed(1)}m • SURGE +{surgeM.toFixed(1)}m
            </span>
          </div>
          <div className="bg-black relative">
            <TwinViewport
              alt={alt}
              surgeM={surgeM}
              spotlight={spotlight}
              height={480}
              dropFlash={drops}
              batteryPct={live?.battery_pct ?? 100}
              signalPct={live?.signal_pct ?? 90}
              onSelect={setSelected}
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
          <div className="px-4 py-2 border-t border-[#1b314b] text-[11px] text-slate-400 flex items-center gap-2">
            <MousePointerClick className="w-3.5 h-3.5 text-[#00d2ff]" />
            Click a marker to pick an entity • drag-free orbit cam • fog depth 12–30u
          </div>
        </section>

        <section className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
              <Waves className="w-4 h-4 text-[#00d2ff]" /> HYDRAULIC SURGE PLANE
            </div>
            <label className="block mt-3 text-[11px] text-slate-400">
              WATER RISE: <span className="text-white font-bold">+{surgeM.toFixed(1)}m</span>
              <span className="text-slate-500"> (max +3.8m)</span>
            </label>
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
  );
}
