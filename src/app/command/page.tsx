// src/app/command/page.tsx — DRISHTI-X Master Command Center (cinematic upgrade)
'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import GeofenceBreachModal from '@/components/alerts/GeofenceBreachModal';
import AlertBanner from '@/components/alerts/AlertBanner';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { useOps, setOps, ackAlert } from '@/store/opsStore';
import { evaluateAlerts, incidentLevel } from '@/utils/alertRules';
import { checkGeofenceBreach } from '@/utils/geofenceDetection';
import { setScenario } from '@/utils/apiClient';
import CinematicShell from '@/components/cinematic/CinematicShell';
import StatusHeader from '@/components/cinematic/StatusHeader';
import HudPanel from '@/components/cinematic/HudPanel';
import AnimatedCounter, { Sparkline, Waveform } from '@/components/cinematic/AnimatedCounter';
import RadarSweep from '@/components/cinematic/RadarSweep';
import SoundToggle from '@/components/cinematic/SoundToggle';
import FloodTimeline from '@/components/three/FloodTimeline';
import { Activity, Radio, Compass } from 'lucide-react';

// Dynamic imports to prevent SSR window issues for Leaflet and Three.js
const DigitalTwinCanvas = dynamic(
  () => import('@/components/3d/DigitalTwinCanvas'),
  { ssr: false }
);
const DroneLeafletTracker = dynamic(
  () => import('@/components/maps/DroneLeafletTracker'),
  { ssr: false }
);

const SCENARIOS = ['nominal', 'storm', 'swarm-surge', 'gps-denied'];

/** Inference status ribbon: ANALYZING → INFERENCE COMPLETE (simulated rule output). */
function AiInferenceStatus({ cycleKey }: { cycleKey: string }) {
  const [stage, setStage] = useState<"analyzing" | "done">("analyzing");
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setStage("done");
      return;
    }
    setStage("analyzing");
    const t = window.setTimeout(() => setStage("done"), 1600);
    return () => window.clearTimeout(t);
  }, [cycleKey]);
  return (
    <div className="dx-ai-status" role="status" aria-live="polite">
      {stage === "analyzing" ? (
        <span>ANALYZING<span className="dx-dots" aria-hidden="true"><i>•</i><i>•</i><i>•</i></span></span>
      ) : (
        <span className="dx-ai-done">INFERENCE COMPLETE · RULE OUTPUT <span className="dx-sim">SIMULATION</span></span>
      )}
    </div>
  );
}

