// DEMO — presenter view: one screen to run the whole disaster story.
'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import TrustBadge from '@/components/TrustBadge';
import DemoConsole from '@/components/DemoConsole';
import MissionReplay from '@/components/MissionReplay';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { useOps, demoStep, DEMO_PHASES } from '@/store/opsStore';

const VIEWS = [
  { href: '/command', label: 'COMMAND DECK' },
  { href: '/safety', label: 'CITIZEN DASH' },
  { href: '/twin', label: '3D TWIN' },
  { href: '/drones', label: 'DRONE SAR' },
  { href: '/evacuate', label: 'EVACUATION' },
];

const STORY = [
  'Disaster occurs — scenario injects heavy rain over Vijayawada.',
  'DRISHTI-X detects it: telemetry degrades, spillway climbs.',
  'Risk increases: banner escalates, badge flips, maps light up.',
  'Citizens get alerts + safe routes with exposure analysis.',
  'Evacuation calculated: nearest ≤30 km shelters, safest pick starred.',
  'Drones fly SAR grid; twin tracks entities live.',
  'Hospitals + shelters coordinate bed and capacity drill data.',
  'Command tracks everything on KPIs; recovery begins.',
];

export default function DemoPage() {
  const { connected } = useTelemetrySocket();
  const ops = useOps();

  // Arrow keys step phases for slide-clicker-style presenting.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (!ops.demo) return;
      if (e.key === 'ArrowRight') demoStep(1);
      if (e.key === 'ArrowLeft') demoStep(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ops.demo]);

  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="p-4 max-w-6xl mx-auto flex flex-col gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-extrabold text-white">🎬 DEMO PRESENTER</h1>
          <TrustBadge kind="DEMO" source="presentation mode — nothing here is a real emergency" />
          {ops.demo && (
            <span className="text-[11px] text-rose-300">
              Phase {ops.demo.phase + 1}/{DEMO_PHASES.length} · {DEMO_PHASES[ops.demo.phase]}
            </span>
          )}
        </div>

        <DemoConsole />

        <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
          <div className="text-xs font-bold text-white pb-2">PROJECT THESE VIEWS (open on second screen)</div>
          <div className="mt-1 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {VIEWS.map((v) => (
              <a
                key={v.href}
                href={v.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg bg-[#091a2e] border border-[#1b314b] text-center text-xs font-bold text-slate-100 hover:border-[#00d2ff]/60"
              >
                {v.label} ↗
              </a>
            ))}
          </div>
        </div>

        <MissionReplay />

        <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
          <div className="text-xs font-bold text-white pb-2">60-SECOND JUDGE SCRIPT</div>
          <ol className="list-decimal ml-5 text-[12px] text-slate-300 space-y-1">
            {STORY.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <div className="mt-2 text-[11px] text-slate-500">
            Tip: ← → arrow keys step phases. Auto-play runs hands-free. END returns all pages to nominal.
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Prefer the poster first? <Link href="/welcome" className="text-[#00d2ff]">Open /welcome ↗</Link>
        </div>
      </div>
    </main>
  );
}
