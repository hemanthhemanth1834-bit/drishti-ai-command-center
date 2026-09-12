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
          <div className="bg-black">
            <TwinViewport
              alt={alt}
              surgeM={surgeM}
              spotlight={spotlight}
              height={480}
              dropFlash={drops}
              onSelect={setSelected}
            />
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
