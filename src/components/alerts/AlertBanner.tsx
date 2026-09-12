'use client';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import type { Alert } from '@/utils/alertRules';

type Props = {
  alerts: Alert[];
  acked: string[];
  onAck: (id: string) => void;
  extraCount?: number;
};

const STYLES = {
  critical: {
    box: 'bg-[#140608] border-rose-500/40',
    title: 'text-rose-300',
    body: 'text-rose-200/80',
    icon: 'text-rose-400',
  },
  warning: {
    box: 'bg-[#141006] border-amber-500/40',
    title: 'text-amber-300',
    body: 'text-amber-200/80',
    icon: 'text-amber-400',
  },
  info: {
    box: 'bg-[#061410] border-emerald-500/40',
    title: 'text-emerald-300',
    body: 'text-emerald-200/80',
    icon: 'text-emerald-400',
  },
} as const;

/** Live rule-driven banner: top unacknowledged alert, or the all-clear strip. */
export default function AlertBanner({ alerts, acked, onAck, extraCount = 0 }: Props) {
  const active = alerts.filter((a) => !acked.includes(a.id));

  if (active.length === 0) {
    return (
      <div className="bg-[#061410] border border-emerald-500/40 p-3.5 rounded-xl flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-bold text-emerald-300">
            ALL SECTORS NOMINAL — NO ACTIVE HAZARD BREACHES
          </div>
          <div className="text-[11px] text-emerald-200/70 mt-1 leading-relaxed">
            Discharge within limits, fleet inside geofence, link margins healthy. Banner
            escalates automatically when any rule trips.
          </div>
        </div>
      </div>
    );
  }

  const top = active[0];
  const s = STYLES[top.level];
  return (
    <div className={`${s.box} border p-3.5 rounded-xl flex items-start gap-3`}>
      <AlertTriangle
        className={`w-5 h-5 ${s.icon} shrink-0 mt-0.5 ${
          top.level === 'critical' ? 'animate-bounce' : ''
        }`}
      />
      <div className="flex-1">
        <div className={`text-xs font-bold ${s.title}`}>
          {top.title}
          {active.length > 1 && (
            <span className="ml-2 font-normal opacity-80">+{active.length - 1} more</span>
          )}
          {extraCount > 0 && (
            <span className="ml-2 font-normal opacity-60">({extraCount} acknowledged)</span>
          )}
        </div>
        <div className={`text-[11px] ${s.body} mt-1 leading-relaxed`}>{top.detail}</div>
      </div>
      <button
        onClick={() => onAck(top.id)}
        title="Acknowledge alert"
        className="shrink-0 p-1 rounded border border-current opacity-60 hover:opacity-100"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
