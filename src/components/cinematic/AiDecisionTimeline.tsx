"use client";
import { useMemo, useRef, useState } from "react";
import HudPanel from "./HudPanel";
import { useIntel, type DrishtiEvent, type DrishtiEventSeverity, type DrishtiEventType } from "@/store/intelStore";

/**
 * DRISHTI-X AI DECISION TIMELINE (V3.1).
 *
 * A pure VIEW of the shared `useIntel().events` ring buffer — never another
 * engine. Rows render only fields that actually exist on the event; nothing
 * is invented. New arrivals animate once; history stays stable.
 */

const TYPE_ACTION: Record<DrishtiEventType, string> = {
  SENSOR: "SENSOR DATA RECEIVED",
  RISK: "RISK ANALYSIS COMPLETED",
  ALERT: "THREAT ALERT PROCESSED",
  SOS: "EMERGENCY RESPONSE ACTIVATED",
  SYSTEM: "SYSTEM STATE UPDATED",
  NETWORK: "NETWORK STATE UPDATED",
};

const SEV_LABEL: Record<DrishtiEventSeverity, string> = {
  info: "INFO",
  watch: "WATCH",
  warning: "WARN",
  critical: "CRITICAL",
};

function fmtTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString("en-IN", { hour12: false });
  } catch {
    return "--:--:--";
  }
}

/** Honest AI state: derived from real sos/tone only — never claims activity. */
function aiState(sosPhase: string, aiTone: string, eventCount: number): { label: string; tone: "ok" | "warn" | "critical" | "default" } {
  if (sosPhase === "active") return { label: "CRITICAL RESPONSE", tone: "critical" };
  if (sosPhase === "locking") return { label: "ANALYZING", tone: "warn" };
  if (aiTone === "critical") return { label: "ANALYZING", tone: "critical" };
  if (aiTone === "warn") return { label: "MONITORING", tone: "warn" };
  if (eventCount > 0) return { label: "IDLE · LOGGED", tone: "ok" };
  return { label: "IDLE", tone: "default" };
}

function EventRow({
  event,
  isNew,
  open,
  onToggle,
}: {
  event: DrishtiEvent;
  isNew: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const action = TYPE_ACTION[event.type] ?? event.type;
  const resolved = event.status === "resolved";
  return (
    <div className={`dx-dtl-row dx-dtl-${event.severity}${isNew ? " dx-dtl-new" : ""}${resolved ? " dx-dtl-resolved" : ""}`}>
      <button
        className="dx-dtl-head"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={`${action}, severity ${SEV_LABEL[event.severity]}, ${fmtTime(event.ts)}${open ? " — collapse" : " — expand"}`}
      >
        <span className={`dx-dtl-node dx-dtl-node-${event.severity}`} aria-hidden="true" />
        <span className="dx-dtl-action">{action}</span>
        <span className={`dx-dtl-sev dx-dtl-sev-${event.severity}`}>{SEV_LABEL[event.severity]}</span>
        <span className="dx-dtl-time">{fmtTime(event.ts)}</span>
        <span className={`dx-dtl-caret${open ? " dx-dtl-caret-open" : ""}`} aria-hidden="true">▸</span>
      </button>
      {open && (
        <div className="dx-dtl-detail">
          <div className="dx-dtl-title">{event.title}</div>
          {event.detail ? <div className="dx-dtl-text">{event.detail}</div> : null}
          <div className="dx-dtl-meta">
            <span>SRC {event.source}</span>
            {event.place ? <span>LOC {event.place}</span> : null}
            {event.lat != null && event.lon != null ? (
              <span>{event.lat.toFixed(3)}°N {event.lon.toFixed(3)}°E</span>
            ) : null}
            <span>STATUS {event.status.toUpperCase()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AiDecisionTimeline({ maxItems = 30, className = "" }: { maxItems?: number; className?: string }) {
  const intel = useIntel();
  const [openId, setOpenId] = useState<string | null>(null);

  // Newest first — newest visually prioritized, history preserved below.
  const events = useMemo(() => [...intel.events].reverse().slice(0, Math.max(1, maxItems)), [intel.events, maxItems]);

  // Animate ONLY arrivals: ids present at first render never animate, even
  // across re-renders. No timers, no fake activity.
  const initialIds = useRef<Set<string> | null>(null);
  if (initialIds.current === null) {
    initialIds.current = new Set(intel.events.map((e) => e.id));
  }
  const isNew = (id: string) => !initialIds.current!.has(id);

  const state = aiState(intel.sos.phase, intel.aiTone, intel.events.length);
  const latestTs = intel.events.length ? Math.max(...intel.events.map((e) => e.ts)) : null;

  return (
    <HudPanel
      micro="DRISHTI-X · LIVE INTELLIGENCE"
      title="AI DECISION TIMELINE"
      tone={state.tone === "default" ? "default" : state.tone}
      className={className}
      right={
        <span className={`dx-dtl-state dx-dtl-state-${state.tone}`} role="status">
          <i className="dx-dtl-state-dot" aria-hidden="true" />{state.label}
        </span>
      }
    >
      <div className="dx-dtl-stats" aria-label="Timeline summary">
        <span>EVENTS <b>{intel.events.length}</b></span>
        <span>LATEST <b>{latestTs ? fmtTime(latestTs) : "—"}</b></span>
        <span>THREAT <b>{intel.threatLevel.toUpperCase()}</b></span>
      </div>
      {events.length === 0 ? (
        <div className="dx-dtl-empty" role="status">
          <div className="dx-dtl-empty-core" aria-hidden="true"><span>◉</span></div>
          <p>WAITING FOR INTELLIGENCE EVENTS</p>
          <p className="dx-dtl-empty-hint">
            Run a risk check, change scenario, or activate SOS — real system activity appears here automatically.
          </p>
        </div>
      ) : (
        <div className="dx-dtl-list" role="log" aria-label="AI decision events, newest first">
          {events.map((e) => (
            <EventRow
              key={e.id}
              event={e}
              isNew={isNew(e.id)}
              open={openId === e.id}
              onToggle={() => setOpenId((cur) => (cur === e.id ? null : e.id))}
            />
          ))}
        </div>
      )}
    </HudPanel>
  );
}
