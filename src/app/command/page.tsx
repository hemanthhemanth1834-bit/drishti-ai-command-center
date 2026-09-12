// src/app/page.tsx — DRISHTI-X Master Command Center
'use client';
import { useState } from 'react';
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
import {
  Activity,
  Radio,
  Compass,
} from 'lucide-react';

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

export default function MasterCommandCenter() {
  const { packets: telemetryLogs, live, connected: wsConnected } =
    useTelemetrySocket();
  const ops = useOps();
  const scenario = ops.scenario;
  const [activeTab, setActiveTab] = useState<'3D' | 'RADAR'>('3D');
  const [notice, setNotice] = useState('');
  const [posterOk, setPosterOk] = useState(true);

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
    <main className="min-h-screen bg-[#020b14] text-slate-200 flex flex-col font-mono">
      <Navbar wsConnected={wsConnected} incident={incidentLevel(alerts)} />
      <GeofenceBreachModal lat={lat} lon={lon} droneId={live?.drone_id} />

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

      {/* KPI Ticker Bar — live drill blend: risk/closures/units follow scenario + spillway */}
      <section className="bg-[#051424] border-b border-[#1b314b] px-4 py-2.5 grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-[#091a2e] p-2 rounded border border-[#1b314b]">
          <div className="text-[10px] text-slate-400 uppercase">Flood Inundation Risk</div>
          <div className="text-xl font-bold text-rose-400 flex items-baseline gap-1">
            {tickerRisk}<span className="text-xs text-rose-500">/100</span>
            <span className="text-[10px] text-rose-400 font-normal ml-auto">live drill</span>
          </div>
        </div>
        <div className="bg-[#091a2e] p-2 rounded border border-[#1b314b]">
          <div className="text-[10px] text-slate-400 uppercase">Citizens At Risk</div>
          <div className="text-xl font-bold text-amber-300">{tickerPeople.toLocaleString()}</div>
        </div>
        <div className="bg-[#091a2e] p-2 rounded border border-[#1b314b]">
          <div className="text-[10px] text-slate-400 uppercase">Active Incidents</div>
          <div className="text-xl font-bold text-[#00d2ff]">{alerts.length} live</div>
        </div>
        <div className="bg-[#091a2e] p-2 rounded border border-[#1b314b]">
          <div className="text-[10px] text-slate-400 uppercase">Arterial Blockages</div>
          <div className="text-xl font-bold text-orange-400">{tickerBlocked} / 62</div>
        </div>
        <div className="bg-[#091a2e] p-2 rounded border border-[#1b314b]">
          <div className="text-[10px] text-slate-400 uppercase">Shelter Capacity</div>
          <div className="text-xl font-bold text-emerald-400">74.2% Occupied</div>
        </div>
        <div className="bg-[#091a2e] p-2 rounded border border-[#1b314b]">
          <div className="text-[10px] text-slate-400 uppercase">Active Air/Boat Units</div>
          <div className="text-xl font-bold text-cyan-300">{26 + alerts.length * 3} Units</div>
        </div>
      </section>

      {/* Main Command Workstation */}
      <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Spatial Digital Twin & GPS Radar (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col gap-3">
          <div className="bg-[#051424] border border-[#1b314b] rounded-xl overflow-hidden flex flex-col h-[520px]">
            {/* Viewport Header */}
            <div className="bg-[#081b2e] px-4 py-2 border-b border-[#1b314b] flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#00d2ff]" />
                <span className="text-xs font-bold text-white tracking-wider">
                  KRISHNA BASIN SECTOR 04 // {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
                </span>
              </div>
              <div className="flex items-center gap-2">
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
        </section>

        {/* Right Column: Live Telemetry & AI Decision Recommendations (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-3">
          {/* AI Decision Panel */}
          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b314b]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#00d2ff]" />
                HYDRA-NET PREDICTIVE INFERENCE
              </span>
              <span className="text-[10px] bg-[#00d2ff]/20 text-[#00d2ff] px-2 py-0.5 rounded border border-[#00d2ff]/40">
                98.4% CONFIDENCE
              </span>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <div className="bg-[#091a2e] p-2.5 rounded border border-[#1b314b]">
                <div className="text-slate-400 text-[10px]">RECOMMENDED INTERVENTION</div>
                <div className="text-[#00d2ff] font-bold mt-0.5">
                  1. Dispatch NDRF Boat RB-07 to Ward 14 Bund Riverbed
                </div>
                <div className="text-slate-300 text-[11px] mt-1">
                  3 trapped civilians detected via FLIR thermal signature. ETA: 4.8 minutes.
                </div>
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
          </div>

          {/* Live Telemetry Feed Log */}
          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-[#1b314b]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-emerald-400" />
                LIVE 868MHz LORA PACKET STREAM
              </span>
              <span className="text-[10px] text-slate-400">
                {live ? `${live.drone_id} • ${live.scenario}` : '2.0 Hz CYCLE'}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[260px] mt-2 space-y-1 pr-1 font-mono text-[11px]">
              {telemetryLogs.length === 0 ? (
                <div className="text-slate-500 py-6 text-center">
                  Waiting for telemetry packets from FastAPI backend...
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
        </section>
      </div>
    </main>
  );
}
