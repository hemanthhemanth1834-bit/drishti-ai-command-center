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
};

/** Command-center status header: SYSTEM / NETWORK / SAT / DRONE / AI / DATA / CLOCK */
export default function StatusHeader({
  system = "ONLINE",
  network = "STABLE",
  aiConfidence = 98.4,
  dronesActive = 32,
  dataHz = 2.0,
  wsConnected = false,
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
    </section>
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
