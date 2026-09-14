"use client";
import { useEffect, useState } from "react";
import AnimatedCounter from "./AnimatedCounter";

type Props = {
  system?: string;
  network?: string;
  aiConfidence?: number;
  dronesActive?: number;
  dataHz?: number;
  wsConnected?: boolean;
  /** V3 shared state: citizen risk-check score (null = no check this session). */
  riskScore?: number | null;
  /** V3 shared state: live evaluated alert count (null = unknown here). */
  alertCount?: number | null;
  /** V3 shared state: SOS beacon phase is not idle. */
  sosActive?: boolean;
};

/** Command-center status header: SYSTEM / NETWORK / SAT / DRONE / AI / DATA / CLOCK */
export default function StatusHeader({
  system = "ONLINE",
  network = "STABLE",
  aiConfidence = 98.4,
  dronesActive = 32,
  dataHz = 2.0,
  wsConnected = false,
  riskScore = null,
  alertCount = null,
  sosActive = false,
}: Props) {
  return (
    <section aria-label="System status" className="dx-status">
      <StatusCell label="SYSTEM" value={system} tone={system === "ONLINE" ? "ok" : "bad"} pulse />
      <StatusCell label="NETWORK" value={network} tone={network === "STABLE" ? "ok" : "warn"} />
      <StatusCell label="SATELLITE" value="CONNECTED" tone="ok" sub="LEO LOCK · 4 SATS" />
      <StatusCell
        label="DRONE LINK"
        value={`${dronesActive} ACTIVE`}
        tone="info"
        sub={wsConnected ? "LIVE 868MHz" : "SIM LINK"}
      />
      <div className="dx-status-cell">
        <div className="dx-micro">AI INFERENCE</div>
        <div className="dx-status-val text-cyan-200">
          <AnimatedCounter value={aiConfidence} decimals={1} suffix="%" duration={1200} />
        </div>
        <div className="dx-status-sub">HYDRA-NET · LOCAL</div>
      </div>
      <StatusCell label="DATA STREAM" value={`${dataHz.toFixed(1)} Hz`} tone="info" />
      <ClockCell />
      <StatusTicker
        wsConnected={wsConnected}
        dronesActive={dronesActive}
        aiConfidence={aiConfidence}
        riskScore={riskScore}
        alertCount={alertCount}
        sosActive={sosActive}
      />
    </section>
  );
}

function StatusTicker({
  wsConnected,
  dronesActive,
  aiConfidence,
  riskScore,
  alertCount,
  sosActive,
}: {
  wsConnected: boolean;
  dronesActive: number;
  aiConfidence: number;
  riskScore: number | null;
  alertCount: number | null;
  sosActive: boolean;
}) {
  const [uptime, setUptime] = useState("00:00:00");
  const [utc, setUtc] = useState("--:--:--");
  useEffect(() => {
    const t0 = Date.now();
    const tick = () => {
      const s = Math.floor((Date.now() - t0) / 1000);
      const hh = String(Math.floor(s / 3600)).padStart(2, "0");
      const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
      setUptime(`${hh}:${mm}:${ss}`);
      setUtc(new Date().toISOString().slice(11, 19));
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, []);
  // deterministic load estimate from live fleet size (labeled EST — not a backend metric)
  const aiLoad = Math.min(96, 34 + (dronesActive % 40) + Math.round((100 - aiConfidence) * 2));
  return (
    <div className="dx-status-ticker" aria-label="Command telemetry details">
      <span><i className={`dx-dot ${wsConnected ? "dx-dot-ok" : "dx-dot-warn"}`} aria-hidden="true" />LINK {wsConnected ? "LIVE" : "SIM"}</span>
      <span>UPTIME {uptime}</span>
      <span>UTC {utc}</span>
      <span className="dx-ticker-load">AI LOAD {aiLoad}% EST<span className="dx-ticker-bar" aria-hidden="true"><i style={{ width: `${aiLoad}%` }} /></span></span>
      <span>SENSORS {wsConnected ? "STREAMING" : "STANDBY"}</span>
      <span>NODES {dronesActive}</span>
      <span>ALERTS {alertCount ?? "—"}</span>
      <span>RISK {riskScore ?? "—"}</span>
      <span className={sosActive ? "dx-ticker-sos" : undefined}>
        <i className={`dx-dot ${sosActive ? "dx-dot-bad dx-pulse" : "dx-dot-ok"}`} aria-hidden="true" />
        SOS {sosActive ? "ACTIVE" : "READY"}
      </span>
    </div>
  );
}

function StatusCell({
  label,
  value,
  sub,
  tone,
  pulse,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "ok" | "warn" | "bad" | "info";
  pulse?: boolean;
}) {
  const color =
    tone === "ok" ? "dx-dot-ok" : tone === "warn" ? "dx-dot-warn" : tone === "bad" ? "dx-dot-bad" : "dx-dot-info";
  return (
    <div className="dx-status-cell">
      <div className="dx-micro">{label}</div>
      <div className="dx-status-val">
        <span className={`dx-dot ${color} ${pulse ? "dx-pulse" : ""}`} aria-hidden="true" />
        {value}
      </div>
      {sub ? <div className="dx-status-sub">{sub}</div> : null}
    </div>
  );
}

function ClockCell() {
  return (
    <div className="dx-status-cell">
      <div className="dx-micro">COMMAND CLOCK (IST)</div>
      <div className="dx-status-val" suppressHydrationWarning>
        <LiveClock />
      </div>
      <div className="dx-status-sub">SYNCED · LOCAL</div>
    </div>
  );
}

function LiveClock() {
  const [now, setNow] = useState("--:--:--");
  useEffect(() => {
    const f = () =>
      setNow(
        new Date().toLocaleTimeString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" })
      );
    f();
    const t = window.setInterval(f, 1000);
    return () => window.clearInterval(t);
  }, []);
  return <>{now}</>;
}
