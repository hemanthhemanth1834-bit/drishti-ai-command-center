// ALERT CENTER — cinematic alert stream: WHAT / WHERE / WHEN / SEVERITY / ACTION per alert.
// Notification opt-in + rule evaluation logic preserved; presentation upgraded to HUD cards.
'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import TrustBadge from '@/components/TrustBadge';
import CinematicShell from '@/components/cinematic/CinematicShell';
import HudPanel from '@/components/cinematic/HudPanel';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { useOps } from '@/store/opsStore';
import { useIntel, pushEvent, setLatestAlert } from '@/store/intelStore';
import { evaluateAlerts } from '@/utils/alertRules';
import { DEMO_ALERTS } from '@/data/providers';
import { Bell, MapPin, Navigation } from 'lucide-react';

const CAT_TONE: Record<string, 'default' | 'warn' | 'critical' | 'ok'> = {
  info: 'default',
  watch: 'warn',
  warning: 'warn',
  critical: 'critical',
};

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
  const [notifyState, setNotifyState] = useState<'unknown' | 'granted' | 'denied' | 'unsupported'>('unknown');
  const seenCritical = useRef<Set<string>>(new Set());

  async function enableNotify() {
    try {
      if (!('Notification' in window)) {
        setNotifyState('unsupported');
        return;
      }
      const perm = await Notification.requestPermission();
      setNotifyState(perm === 'granted' ? 'granted' : perm === 'denied' ? 'denied' : 'unknown');
      setNotify(perm === 'granted');
    } catch {
      setNotifyState('unsupported');
    }
  }

  // Fire a browser notification once per new critical mesh alert (opt-in only).
  // Also publish evaluated alerts to the shared intelligence layer (V3) so
  // COMMAND, globe, AI core and ticker see the same alert truth. Evaluation
  // itself is untouched — this only mirrors existing results.
  const intel = useIntel();
  const seenPublished = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const a of liveAlerts) {
      if (!seenPublished.current.has(a.id)) {
        seenPublished.current.add(a.id);
        pushEvent({
          id: `alert-${a.id}`,
          type: 'ALERT',
          severity: a.level === 'critical' ? 'critical' : a.level === 'warning' ? 'warning' : 'info',
          title: a.title,
          detail: a.detail,
          source: 'alert-engine',
        });
        if (a.level === 'critical') {
          setLatestAlert({ id: a.id, level: a.level, title: a.title, source: 'alert-engine' });
        }
      }
      if (notify && 'Notification' in window && a.level === 'critical' && !seenCritical.current.has(a.id)) {
        seenCritical.current.add(a.id);
        try {
          new Notification(`DRISHTI-X CRITICAL — ${a.title.slice(0, 80)}`, { body: a.detail.slice(0, 140) });
        } catch {
          /* blocked */
        }
      }
    }
  });

  const sosActive = intel.sos.phase !== 'idle';
  const hasCritical = liveAlerts.some((a) => a.level === 'critical');
  // Shared truth (V3): this view's globe mirrors COMMAND — SOS red wins,
  // otherwise the live evaluated severity tints it. Same inputs, same tone.
  const shellTone = sosActive || hasCritical ? 'critical' : liveAlerts.length ? 'warn' : 'ok';
  const shellFocus = sosActive ? 'sos' : null;

  return (
    <CinematicShell intensity={0.7} label="DRISHTI-X alert center" tone={shellTone} focusKind={shellFocus}>
      <main className="min-h-screen text-slate-200 font-mono">
        <Navbar wsConnected={connected} />
        <div className="p-4 max-w-4xl mx-auto flex flex-col gap-4 pb-10">
          <div className="flex items-center gap-2 flex-wrap">
            <Bell className="w-5 h-5 text-[#00d2ff]" />
            <h1 className="text-xl font-extrabold text-white">ALERT CENTER</h1>
            <span className="dx-alert-count" aria-label={`${liveAlerts.length} live alerts`}>{liveAlerts.length} LIVE</span>
            <button
              onClick={enableNotify}
              className={`ml-auto px-3 py-1.5 rounded-lg text-[11px] font-bold border ${
                notify
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'border-[#1b314b] text-slate-300 hover:border-[#00d2ff]/60'
              }`}
            >
              {notify
                ? '🔔 CRITICAL NOTIFY ON'
                : notifyState === 'denied'
                  ? '🔕 BLOCKED — ALLOW IN BROWSER SETTINGS'
                  : notifyState === 'unsupported'
                    ? '🔕 NOT SUPPORTED IN THIS BROWSER'
                    : '🔕 NOTIFY ME OF CRITICAL'}
            </button>
          </div>

          {sosActive && (
            <div className="dx-shared-sos" role="alert">
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

          <HudPanel
            micro="SENSOR MESH · RULE ENGINE"
            title="LIVE MESH ALERTS"
            tone={liveAlerts.some((a) => a.level === 'critical') ? 'critical' : liveAlerts.length ? 'warn' : 'ok'}
            right={<TrustBadge kind="LIVE" source="WS telemetry + rules" />}
          >
            <div className="space-y-2 dx-alerts-stream">
              {liveAlerts.length === 0 && (
                <div className="p-3 rounded-xl bg-[#061410]/90 border border-emerald-500/40 text-emerald-300 text-xs">
                  No active mesh alerts. All sectors nominal.
                </div>
              )}
              {liveAlerts.map((a, i) => (
                <div
                  key={a.id}
                  className={`dx-alert dx-alert-${a.level} p-3 rounded-xl border ${CAT_STYLE[a.level] ?? CAT_STYLE.info}`}
                  style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`dx-alert-pip dx-pip-${a.level}`} aria-hidden="true" />
                    <div className="text-[10px] opacity-70 tracking-[0.14em]">SEVERITY: {a.level.toUpperCase()} · LIVE</div>
                    <span className="dx-alert-time ml-auto">JUST NOW</span>
                  </div>
                  <div className="font-bold text-white text-sm mt-0.5">{a.title}</div>
                  <div className="text-[12px] mt-1 opacity-90">
                    <div><b>WHAT:</b> {a.title}</div>
                    <div><b>WHERE:</b> {live ? `${live.lat.toFixed(3)}, ${live.lon.toFixed(3)} (fleet fix)` : 'fleet fix pending'}</div>
                    <div><b>WHEN:</b> just now (live stream)</div>
                    <div><b>ACTION:</b> {a.detail}</div>
                  </div>
                  <div className="mt-2 flex gap-2 text-[11px] font-bold">
                    <Link href="/drones" className="px-2.5 py-1.5 rounded bg-white/10 border border-current flex items-center gap-1 hover:bg-white/20">
                      <MapPin className="w-3 h-3" /> VIEW MAP
                    </Link>
                    <Link href="/evacuate" className="px-2.5 py-1.5 rounded bg-white/10 border border-current flex items-center gap-1 hover:bg-white/20">
                      <Navigation className="w-3 h-3" /> SAFE ROUTE
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </HudPanel>

          <HudPanel
            micro="DRILL SCRIPT · ADVISORY FEED"
            title="OFFICIAL-STYLE FEED"
            right={<TrustBadge kind="DEMO" source="drill script" />}
          >
            <div className="space-y-2 dx-alerts-stream">
              {DEMO_ALERTS.map((a, i) => (
                <div
                  key={a.id}
                  className={`dx-alert p-3 rounded-xl border ${CAT_STYLE[a.category]}`}
                  style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}
                >
                  <div className="flex items-center gap-2 text-[10px] opacity-70">
                    <span className={`dx-alert-pip dx-pip-${a.category}`} aria-hidden="true" />
                    <span className="tracking-[0.14em]">SEVERITY: {a.category.toUpperCase()}</span>
                    <TrustBadge kind="DEMO" />
                    <span className="dx-alert-time ml-auto">{a.issued}</span>
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
          </HudPanel>
        </div>
      </main>
    </CinematicShell>
  );
}
