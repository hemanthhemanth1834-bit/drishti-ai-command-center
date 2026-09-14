"use client";
import { useEffect, useState } from "react";

const STEPS = [
  "INITIALIZING CORE",
  "CALIBRATING AI",
  "CONNECTING NETWORK",
  "SYNCING GEOINT",
  "ACTIVATING THREAT ENGINE",
  "SYSTEM ONLINE",
];

const BOOT_KEY = "drishti-boot-seen-v2";

/** Cinematic startup overlay. Session-scoped, skippable, reduced-motion aware. */
export default function BootSequence() {
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(0);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(BOOT_KEY) === "1") return;
    } catch {
      /* storage unavailable → still show once */
    }
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // skip cinematic boot, go straight in
    setVisible(true);
    let i = 0;
    const t = window.setInterval(() => {
      i += 1;
      setDone(i);
      if (i >= STEPS.length) {
        window.clearInterval(t);
        window.setTimeout(finish, 450);
      }
    }, 340);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    try {
      sessionStorage.setItem(BOOT_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  function skip() {
    setSkipped(true);
    finish();
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="DRISHTI-X initialization"
      className="dx-boot"
      data-skipped={skipped ? "1" : "0"}
    >
      <div className="dx-boot-inner">
        <div className="dx-boot-logo">DRISHTI-X</div>
        <div className="dx-boot-sub">DISASTER INTELLIGENCE COMMAND · INITIALIZING</div>
        <div className="dx-boot-pct" aria-hidden="true">{Math.round((done / STEPS.length) * 100)}%</div>
        <div className="dx-boot-steps" aria-live="polite">
          {STEPS.map((s, idx) => (
            <div key={s} className="dx-boot-row">
              <span>{s}</span>
              <span className="dx-boot-dots" aria-hidden="true" />
              <span
                className={
                  idx < done ? "dx-boot-ok" : idx === done ? "dx-boot-busy" : "dx-boot-wait"
                }
              >
                {idx < done ? "ONLINE" : idx === done ? "LINKING…" : "STANDBY"}
              </span>
            </div>
          ))}
        </div>
        <div className="dx-boot-bar" aria-hidden="true">
          <div
            className="dx-boot-fill"
            style={{ width: `${Math.round((done / STEPS.length) * 100)}%` }}
          />
        </div>
        <div className="dx-boot-foot">
          <span>DRISHTI-X · CINEMATIC V2.5</span>
          <span>SESSION-SCOPED · SKIPPABLE</span>
        </div>
        <button onClick={skip} className="dx-boot-skip" autoFocus>
          SKIP INTRO →
        </button>
      </div>
    </div>
  );
}