export default function MasterCommandCenter() {
  const { packets: telemetryLogs, live, connected: wsConnected } =
    useTelemetrySocket();
  const ops = useOps();
  const scenario = ops.scenario;
  const [activeTab, setActiveTab] = useState<'3D' | 'RADAR'>('3D');
  const [notice, setNotice] = useState('');
  const [posterOk, setPosterOk] = useState(true);
  const [floodWater, setFloodWater] = useState(0);

  const lat = live?.lat ?? 17.385;
  const lon = live?.lon ?? 78.4867;
  const alt = live?.alt_m ?? 120;

  const alerts = evaluateAlerts({
    scenario,
    spillwayK: ops.spillwayK,
    batteryPct: live?.battery_pct,
    signalPct: live?.signal_pct,
    geofenceBreach: checkGeofenceBreach({ lat, lon }),
    droneId: live?.drone_id,
  });

  // Live drill blend for the hero ticker (same surrogate as What-If).
  const tickerRisk = Math.min(100, Math.round(30 + ops.spillwayK * 1.1 + (scenario === 'storm' ? 18 : 0)));
  const tickerPeople =
    ({ storm: 24860, 'swarm-surge': 5200, 'gps-denied': 800, nominal: 120 } as Record<string, number>)[scenario] ?? 120;
  const tickerBlocked = Math.round((tickerRisk / 100) * 62);
  const units = 26 + alerts.length * 3;

  const riskSpark = useMemo(() => {
    const base = [22, 28, 34, 41, 48, 55, tickerRisk];
    return scenario === 'storm' ? base.map((v) => v + 8) : base;
  }, [tickerRisk, scenario]);

  async function changeScenario(s: string) {
    setOps({ scenario: s, acked: [] });
    try {
      await setScenario(s);
      setNotice(`scenario → ${s}`);
    } catch (e: unknown) {
      setNotice(`WS live, REST needs backend: ${(e as Error).message}`);
    }
  }

  return (
    <CinematicShell label="DRISHTI-X command center">
      <main className="min-h-screen text-slate-200 flex flex-col font-mono">
        <Navbar wsConnected={wsConnected} incident={incidentLevel(alerts)} />
        <GeofenceBreachModal lat={lat} lon={lon} droneId={live?.drone_id} />

        {/* Command status strip */}
        <StatusHeader
          system={wsConnected || true ? 'ONLINE' : 'OFFLINE'}
          network={wsConnected ? 'STABLE' : 'SIM LINK'}
          aiConfidence={98.4}
          dronesActive={units}
          dataHz={2.0}
          wsConnected={wsConnected}
        />

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
                  className="px-4 py-2 rounded-lg bg-[#00d2ff] hover:bg-[#00b0d6] text-black text-xs font-extrabold"
                >
                  CHECK MY RISK
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

        {/* KPI Ticker Bar — animated counters + sparklines */}
        <section className="px-4 py-2.5 grid grid-cols-2 md:grid-cols-6 gap-3" aria-label="Key metrics">
          <div className="dx-kpi bg-[#091a2e]/85 backdrop-blur p-2 rounded border border-[#1b314b]">
            <div className="text-[10px] text-slate-400 uppercase">Flood Inundation Risk</div>
            <div className="text-xl font-bold text-rose-400 flex items-baseline gap-1">
              <AnimatedCounter value={tickerRisk} /><span className="text-xs text-rose-500">/100</span>
              <span className="text-[10px] text-rose-400 font-normal ml-auto">live drill</span>
            </div>
            <Sparkline data={riskSpark} stroke="#fb7185" />
          </div>
          <div className="dx-kpi bg-[#091a2e]/85 backdrop-blur p-2 rounded border border-[#1b314b]">
            <div className="text-[10px] text-slate-400 uppercase">Citizens At Risk</div>
            <div className="text-xl font-bold text-amber-300"><AnimatedCounter value={tickerPeople} /></div>
            <Sparkline data={[120, 900, 3200, 9800, 18400, tickerPeople]} stroke="#fbbf24" />
          </div>
          <div className="dx-kpi bg-[#091a2e]/85 backdrop-blur p-2 rounded border border-[#1b314b]">
            <div className="text-[10px] text-slate-400 uppercase">Active Incidents</div>
            <div className="text-xl font-bold text-[#00d2ff]"><AnimatedCounter value={alerts.length} /> live</div>
            <div className="text-[10px] text-slate-500 mt-1">{floodWater > 0 ? `surge +${floodWater.toFixed(1)}m` : 'surge nominal'}</div>
          </div>
          <div className="dx-kpi bg-[#091a2e]/85 backdrop-blur p-2 rounded border border-[#1b314b]">
            <div className="text-[10px] text-slate-400 uppercase">Arterial Blockages</div>
            <div className="text-xl font-bold text-orange-400"><AnimatedCounter value={tickerBlocked} /> / 62</div>
            <Sparkline data={[4, 9, 14, 18, tickerBlocked]} stroke="#fb923c" />
          </div>
          <div className="dx-kpi bg-[#091a2e]/85 backdrop-blur p-2 rounded border border-[#1b314b]">
            <div className="text-[10px] text-slate-400 uppercase">Shelter Capacity</div>
            <div className="text-xl font-bold text-emerald-400">74.2% Occupied</div>
            <div className="text-[10px] text-slate-500 mt-1">DEMO DATA</div>
          </div>
          <div className="dx-kpi bg-[#091a2e]/85 backdrop-blur p-2 rounded border border-[#1b314b]">
            <div className="text-[10px] text-slate-400 uppercase">Active Air/Boat Units</div>
            <div className="text-xl font-bold text-cyan-300"><AnimatedCounter value={units} /> Units</div>
            <div className="text-[10px] text-slate-500 mt-1">SIMULATION</div>
          </div>
        </section>

        {/* Flood forecast strip */}
        <div className="px-4">
          <FloodTimeline onChange={(_h, w) => setFloodWater(w)} baseSurgeM={0} />
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
                  <SoundToggle />
                  <select
                    value={scenario}
                    onChange={(e) => changeScenario(e.target.value)}
                    className="bg-[#020b14] border border-[#1b314b] text-slate-300 text-xs rounded px-2 py-1"
                    title="Telemetry scenario"
                  >
                    {SCENARIOS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1 bg-[#020b14] p-0.5 rounded border border-[#1b314b]">
                    <button
                      onClick={() => setActiveTab('3D')}
                      className={`px-3 py-1 text-xs rounded transition-all ${
                        activeTab === '3D'
                          ? 'bg-[#00d2ff] text-black font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      3D Digital Twin
                    </button>
                    <button
                      onClick={() => setActiveTab('RADAR')}
                      className={`px-3 py-1 text-xs rounded transition-all ${
                        activeTab === 'RADAR'
                          ? 'bg-[#00d2ff] text-black font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      Leaflet Radar
                    </button>
                  </div>
                </div>
              </div>
              {/* Viewport Body */}
              <div className="flex-1 relative bg-black min-h-0">
                {activeTab === '3D' ? (
                  <DigitalTwinCanvas alt={alt} />
                ) : (
                  <DroneLeafletTracker lat={lat} lon={lon} />
                )}
                {/* Overlay telemetry watermark */}
                <div className="absolute bottom-3 left-3 bg-[#030d17]/80 backdrop-blur border border-[#1b314b] p-2 rounded text-[11px] text-[#00d2ff] pointer-events-none">
                  <span>STREAM: 2.0 Hz WS</span> •{' '}
                  <span>ALT: {alt.toFixed(1)}m</span>
                  {notice ? <span> • {notice}</span> : null}
                </div>
              </div>
            </div>

            {/* Live rule-driven hazard banner */}
            <AlertBanner alerts={alerts} acked={ops.acked} onAck={ackAlert} />

            {/* Radar + incident timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <HudPanel micro="SENSOR FUSION" title="SAR RADAR SWEEP">
                <RadarSweep />
              </HudPanel>
              <HudPanel micro="RESPONSE LEDGER" title="INCIDENT TIMELINE" right={<span className="dx-sim">SIMULATION</span>}>
                <div className="dx-timeline text-[11px]">
                  {[
                    ['10:42:18', 'Flood alert generated', 'AUTO · RULE ENGINE', 'DONE'],
                    ['10:43:04', 'AI prediction completed · 98.4%', 'HYDRA-NET · LOCAL', 'DONE'],
                    ['10:44:17', 'Drone DRX-07 dispatched', 'OPS · SIM', 'DONE'],
                    ['10:47:31', 'Civilian thermal signature · Ward 14', 'FLIR · SIM', 'ACTIVE'],
                    ['10:48:02', 'Rescue approval pending', 'COMMANDER', 'QUEUED'],
                  ].map(([t, what, who, st]) => (
                    <div key={t} className="dx-tl-item">
                      <div className="text-[#00d2ff] font-bold">{t} · {st}</div>
                      <div className="text-slate-200">{what}</div>
                      <div className="text-slate-500">{who}</div>
                    </div>
                  ))}
                </div>
              </HudPanel>
            </div>
          </section>

          {/* Right Column: Live Telemetry & AI Decision Recommendations (5 Cols) */}
          <section className="lg:col-span-5 flex flex-col gap-3">
            {/* AI Decision Panel — upgraded */}
            <HudPanel
              micro="HYDRA-NET · PREDICTIVE INFERENCE · LOCAL"
              title="AI INTELLIGENCE PANEL"
              tone={tickerRisk > 70 ? 'critical' : tickerRisk > 40 ? 'warn' : 'ok'}
              right={<span className="text-[10px] bg-[#00d2ff]/20 text-[#00d2ff] px-2 py-0.5 rounded border border-[#00d2ff]/40">98.4% CONFIDENCE</span>}
            >
              <AiInferenceStatus cycleKey={`${scenario}-${ops.spillwayK}`} />
              <Waveform />
              <div className="mt-3 space-y-2 text-xs">
                <div className="bg-[#091a2e] p-2.5 rounded border border-[#1b314b]">
                  <div className="text-slate-400 text-[10px]">RECOMMENDED INTERVENTION</div>
                  <div className="text-[#00d2ff] font-bold mt-0.5">
                    1. Dispatch NDRF Boat RB-07 to Ward 14 Bund Riverbed
                  </div>
                  <div className="text-slate-300 text-[11px] mt-1">
                    REASON: thermal signature detected in Ward 14 · 3 civilians · water +{floodWater.toFixed(1)}m on T-forecast.
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="bg-[#020b14] rounded p-1.5 border border-[#1b314b]"><div className="text-slate-500">ETA</div><div className="text-white font-bold">04:48</div></div>
                    <div className="bg-[#020b14] rounded p-1.5 border border-[#1b314b]"><div className="text-slate-500">RISK</div><div className="text-rose-400 font-bold">CRITICAL</div></div>
                    <div className="bg-[#020b14] rounded p-1.5 border border-[#1b314b]"><div className="text-slate-500">POP.</div><div className="text-white font-bold">{tickerPeople.toLocaleString()}</div></div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">RESOURCES: 1 boat · 4 crew · 1 FLIR drone · ICU-03 standby</div>
                  <button className="mt-2 w-full py-1.5 bg-[#00d2ff] hover:bg-[#00b0d6] text-black font-bold rounded transition-all">
                    APPROVE DISPATCH ORDER
                  </button>
                </div>
                <div className="bg-[#091a2e] p-2.5 rounded border border-[#1b314b]">
                  <div className="text-slate-400 text-[10px]">HOSPITAL BED RESERVATION</div>
                  <div className="text-white font-bold mt-0.5">
                    District General Hospital #07 (ICU-03 Cleaned &amp; Scrubbed)
                  </div>
                  <div className="text-slate-300 text-[11px] mt-1">
                    Assigned to inbound critical hypothermia patient via Ambulance AMB-12.
                  </div>
                </div>
              </div>
            </HudPanel>

            {/* Live Telemetry Feed Log */}
            <div className="bg-[#051424]/85 backdrop-blur border border-[#1b314b] rounded-xl p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-[#1b314b]">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  LIVE 868MHz LORA PACKET STREAM
                </span>
                <span className="text-[10px] text-slate-400">
                  {live ? `${live.drone_id} • ${live.scenario}` : '2.0 Hz CYCLE'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1">
                <Activity className="w-3.5 h-3.5 text-[#00d2ff]" /> TELEMETRY ACTIVITY
              </div>
              <div className="flex-1 overflow-y-auto max-h-[260px] mt-2 space-y-1 pr-1 font-mono text-[11px]">
                {telemetryLogs.length === 0 ? (
                  <div className="text-slate-500 py-6 text-center">
                    Waiting for telemetry packets from FastAPI backend… <span className="dx-sim">SIM LINK READY</span>
                  </div>
                ) : (
                  telemetryLogs.map((log) => (
                    <div
                      key={`${log.id}-${log.tick}`}
                      className="p-1.5 rounded bg-[#081a2c] hover:bg-[#0e2740] border border-[#132d4a] flex items-center justify-between text-slate-300"
                    >
                      <span className="text-[#00d2ff] font-bold">{log.drone_id}</span>
                      <span>Alt: {log.alt_m.toFixed(1)}m</span>
                      <span>Bat: {log.battery_pct.toFixed(0)}%</span>
                      <span className="text-emerald-400">{log.speed_ms.toFixed(1)} m/s</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Module navigation */}
            <HudPanel micro="COMMAND MODULES" title="JUMP TO OPERATIONS">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {[
                  ['/drones', 'DRONE SWARM & SAR'],
                  ['/twin', '3D DIGITAL TWIN'],
                  ['/location', 'LOCATION INTEL'],
                  ['/simulation', 'WHAT-IF COPILOT'],
                  ['/resources', 'HOSPITAL ICU'],
                  ['/shelter', 'SHELTER SCANNER'],
                  ['/reunion', 'OP-MILAN REUNION'],
                  ['/recovery', 'RECOVERY & AUDIT'],
                ].map(([href, label]) => (
                  <Link key={href} href={href} className="px-3 py-2 rounded-lg bg-[#091a2e] border border-[#1b314b] hover:border-[#00d2ff]/60 text-slate-200 font-bold text-center">
                    {label}
                  </Link>
                ))}
              </div>
            </HudPanel>
          </section>
        </div>
      </main>
    </CinematicShell>
  );
}
