'use client';
import { useOps, demoStep, stopDemo, DEMO_META, DEMO_PHASES } from '@/store/opsStore';

/** Persistent demo-scenario strip (mounted in layout; visible on every route while active). */
export default function DemoBar() {
  const ops = useOps();
  if (!ops.demo) return null;
  const meta = DEMO_META[ops.demo.id];
  const phaseName = DEMO_PHASES[ops.demo.phase];
  const last = ops.demo.phase === DEMO_PHASES.length - 1;

  return (
    <div
      role="status"
      className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-40 font-mono text-[11px] bg-[#140608]/95 border border-rose-500/50 rounded-xl px-3 py-2 flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.35)] max-w-[94vw]"
    >
      <span className="font-bold text-rose-300 whitespace-nowrap">
        {meta.emoji} DEMO: {meta.label}
      </span>
      <span className="text-slate-300 whitespace-nowrap">
        {ops.demo.phase + 1}/{DEMO_PHASES.length} · {phaseName}
      </span>
      <span className="hidden sm:flex gap-0.5" aria-hidden>
        {DEMO_PHASES.map((p, i) => (
          <span
            key={p}
            className={`w-1.5 h-1.5 rounded-full ${i <= ops.demo!.phase ? 'bg-rose-400' : 'bg-slate-700'}`}
          />
        ))}
      </span>
      <button
        onClick={() => demoStep(-1)}
        disabled={ops.demo.phase === 0}
        className="px-2 py-1 rounded border border-[#1b314b] text-slate-200 disabled:opacity-40"
        aria-label="Previous demo phase"
      >
        ‹
      </button>
      <button
        onClick={() => demoStep(1)}
        disabled={last}
        className="px-2 py-1 rounded bg-rose-600 text-white font-bold disabled:opacity-40"
        aria-label="Next demo phase"
      >
        ›
      </button>
      <button
        onClick={stopDemo}
        className="px-2 py-1 rounded border border-rose-500/60 text-rose-300 font-bold"
      >
        END
      </button>
    </div>
  );
}
