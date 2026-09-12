'use client';
import { useEffect, useState } from 'react';
import { useOps, startDemo, demoStep, stopDemo, DEMO_META, DEMO_PHASES, DEMO_NARRATIVE, type DemoId } from '@/store/opsStore';
import TrustBadge from '@/components/TrustBadge';

/** Presentation console: pick a scenario, step or auto-play its 7 phases. */
export default function DemoConsole() {
  const ops = useOps();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || !ops.demo) return;
    if (ops.demo.phase >= DEMO_PHASES.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => demoStep(1), 4000);
    return () => clearTimeout(t);
  }, [playing, ops.demo]);

  useEffect(() => {
    if (!ops.demo) setPlaying(false);
  }, [ops.demo]);

  return (
    <div className="bg-[#051424] border border-rose-500/40 rounded-xl p-4">
      <div className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
        🎬 FULL DEMO SCENARIO <TrustBadge kind="DEMO" source="drives map · risk · alerts · dashboard" />
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(Object.keys(DEMO_META) as DemoId[]).map((id) => (
          <button
            key={id}
            onClick={() => {
              startDemo(id);
              setPlaying(false);
            }}
            className={`py-2.5 rounded-lg border text-xs font-bold ${
              ops.demo?.id === id
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-[#091a2e] text-slate-200 border-[#1b314b] hover:border-rose-500/60'
            }`}
          >
            {DEMO_META[id].emoji} {DEMO_META[id].label}
          </button>
        ))}
      </div>
      {ops.demo ? (
        <>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <button onClick={() => demoStep(-1)} className="px-3 py-1.5 rounded border border-[#1b314b] text-xs">
            ‹ BACK
          </button>
          <button onClick={() => demoStep(1)} className="px-3 py-1.5 rounded bg-rose-600 text-white text-xs font-bold">
            NEXT ›
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="px-3 py-1.5 rounded border border-[#00d2ff]/50 text-[#00d2ff] text-xs font-bold"
          >
            {playing ? '❚❚ PAUSE' : '▶ AUTO-PLAY'}
          </button>
          <button onClick={() => { stopDemo(); setPlaying(false); }} className="px-3 py-1.5 rounded border border-rose-500/60 text-rose-300 text-xs font-bold">
            END DEMO
          </button>
          <span className="text-[11px] text-slate-400">
            Phase {ops.demo.phase + 1}/{DEMO_PHASES.length} — {DEMO_PHASES[ops.demo.phase]}
          </span>
        </div>
        {ops.demo && (
          <div className="mt-2 text-[12px] text-rose-200/90 bg-[#140608] border border-rose-500/30 rounded-lg p-2">
            {DEMO_NARRATIVE[ops.demo.id][ops.demo.phase]}
          </div>
        )}
        </>
      ) : (
        <div className="mt-2 text-[11px] text-slate-500">
          Pick a scenario — map, risk, alerts, drones and both dashboards follow the phases.
        </div>
      )}
    </div>
  );
}
