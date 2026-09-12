// ALERT CENTER — WHAT / WHERE / WHEN / SEVERITY / ACTION per alert.
'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import TrustBadge from '@/components/TrustBadge';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { useOps } from '@/store/opsStore';
import { evaluateAlerts } from '@/utils/alertRules';
import { DEMO_ALERTS } from '@/data/providers';
import { Bell, MapPin, Navigation } from 'lucide-react';

const CAT_STYLE: Record<string, string> = {
  info: 'bg-sky-500/15 border-sky-500/40 text-sky-300',
  watch: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300',
  warning: 'bg-orange-500/15 border-orange-500/40 text-orange-400',
  critical: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
};

export default function AlertsPage() {
  const { live, connected } = useTelemetrySocket();
  const ops = useOps();
  const liveAlerts = evaluateAlerts({
    scenario: ops.scenario,
    spillwayK: ops.spillwayK,
    batteryPct: live?.battery_pct,
    signalPct: live?.signal_pct,
    geofenceBreach: false,
    droneId: live?.drone_id,
  });
  const [notify, setNotify] = useState(false);
  const seenCritical = useRef<Set<string>>(new Set());

  async function enableNotify() {
    try {
      if (!('Notification' in window)) return;
      const perm = await Notification.requestPermission();
      setNotify(perm === 'granted');
    } catch {
      /* unsupported */
    }
  }

  // Fire a browser notification once per new critical mesh alert (opt-in only).
  useEffect(() => {
    if (!notify || !('Notification' in window)) return;
    for (const a of liveAlerts) {
      if (a.level === 'critical' && !seenCritical.current.has(a.id)) {
        seenCritical.current.add(a.id);
        try {
          new Notification(`DRISHTI-X CRITICAL — ${a.title.slice(0, 80)}`, { body: a.detail.slice(0, 140) });
        } catch {
          /* blocked */
        }
      }
    }
  });

  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="p-4 max-w-4xl mx-auto flex flex-col gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Bell className="w-5 h-5 text-[#00d2ff]" />
          <h1 className="text-xl font-extrabold text-white">ALERT CENTER</h1>
          <button
            onClick={enableNotify}
            className={`ml-auto px-3 py-1.5 rounded-lg text-[11px] font-bold border ${
              notify
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'border-[#1b314b] text-slate-300 hover:border-[#00d2ff]/60'
            }`}
          >
            {notify ? '🔔 CRITICAL NOTIFY ON' : '🔕 NOTIFY ME OF CRITICAL'}
          </button>
        </div>

        <section>
          <h2 className="text-xs font-bold text-slate-300 mb-2">
            LIVE MESH ALERTS <TrustBadge kind="LIVE" source="WS telemetry + rules" />
          </h2>
          <div className="space-y-2">
            {liveAlerts.length === 0 && (
              <div className="p-3 rounded-xl bg-[#061410] border border-emerald-500/40 text-emerald-300 text-xs">
                No active mesh alerts. All sectors nominal.
              </div>
            )}
            {liveAlerts.map((a) => (
              <div key={a.id} className={`p-3 rounded-xl border ${CAT_STYLE[a.level] ?? CAT_STYLE.info}`}>
                <div className="text-[10px] opacity-70">SEVERITY: {a.level.toUpperCase()}</div>
                <div className="font-bold text-white text-sm mt-0.5">{a.title}</div>
                <div className="text-[12px] mt-1 opacity-90">
                  <div><b>WHAT:</b> {a.title}</div>
                  <div><b>WHERE:</b> {live ? `${live.lat.toFixed(3)}, ${live.lon.toFixed(3)} (fleet fix)` : 'fleet fix pending'}</div>
                  <div><b>WHEN:</b> just now (live stream)</div>
                  <div><b>ACTION:</b> {a.detail}</div>
                </div>
                <div className="mt-2 flex gap-2 text-[11px] font-bold">
                  <Link href="/drones" className="px-2.5 py-1.5 rounded bg-white/10 border border-current flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> VIEW MAP
                  </Link>
                  <Link href="/evacuate" className="px-2.5 py-1.5 rounded bg-white/10 border border-current flex items-center gap-1">
                    <Navigation className="w-3 h-3" /> SAFE ROUTE
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold text-slate-300 mb-2">
            OFFICIAL-STYLE FEED <TrustBadge kind="DEMO" source="drill script" />
          </h2>
          <div className="space-y-2">
            {DEMO_ALERTS.map((a) => (
              <div key={a.id} className={`p-3 rounded-xl border ${CAT_STYLE[a.category]}`}>
                <div className="flex items-center gap-2 text-[10px] opacity-70">
                  <span>SEVERITY: {a.category.toUpperCase()}</span>
                  <TrustBadge kind="DEMO" />
                </div>
                <div className="font-bold text-white text-sm mt-0.5">{a.title}</div>
                <div className="text-[12px] mt-1 opacity-90">
                  <div><b>WHAT:</b> {a.title}</div>
                  <div><b>WHERE:</b> {a.area}</div>
                  <div><b>WHEN:</b> {a.issued}</div>
                  <div><b>ACTION:</b> {a.action}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
