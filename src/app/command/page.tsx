// src/app/command/page.tsx — DRISHTI-X Master Command Center (cinematic upgrade)
'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import LocationContextBar from '@/components/location/LocationContextBar';
import GeofenceBreachModal from '@/components/alerts/GeofenceBreachModal';
import AlertBanner from '@/components/alerts/AlertBanner';
import { useOps, setOps, ackAlert } from '@/store/opsStore';
import { useIntel, pushEvent } from '@/store/intelStore';
import { evaluateAlerts, incidentLevel } from '@/utils/alertRules';
import { checkGeofenceBreach } from '@/utils/geofenceDetection';
import CinematicShell from '@/components/cinematic/CinematicShell';
import StatusHeader from '@/components/cinematic/StatusHeader';
import HudPanel from '@/components/cinematic/HudPanel';
import AiDecisionTimeline from '@/components/cinematic/AiDecisionTimeline';
import DemoMode from '@/components/cinematic/DemoMode';
import { Waveform } from '@/components/cinematic/AnimatedCounter';
import CommandKpiRow from '@/components/command/CommandKpiRow';
import ModuleStatusGrid from '@/components/command/ModuleStatusGrid';
import SoundToggle from '@/components/cinematic/SoundToggle';
import GeospatialIntelGallery from '@/components/cinematic/GeospatialIntelGallery';
import LiveStatusStrip from '@/components/command/LiveStatusStrip';
import SituationBrief from '@/components/intelligence/SituationBrief';
import LiveImagery from '@/components/live/LiveImagery';
import { Compass, Satellite } from 'lucide-react';

// Dynamic imports to prevent SSR window issues for Leaflet and Three.js
const DigitalTwinCanvas = dynamic(
  () => import('@/components/3d/DigitalTwinCanvas'),
  { ssr: false }
);
const AiCoreScene = dynamic(
  () => import('@/components/cinematic/AiCoreScene'),
  { ssr: false }
);
const DisasterGlobe = dynamic(
  () => import('@/components/3d/DisasterGlobe'),
  { ssr: false, loading: () => <p className="text-xs text-slate-400">Loading 3D globe…</p> }
);
const DisasterMap = dynamic(
  () => import('@/components/map/DisasterMap'),
  { ssr: false, loading: () => <p className="text-xs text-slate-400">Loading live map…</p> }
);

