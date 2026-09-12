// OPS — operator KPI overview. Drill figures labeled SIMULATION; mesh alerts LIVE.
'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import TrustBadge from '@/components/TrustBadge';
import DemoConsole from '@/components/DemoConsole';
import SystemHealth from '@/components/SystemHealth';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { useOps } from '@/store/opsStore';
import { evaluateAlerts } from '@/utils/alertRules';
import { DEMO_FACILITIES, demoDroneProvider, type DroneUnit } from '@/data/providers';
import { Gauge } from 'lucide-react';

const PEOPLE: Record<string, number> = { storm: 24860, 'swarm-surge': 5200, 'gps-denied': 800, nominal: 120 };

export default function OpsPage() {
  const { live, connected } = useTelemetrySocket();
  const ops = useOps();
  const [fleet, setFleet] = useState<DroneUnit[]>([]);
  const [openReports, setOpenReports] = useState(0);

  useEffect(() => {
    demoDroneProvider.fleet().then(setFleet).catch(() => {});
    try {
      const raw = localStorage.getItem('drishti-reports');
      const list = raw ? (JSON.parse(raw) as { status?: string }[]) : [];
      setOpenReports(list.filter((r) => r.status !== 'RESOLVED').length);
    } catch {
      /* ignore */
    }
  }, []);

  const incidents = evaluateAlerts({
    scenario: ops.scenario,
    spillwayK: ops.spillwayK,
    batteryPct: live?.battery_pct,
    signalPct: live?.signal_pct,
    geofenceBreach: false,
    droneId: live?.drone_id,
  });
  const shelters = DEMO_FACILITIES.filter((f) => f.kind === 'shelter');
  const hospitals = DEMO_FACILITIES.filter((f) => f.kind === 'hospital');
  const airborne = fleet.filter((d) => d.status === 'AIRBORNE').length;

  const kpis: { label: string; value: string; badge: React.ReactNode }[] = [
    { label: 'ACTIVE INCIDENTS', value: String(incidents.length), badge: <TrustBadge kind="LIVE" source="rule engine" /> },
    { label: 'PEOPLE AT RISK', value: (PEOPLE[ops.scenario] ?? 120).toLocaleString(), badge: <TrustBadge kind="SIMULATION" source="drill model" /> },
    { label: 'ACTIVE SHELTERS', value: `${shelters.filter((s) => s.status.includes('OPEN')).length}/${shelters.length}`, badge: <TrustBadge kind="DEMO" source="drill registry" /> },
    { label: 'HOSPITALS (ICU FREE)', value: `${hospitals.length} (${8} beds)`, badge: <TrustBadge kind="DEMO" source="SIMULATED CAPACITY" /> },
    { label: 'DRONES AIRBORNE', value: `${airborne}/${fleet.length}`, badge: <TrustBadge kind="SIMULATION" source="sim telemetry" /> },
    { label: 'EVACUATIONS', value: ops.spillwayK > 45 ? '2 in progress' : '0', badge: <TrustBadge kind="SIMULATION" source="spillway rule" /> },
    { label: 'UNRESOLVED REPORTS', value: String(openReports), badge: <TrustBadge kind="DEMO" source="this device" /> },
  ];

  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="p-4 max-w-6xl mx-auto flex flex-col gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Gauge className="w-5 h-5 text-[#00d2ff]" />
          <h1 className="text-xl font-extrabold text-white">OPERATIONS OVERVIEW</h1>
          <span className="text-[11px] text-slate-400">scenario: {ops.scenario} · spillway: {ops.spillwayK}k cusecs</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {kpis.map((k) => (
            <div key={k.label} className="p-2.5 rounded-xl bg-[#051424] border border-[#1b314b]">
              <div className="text-[9px] text-slate-500">{k.label}</div>
              <div className="text-lg font-extrabold text-white">{k.value}</div>
              <div className="mt-1">{k.badge}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="text-xs font-bold text-white pb-2 border-b border-[#1b314b]">
              RESPONSE METRICS <TrustBadge kind="SIMULATION" source="drill averages" />
            </div>
            {[
              ['Alert → Response', '4.8 min'],
              ['Dispatch → Arrival', '11 min'],
              ['Incident → Verification', '22 min'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-[#132d4a] text-xs last:border-0">
                <span className="text-slate-400">{k}</span>
                <span className="text-white font-bold">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="text-xs font-bold text-white pb-2 border-b border-[#1b314b]">
              FLEET STATUS <TrustBadge kind="SIMULATION" source="not real hardware" />
            </div>
            <div className="mt-2 space-y-1 text-[11px]">
              {fleet.map((d) => (
                <div key={d.id} className="p-1.5 rounded bg-[#081a2c] border border-[#132d4a] flex justify-between">
                  <span className="text-[#00d2ff] font-bold">{d.id}</span>
                  <span className="text-slate-300 hidden sm:inline">{d.mission}</span>
                  <span>{d.battery}%</span>
                  <span className="text-amber-300">{d.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <SystemHealth wsConnected={connected} demoActive={ops.demo !== null} />
        <DemoConsole />
      </div>
    </main>
  );
}
