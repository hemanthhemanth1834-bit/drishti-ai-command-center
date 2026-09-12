// Public Safety Dashboard — answers: AM I SAFE? WHAT SHOULD I DO? WHERE DO I GO?
'use client';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import RiskChecker from '@/components/RiskChecker';
import TrustBadge from '@/components/TrustBadge';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { useT } from '@/i18n/dict';
import { DEMO_HAZARDS, RISK_META, type HazardType, type RiskLevel } from '@/data/providers';
import { HeartPulse, ChevronDown } from 'lucide-react';

const TYPES: { type: HazardType; emoji: string; title: string }[] = [
  { type: 'flood', emoji: '🌊', title: 'Flood' },
  { type: 'cyclone', emoji: '🌀', title: 'Cyclone' },
  { type: 'earthquake', emoji: '🏚️', title: 'Earthquake' },
  { type: 'fire', emoji: '🔥', title: 'Fire' },
  { type: 'landslide', emoji: '⛰️', title: 'Landslide' },
  { type: 'heat', emoji: '🌡️', title: 'Extreme Heat' },
  { type: 'lightning', emoji: '⚡', title: 'Lightning' },
  { type: 'industrial', emoji: '🏭', title: 'Industrial Risk' },
];

const ADVICE: Record<RiskLevel, string> = {
  low: 'Continue normal activities.',
  moderate: 'Stay alert and avoid the marked zone.',
  high: 'Prepare for evacuation. Keep documents ready.',
  critical: 'Evacuate now via your safe route. Call 112.',
};

const PHASES = [
  { id: 'before', label: 'BEFORE DISASTER', links: [['/risk', 'Risk forecast'], ['/plan', 'Emergency plan'], ['/kit', 'Emergency kit'], ['/family', 'Family safety'], ['/nearby', 'Shelters']] },
  { id: 'during', label: 'DURING DISASTER', links: [['/alerts', 'Live alerts'], ['/emergency', 'Emergency mode'], ['/evacuate', 'Evacuation'], ['/nearby', 'Hospitals'], ['/report', 'Citizen reports']] },
  { id: 'after', label: 'AFTER DISASTER', links: [['/report', 'Damage reporting'], ['/nearby', 'Relief centers'], ['/reunion', 'Missing persons'], ['/recovery', 'Recovery & aid']] },
] as const;

export default function SafetyPage() {
  const { connected } = useTelemetrySocket();
  const tr = useT();
  const [phase, setPhase] = useState<(typeof PHASES)[number]['id']>('before');
  const [open, setOpen] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="p-4 max-w-6xl mx-auto flex flex-col gap-4">
        <section className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-emerald-400" />
          <h1 className="text-xl font-extrabold text-white">MY SAFETY</h1>
          <TrustBadge kind="SIMULATION" source="demo hazard cells" />
        </section>

        <RiskChecker />

        <section>
          <h2 className="text-sm font-bold text-white">HAZARD CARDS</h2>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {TYPES.map((t) => {
              const z = DEMO_HAZARDS.find((h) => h.type === t.type);
              const level: RiskLevel = z?.level ?? 'low';
              const meta = RISK_META[level];
              const expanded = open === t.type;
              return (
                <div key={t.type} className={`p-3 rounded-xl border ${meta.bg}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{t.emoji}</span>
                    <span className={`font-extrabold ${meta.color}`}>{tr(`risk_${level}`)}</span>
                  </div>
                  <div className="text-sm font-bold text-white mt-1">{t.title.toUpperCase()}</div>
                  <div className="text-[12px] text-slate-300 mt-1">
                    {z?.note ?? 'No immediate simulated threat detected.'}
                  </div>
                  <div className="text-[12px] mt-1">
                    <span className="text-slate-500">{tr('risk_action')}: </span>
                    <span className="text-slate-100">{ADVICE[level]}</span>
                  </div>
                  <button
                    onClick={() => setOpen(expanded ? null : t.type)}
                    className="mt-1 text-[11px] text-[#00d2ff] flex items-center gap-1"
                    aria-expanded={expanded}
                  >
                    WHY? <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                  {expanded && z && (
                    <div className="mt-1 text-[11px] text-slate-400">
                      <ul className="list-disc ml-4">
                        {z.factors.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                      <div className="mt-1">Confidence (model estimate): {z.confidence}%</div>
                      <div className="mt-1">
                        <TrustBadge kind={z.source} updated={z.updated} confidence={z.confidence} />
                      </div>
                    </div>
                  )}
                  {level === 'high' || level === 'critical' ? (
                    <Link
                      href="/evacuate"
                      className="mt-2 block text-center py-1.5 rounded bg-[#00d2ff] text-black text-xs font-bold"
                    >
                      VIEW SAFE ROUTE
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
          <div className="flex gap-2 flex-wrap">
            {PHASES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPhase(p.id)}
                className={`px-3 py-1.5 rounded text-xs font-bold border ${
                  phase === p.id
                    ? 'bg-[#00d2ff] text-black border-[#00d2ff]'
                    : 'bg-[#091a2e] text-slate-300 border-[#1b314b]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(PHASES.find((p) => p.id === phase)?.links ?? []).map(([href, label]) => (
              <Link
                key={href + label}
                href={href}
                className="p-3 rounded-lg bg-[#091a2e] border border-[#1b314b] text-center text-xs text-slate-100 hover:border-[#00d2ff]/60"
              >
                {label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
