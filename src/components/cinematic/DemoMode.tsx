"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getOps, setOps, startDemo, demoGoto, type OpsState } from "@/store/opsStore";
import {
  getIntelSnapshot,
  setSosPhase,
  pushEvent,
  resolveEvent,
  scenarioScore,
  type SosSnapshot,
} from "@/store/intelStore";
import { evaluateAlerts } from "@/utils/alertRules";
import { playPing } from "./SoundToggle";

/**
 * DRISHTI-X PRESENTATION MODE (V3.2) — guided cinematic demo controller.
 *
 * Orchestration only: every scene drives the EXISTING ops demo engine
 * (scenario/spillway → alerts, ticker, AI tone, globe react automatically)
 * and the EXISTING intel publishers (timeline events, SOS publish).
 * No parallel state, no fake backend, no real emergency actions —
 * the SOS scene uses the on-device simulated pathway only.
 */

// Demo scenario geography: Vijayawada sector — coordinates already used by
// the app's own drill content (RadarSweep). Always labeled DEMO SCENARIO.
const DEMO_LAT = 16.51;
const DEMO_LON = 80.65;
const DEMO_PLACE = "Vijayawada sector";

type LiveDrone = { drone_id: string; lat: number; lon: number } | null;

type SceneDef = {
  id: string;
  kicker: string;
  title: string;
  caption: string;
  durationMs: number;
  /** ops demo phase to jump to (flood script). Omit = leave phase alone. */
  opsPhase?: number;
  act?: (live: LiveDrone) => void;
};

function demoEvent(
  id: string,
  type: "SENSOR" | "RISK" | "ALERT" | "SOS" | "SYSTEM" | "NETWORK",
  severity: "info" | "watch" | "warning" | "critical",
  title: string,
  extra?: { detail?: string; lat?: number; lon?: number; place?: string }
) {
  pushEvent({ id, type, severity, title, source: "demo-mode", ...extra });
}

const SCENES: SceneDef[] = [
  {
    id: "init",
    kicker: "SCENE 01 · SYSTEM INITIALIZATION",
    title: "DRISHTI-X AI COMMAND CENTER",
    caption: "System online. One shared intelligence state drives the globe, AI core, timeline, risk, alerts and ticker.",
    durationMs: 2500,
    opsPhase: 0,
    act: () => {
      demoEvent("demo-start", "SYSTEM", "info", `DEMO — presentation started: ${DEMO_PLACE} flood drill`, {
        detail: "Simulated scenario. Normal application mode is unchanged.",
        lat: DEMO_LAT,
        lon: DEMO_LON,
        place: `${DEMO_PLACE} (DEMO)`,
      });
    },
  },
  {
    id: "detection",
    kicker: "SCENE 02 · SENSOR DETECTION",
    title: "Sensor sweep active",
    caption: "Telemetry mesh reports inflow rising upstream. Watch the globe, AI core and timeline respond together.",
    durationMs: 3500,
    opsPhase: 1,
    act: (live) => {
      if (live) {
        demoEvent("demo-sensor", "SENSOR", "info", `DEMO — sensor data received via ${live.drone_id} (live fix, drill context)`, {
          detail: "Real unit fix shown inside a simulated drill narrative.",
          lat: Math.round(live.lat * 1000) / 1000,
          lon: Math.round(live.lon * 1000) / 1000,
          place: `${live.drone_id} fix`,
        });
      } else {
        demoEvent("demo-sensor", "SENSOR", "info", "DEMO — simulated sensor sweep: upstream inflow rising (drill)", {
          detail: "No live unit link; sweep pattern is simulated for the drill.",
        });
      }
    },
  },
  {
    id: "geoint",
    kicker: "SCENE 03 · GEOINT ANALYSIS",
    title: "Location resolved — demo scenario",
    caption: "The shared focus locks the drill sector. Network links converge; the AI core holds analysis state.",
    durationMs: 3500,
    act: () => {
      demoEvent("demo-geoint", "NETWORK", "info", `DEMO — geolocation resolved: ${DEMO_PLACE} (drill sector)`, {
        detail: "Schematic focus ring only — not a surveyed position.",
        lat: DEMO_LAT,
        lon: DEMO_LON,
        place: `${DEMO_PLACE} (DEMO)`,
      });
    },
  },
  {
    id: "risk",
    kicker: "SCENE 04 · RISK ANALYSIS",
    title: "Risk model executed",
    caption: "The drill surrogate re-scores the sector. Threat level, AI tone and globe follow the same number.",
    durationMs: 4500,
    opsPhase: 2,
    act: () => {
      const ops = getOps();
      const score = scenarioScore(ops.scenario, ops.spillwayK);
      demoEvent("demo-risk", "RISK", score > 70 ? "critical" : score > 40 ? "warning" : "watch", `DEMO — risk analysis completed: drill score ${score} (surrogate)`, {
        detail: "Drill surrogate math, not a backend model result.",
        lat: DEMO_LAT,
        lon: DEMO_LON,
        place: `${DEMO_PLACE} (DEMO)`,
      });
    },
  },
  {
    id: "alert",
    kicker: "SCENE 05 · THREAT ALERT",
    title: "Threat alert processed",
    caption: "The rule engine evaluates live drill inputs. This is the genuine evaluated alert, shown in drill context.",
    durationMs: 3500,
    opsPhase: 3,
    act: () => {
      const ops = getOps();
      const found = evaluateAlerts({ scenario: ops.scenario, spillwayK: ops.spillwayK, geofenceBreach: false });
      const a = found[0];
      demoEvent(
        `demo-alert-${ops.scenario}-${ops.spillwayK}`,
        "ALERT",
        a?.level === "critical" ? "critical" : a?.level === "warning" ? "warning" : "info",
        a ? `DEMO — ${a.title}` : "DEMO — mesh nominal: no alert raised (drill)",
        a?.detail ? { detail: a.detail } : undefined
      );
    },
  },
  {
    id: "response",
    kicker: "SCENE 06 · RESPONSE PLAN",
    title: "Response state updated",
    caption: "Evacuation phase: drill tasking posts to the command board — boats, crews and standby units.",
    durationMs: 3500,
    opsPhase: 4,
    act: () => {
      demoEvent("demo-response", "SYSTEM", "warning", "DEMO — response tasked: NDRF Boat RB-07 to Ward 14 (drill)", {
        detail: "Drill tasking from the command board. No real dispatch occurs.",
        lat: DEMO_LAT,
        lon: DEMO_LON,
        place: `${DEMO_PLACE} (DEMO)`,
      });
    },
  },
  {
    id: "sos",
    kicker: "SCENE 07 · EMERGENCY RESPONSE · SIMULATED",
    title: "SOS beacon — simulated",
    caption: "Simulated emergency: the beacon uses the on-device pathway only. No calls, no dispatch, no notifications — the whole system turns red.",
    durationMs: 5500,
    opsPhase: 5,
    act: () => {
      // Simulated SOS through the real publish pathway (on-device only).
      setSosPhase("active", { lat: DEMO_LAT, lon: DEMO_LON });
      demoEvent("demo-sos-active", "SOS", "critical", `DEMO — SOS activated (simulated) near ${DEMO_LAT}, ${DEMO_LON}`, {
        detail: "Simulated beacon. Existing real SOS functionality is untouched.",
        lat: DEMO_LAT,
        lon: DEMO_LON,
        place: `${DEMO_PLACE} (DEMO)`,
      });
    },
  },
  {
    id: "recovery",
    kicker: "SCENE 08 · RECOVERY",
    title: "Emergency resolved — restoring",
    caption: "Beacon stood down. Red relaxes through amber back to cyan while history stays in the timeline.",
    durationMs: 3500,
    opsPhase: 6,
    act: () => {
      setSosPhase("idle");
      resolveEvent("demo-sos-active");
      demoEvent("demo-recovery", "SYSTEM", "info", "DEMO — recovery phase: surge receding, relief audit opens (drill)", {
        detail: "Simulated stand-down. Timeline history is preserved.",
      });
    },
  },
];

