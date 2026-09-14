// CHECK MY RISK — cinematic AI risk command: GPS/manual check + 3D-style visualization.
// Existing RiskChecker logic is preserved untouched; RiskVisualizer renders alongside.
'use client';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import RiskChecker, { type RiskPlace } from '@/components/RiskChecker';
import CinematicShell from '@/components/cinematic/CinematicShell';
import HudPanel from '@/components/cinematic/HudPanel';
import RiskVisualizer from '@/components/cinematic/RiskVisualizer';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { useIntel, toneForScore } from '@/store/intelStore';
import { Crosshair } from 'lucide-react';

export default function RiskPage() {
  const { connected } = useTelemetrySocket();
  const [place, setPlace] = useState<RiskPlace | null>(null);
  // Shared truth (V3): SOS anywhere turns this view's globe red; a completed
  // check tints it to the same tone COMMAND shows. No local tone duplicate.
  const intel = useIntel();
  const sosActive = intel.sos.phase !== 'idle';
  const shellTone = sosActive ? 'critical' : intel.risk ? toneForScore(intel.risk.score) : 'ok';
  const shellFocus = sosActive ? 'sos' : intel.risk ? 'risk' : null;

  return (
    <CinematicShell intensity={0.7} label="DRISHTI-X risk intelligence" tone={shellTone} focusKind={shellFocus}>
      <main className="min-h-screen text-slate-200 font-mono">
        <Navbar wsConnected={connected} />
        <div className="p-4 max-w-3xl mx-auto flex flex-col gap-3 pb-10">
          {sosActive && (
            <div className="dx-shared-sos" role="alert">
              <span className="dx-sos-live">◉ SOS {intel.sos.phase.toUpperCase()}</span>
              <span>
                Emergency in progress — risk data below stays available.
                {' '}<Link href="/emergency" className="dx-shared-link">OPEN SOS COMMAND →</Link>
              </span>
            </div>
          )}
          <HudPanel
            micro="DRISHTI-X · RISK INTELLIGENCE"
            title="CHECK MY RISK"
            right={<span className="dx-sim">SIMULATION</span>}
          >
            <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-3">
              <Crosshair className="w-4 h-4 text-[#00d2ff] shrink-0" />
              <p>
                Uses your browser location <b>only after you tap the GPS button</b>. Nothing is
                uploaded — the check runs on your device against labeled demo hazard cells.
                Permission denied? Just search manually below.
              </p>
            </div>
            <RiskVisualizer place={place} />
          </HudPanel>

          <RiskChecker onPlace={setPlace} />

          <div className="flex gap-2 flex-wrap text-xs">
            <Link href="/safety" className="px-3 py-2 rounded border border-[#1b314b] text-slate-200 bg-[#051424]/80 backdrop-blur hover:border-[#00d2ff]/60">
              ← MY SAFETY DASHBOARD
            </Link>
            <Link href="/learn" className="px-3 py-2 rounded border border-[#1b314b] text-slate-200 bg-[#051424]/80 backdrop-blur hover:border-[#00d2ff]/60">
              LEARN WHAT TO DO
            </Link>
          </div>
        </div>
      </main>
    </CinematicShell>
  );
}