export default function MasterCommandCenter() {
  const ops = useOps();
  // Shared DRISHTI-X intelligence truth (V3): risk, SOS, focus, tone and
  // events are the same objects every route reads — one coherent system.
  const intel = useIntel();
  const aiTone = intel.aiTone;
  const [posterOk, setPosterOk] = useState(true);
  const [demoOpen, setDemoOpen] = useState(false);

  // Presentation Mode shortcut: P (guarded — never hijacks form fields).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName ?? "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable) return;
      if ((e.key === "p" || e.key === "P") && !e.metaKey && !e.ctrlKey && !e.altKey && !demoOpen) {
        e.preventDefault();
        setDemoOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [demoOpen]);

  const lat = 17.385;
  const lon = 78.4867;
  const alerts = evaluateAlerts({
    scenario: 'nominal',
    spillwayK: 0,
    geofenceBreach: false,
  });

  return (
    <CinematicShell label="DRISHTI-X command center" tone={aiTone} focusKind={intel.focus?.kind ?? null}>
      {demoOpen && <DemoMode onExit={() => setDemoOpen(false)} live={null} />}
      <main className="min-h-screen text-slate-200 flex flex-col font-mono">
        <Navbar incident={incidentLevel(alerts)} />
        <LocationContextBar />
        <GeofenceBreachModal lat={lat} lon={lon} />

        {/* Command status strip — live values flow into shared ticker */}
        <StatusHeader
          system="READY"
          network="PUBLIC DATA"
          aiConfidence={null}
          dronesActive={null}
          dataHz={null}
          wsConnected={false}
          riskScore={intel.riskCheckScore}
          alertCount={alerts.length}
          sosActive={intel.sos.phase !== 'idle'}
        />

        {/* Live feed status — honest LIVE/DEMO/OFFLINE per source */}
        <LiveStatusStrip />
        {/* Shared-intelligence banners: SOS + citizen risk-check follow the
            operator across routes — same state as /emergency and /risk. */}
        {intel.sos.phase !== 'idle' && (
          <div className="dx-shared-sos mx-4 mt-3" role="alert">
            <span className="dx-sos-live">◉ SOS {intel.sos.phase.toUpperCase()}</span>
            <span>
              Emergency beacon {intel.sos.phase === 'active' ? 'broadcasting' : 'locking'}
              {intel.sos.lat != null && intel.sos.lon != null
                ? ` — ${intel.sos.lat.toFixed(3)}°N ${intel.sos.lon.toFixed(3)}°E`
                : ''}
              {' · '}
              <Link href="/emergency" className="dx-shared-link">OPEN SOS COMMAND →</Link>
            </span>
          </div>
        )}
        {intel.risk && (
          <div className="dx-shared-risk mx-4 mt-3" role="status">
            <span className="dx-micro">SHARED RISK CHECK · LIVE FROM /RISK</span>
            <span className="dx-shared-risk-main">
              {intel.risk.placeName} → <b>{intel.risk.level.toUpperCase()}</b> ({intel.risk.score})
              {' · '}conf {intel.risk.confidence}%{' · '}
              <Link href="/risk" className="dx-shared-link">OPEN RISK →</Link>
            </span>
          </div>
        )}

        {/* Cinematic poster hero — official artwork, hides gracefully if missing */}
        {posterOk && (
          <section className="relative overflow-hidden border-b border-[#1b314b]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/poster.jpg"
              alt="DRISHTI-X — for a safer, stronger, resilient India"
              onError={() => setPosterOk(false)}
              className="w-full h-52 sm:h-72 object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020b14] via-[#020b14]/25 to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3 flex-wrap">
              <div className="pointer-events-none">
                <div className="text-lg sm:text-2xl font-black text-white tracking-wide drop-shadow-[0_0_12px_rgba(0,0,0,0.9)]">
                  DRISHTI-X <span className="text-[#00d2ff]">COMMAND CENTER</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-200 tracking-[0.2em] drop-shadow">
                  SEE EARLY • UNDERSTAND BETTER • ACT FASTER • SAVE LIVES
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/safety"
                  className="dx-touch px-4 py-2 rounded-lg bg-[#00d2ff] hover:bg-[#00b0d6] text-black text-xs font-extrabold"
                >
                  CHECK MY RISK
                </Link>
                <Link
                  href="/intelligence"
                  className="dx-touch px-4 py-2 rounded-lg bg-[#091a2e]/85 border border-[#00d2ff]/60 text-[#00d2ff] text-xs font-bold hover:bg-[#00d2ff]/10"
                >
                  OPEN INTELLIGENCE
                </Link>
                <Link
                  href="/welcome"
                  className="px-4 py-2 rounded-lg border border-[#00d2ff]/60 text-[#00d2ff] text-xs font-bold hover:bg-[#00d2ff]/10"
                >
                  FULL POSTER
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* KPI row — real production data first, labeled DEMO/OFFLINE fallback */}
        <CommandKpiRow />

        {/* Flood forecast strip */}
        <div className="px-4">
          </div>

        {/* Main Command Workstation */}
        <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Spatial Digital Twin & GPS Radar (7 Cols) */}
          <section className="lg:col-span-7 flex flex-col gap-3">
            <div className="bg-[#051424]/85 backdrop-blur border border-[#1b314b] rounded-xl overflow-hidden flex flex-col h-[520px]">
              {/* Viewport Header */}
              <div className="bg-[#081b2e]/90 px-4 py-2 border-b border-[#1b314b] flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#00d2ff]" />
                  <span className="text-xs font-bold text-white tracking-wider">
                    KRISHNA BASIN SECTOR 04 // {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="dx-present-btn"
                    onClick={() => setDemoOpen(true)}
                    className="dx-present-btn"
                    title="Start guided presentation (shortcut: P)"
                    aria-label="Start presentation mode"
                  >
                    ▶ PRESENT
                  </button>
                  <SoundToggle />
                </div>
              </div>
              {/* Viewport Body */}
              <div className="flex-1 relative bg-black min-h-0">
                <DigitalTwinCanvas alt={0} />
                <div className="absolute bottom-3 left-3 bg-[#030d17]/80 backdrop-blur border border-[#1b314b] p-2 rounded text-[11px] text-[#00d2ff] pointer-events-none">
                  <span>3D FLOOD SCENARIO · SIMULATION</span> • <span>NO LIVE TELEMETRY</span>
                </div>
              </div>
            </div>

            {/* Live rule-driven hazard banner */}
            <AlertBanner alerts={alerts} acked={ops.acked} onAck={ackAlert} />

            {/* Verified data status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <HudPanel micro="DATA STATUS" title="EARLY-WARNING INPUTS">
                <div className="space-y-2 text-[11px] text-slate-300">
                  <div className="p-2 rounded bg-[#081a2c] border border-[#132d4a]">WEATHER · Open-Meteo · LIVE when upstream is reachable</div>
                  <div className="p-2 rounded bg-[#081a2c] border border-[#132d4a]">SATELLITE · NASA GIBS context imagery · NOT an analysis observation</div>
                  <div className="p-2 rounded bg-[#081a2c] border border-[#132d4a]">RADAR · NOT CONNECTED · no synthetic radar field is generated</div>
                  <div className="p-2 rounded bg-[#081a2c] border border-[#132d4a]">NWP · NOT CONNECTED · no NWP fusion is claimed</div>
                </div>
              </HudPanel>
              <HudPanel micro="RESPONSE LEDGER" title="OPERATIONAL STATUS">
                <div className="text-[11px] text-slate-300 space-y-2">
                  <p>Alerts and response tools remain available for verified reports and live provider data.</p>
                  <p className="text-slate-500">No fabricated dispatch, drone, population, or sensor telemetry is shown.</p>
                </div>
              </HudPanel>
            </div>
          </section>

          {/* Right Column: Live Telemetry & AI Decision Recommendations (5 Cols) */}
          <section className="lg:col-span-5 flex flex-col gap-3">
            <HudPanel
              micro="PROVENANCE-FIRST INTELLIGENCE"
              title="FLOOD WARNING STATUS"
              tone={aiTone}
              right={<span className="text-[10px] bg-[#00d2ff]/20 text-[#00d2ff] px-2 py-0.5 rounded border border-[#00d2ff]/40">NO FABRICATED SCORE</span>}
            >
              <div className="space-y-3 text-xs text-slate-300">
                <p>DRISHTI-X only promotes a value to operational intelligence when its source and status are known.</p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="bg-[#091a2e] p-2.5 rounded border border-[#1b314b]">Rainfall: use the live provider status shown by the Weather/Rainfall modules.</div>
                  <div className="bg-[#091a2e] p-2.5 rounded border border-[#1b314b]">Inundation: modelled outputs must be labelled as modelled and uncalibrated until validated.</div>
                  <div className="bg-[#091a2e] p-2.5 rounded border border-[#1b314b]">Uncertainty: not claimed when calibration data is unavailable.</div>
                </div>
              </div>
            </HudPanel>

            {/* AI Decision Timeline (V3.1): live view of the shared event stream */}
            <AiDecisionTimeline />

            {/* AI situation brief: observed → analysis → recommendation */}
            <SituationBrief />

            {/* Module navigation with live per-module status */}
            <HudPanel micro="COMMAND MODULES" title="JUMP TO OPERATIONS">
              <ModuleStatusGrid />
            </HudPanel>
          </section>
        </div>

            {/* Live operational map — 6-layer DisasterMap (position preserved) */}
        <div className="px-4 pb-4">
          <div className="bg-[#051424]/80 border border-[#1b314b] rounded-xl p-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1b314b] mb-3">
              <Compass className="w-4 h-4 text-[#00d2ff]" />
              <span className="text-xs font-bold text-white tracking-wider">LIVE DISASTER MAP // RISK · EVACUATION · RESPONDERS · INFRA · SAT · WX</span>
              <span className="ml-auto text-[10px] text-slate-400">POSITION PRESERVED ACROSS REFRESH</span>
            </div>
            <DisasterMap height={460} />
          </div>
        </div>

        {/* Imagery wall + 3D globe */}
        <div className="px-4 pb-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
          <LiveImagery />
          <DisasterGlobe height={380} />
        </div>

        {/* Geospatial Intelligence Feeds — Real-World Visual Examples */}
        <div className="px-4 pb-6">
          <div className="bg-[#051424]/80 border border-[#1b314b] rounded-xl p-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1b314b] mb-4">
              <Satellite className="w-4 h-4 text-[#00d2ff]" />
              <span className="text-xs font-bold text-white tracking-wider">GEOSPATIAL INTELLIGENCE // EARTH OBSERVATION FEEDS</span>
              <span className="ml-auto text-[10px] text-slate-400">REAL-WORLD VERIFIED OPEN-SOURCE IMAGERY</span>
            </div>
            <GeospatialIntelGallery />
          </div>
        </div>
      </main>
    </CinematicShell>
  );
}