const FINAL_IDX = SCENES.length; // mission-complete screen

export default function DemoMode({ onExit, live = null }: { onExit: () => void; live?: LiveDrone }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const timer = useRef<number | null>(null);
  const liveRef = useRef(live);
  liveRef.current = live;
  const headRef = useRef<HTMLHeadingElement>(null);
  // Pre-demo snapshots — restored verbatim on exit/unmount.
  const snapOps = useRef<Pick<OpsState, "scenario" | "spillwayK" | "acked" | "demo"> | null>(null);
  const snapSos = useRef<SosSnapshot | null>(null);
  const exited = useRef(false);

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const restore = useCallback(() => {
    clearTimer();
    if (snapOps.current) {
      setOps({
        scenario: snapOps.current.scenario,
        spillwayK: snapOps.current.spillwayK,
        acked: snapOps.current.acked,
        demo: snapOps.current.demo,
      });
    }
    if (snapSos.current) {
      setSosPhase(snapSos.current.phase, snapSos.current.lat != null && snapSos.current.lon != null
        ? { lat: snapSos.current.lat, lon: snapSos.current.lon }
        : null);
    }
    resolveEvent("demo-sos-active");
  }, []);

  const exit = useCallback(() => {
    if (exited.current) return;
    exited.current = true;
    restore();
    pushEvent({
      id: "demo-end",
      type: "SYSTEM",
      severity: "info",
      title: "DEMO — presentation ended, normal ops restored",
      source: "demo-mode",
    });
    onExit();
    try {
      document.getElementById("dx-present-btn")?.focus();
    } catch {
      /* ignore */
    }
  }, [restore, onExit]);

  // Enter: snapshot, start drill engine, focus heading for screen readers.
  useEffect(() => {
    const ops = getOps();
    snapOps.current = { scenario: ops.scenario, spillwayK: ops.spillwayK, acked: ops.acked, demo: ops.demo };
    snapSos.current = getIntelSnapshot().sos;
    setReduced(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
    startDemo("flood");
    SCENES[0].act?.(liveRef.current);
    playPing();
    headRef.current?.focus();
    return () => {
      // Navigating away mid-demo also restores — never strand simulated SOS.
      if (!exited.current) {
        exited.current = true;
        restore();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Run scene side-effects on arrival (re-visits re-assert; ids dedupe events).
  useEffect(() => {
    if (idx >= SCENES.length) return;
    const s = SCENES[idx];
    if (s.opsPhase !== undefined) {
      try {
        demoGoto(s.opsPhase);
      } catch {
        /* engine unavailable */
      }
    }
    s.act?.(liveRef.current);
    playPing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  // Single controlled playback timer. Reduced motion = manual stepping only.
  useEffect(() => {
    clearTimer();
    if (!playing || reduced || idx >= SCENES.length) return;
    timer.current = window.setTimeout(() => {
      setIdx((i) => Math.min(i + 1, FINAL_IDX));
    }, SCENES[idx].durationMs);
    return clearTimer;
  }, [idx, playing, reduced]);

  // Scoped keyboard: Esc exit · arrows/space step (never inside form fields).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName ?? "";
      const inField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable;
      if (e.key === "Escape") {
        e.preventDefault();
        exit();
        return;
      }
      if (inField) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setPlaying(false);
        setIdx((i) => Math.min(i + 1, FINAL_IDX));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPlaying(false);
        setIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === " " && tag !== "BUTTON" && tag !== "A") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exit]);

  const isFinal = idx >= SCENES.length;
  const scene = isFinal ? null : SCENES[idx];

  const step = (d: 1 | -1) => {
    setPlaying(false);
    setIdx((i) => Math.max(0, Math.min(i + d, FINAL_IDX)));
  };

  return (
    <div className="dx-demo" role="dialog" aria-modal="true" aria-label="DRISHTI-X presentation mode — simulated scenario">
      <div className="dx-demo-dim" aria-hidden="true" />
      <div className="dx-demo-top">
        <span className="dx-demo-badge">▶ PRESENTATION MODE</span>
        <span className="dx-sim">SIMULATED SCENARIO</span>
        {!isFinal && scene ? (
          <span className="dx-demo-count" aria-live="polite">
            SCENE {String(idx + 1).padStart(2, "0")} / {String(FINAL_IDX + 1).padStart(2, "0")}
          </span>
        ) : (
          <span className="dx-demo-count">COMPLETE</span>
        )}
      </div>

      {!isFinal && scene ? (
        <div className="dx-demo-card" key={scene.id}>
          <div className="dx-micro">DETECTION → ANALYSIS → RESPONSE · {scene.kicker}</div>
          <h2 ref={headRef} tabIndex={-1} className="dx-demo-title">{scene.title}</h2>
          <p className="dx-demo-caption">{scene.caption}</p>
          {!reduced && playing ? (
            <div className="dx-demo-progress" aria-hidden="true">
              <i key={`${scene.id}-${idx}`} style={{ animationDuration: `${scene.durationMs}ms` }} />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="dx-demo-card" key="final">
          <div className="dx-micro">DRISHTI-X · MISSION SIMULATION</div>
          <h2 ref={headRef} tabIndex={-1} className="dx-demo-title">MISSION COMPLETE</h2>
          <ul className="dx-demo-check">
            {["DETECTION", "ANALYSIS", "RISK", "ALERT", "RESPONSE", "SOS · SIMULATED", "RECOVERY"].map((s) => (
              <li key={s}><span aria-hidden="true">✓</span> {s}</li>
            ))}
          </ul>
          <div className="dx-demo-system" role="status">SYSTEM ONLINE · NORMAL OPS RESTORED ON EXIT</div>
          <div className="dx-demo-final-btns">
            <button onClick={() => { setIdx(0); setPlaying(true); }} className="dx-demo-replay">↻ REPLAY DEMO</button>
            <button onClick={exit} className="dx-demo-exit-btn" autoFocus>× EXIT PRESENTATION</button>
          </div>
        </div>
      )}

      <div className="dx-demo-controls" role="toolbar" aria-label="Presentation controls">
        <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause presentation" : "Play presentation"} className="dx-demo-btn dx-demo-play">
          {playing ? "Ⅱ PAUSE" : "▶ PLAY"}
        </button>
        <button onClick={() => step(-1)} disabled={idx === 0} aria-label="Previous scene" className="dx-demo-btn">← PREV</button>
        <button onClick={() => step(1)} disabled={isFinal} aria-label="Next scene" className="dx-demo-btn">NEXT →</button>
        <button onClick={() => { setIdx(0); setPlaying(true); }} aria-label="Restart presentation" className="dx-demo-btn">↻</button>
        <button onClick={exit} aria-label="Exit presentation" className="dx-demo-btn dx-demo-exit">× EXIT</button>
      </div>
      <div className="dx-demo-dots" aria-hidden="true">
        {SCENES.map((s, i) => (
          <span key={s.id} className={i < idx ? "dx-demo-dot-done" : i === idx && !isFinal ? "dx-demo-dot-now" : ""} />
        ))}
        <span className={isFinal ? "dx-demo-dot-now" : ""} />
      </div>
    </div>
  );
}
