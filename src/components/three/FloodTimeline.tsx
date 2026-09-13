"use client";
import { useEffect, useState } from "react";

export const FLOOD_STEPS = [0, 1, 3, 6, 12, 24] as const;

/** Water rise model (m) per forecast hour — surrogate, clearly simulated. */
export function floodModel(hours: number, baseSurgeM = 0): number {
  const curve: Record<number, number> = { 0: 0, 1: 0.3, 3: 0.8, 6: 1.5, 12: 2.4, 24: 3.4 };
  return Math.min(3.8, baseSurgeM + (curve[hours] ?? 0));
}

/**
 * Time-control interface T-0h … T+24h. Smoothly animates disaster state.
 * Emits (hours, waterM) so twin / map / stats stay in sync.
 */
export default function FloodTimeline({
  onChange,
  baseSurgeM = 0,
}: {
  onChange?: (hours: number, waterM: number) => void;
  baseSurgeM?: number;
}) {
  const [hours, setHours] = useState<number>(0);
  const [water, setWater] = useState<number>(floodModel(0, baseSurgeM));

  useEffect(() => {
    const target = floodModel(hours, baseSurgeM);
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setWater(target);
      onChange?.(hours, target);
      return;
    }
    let raf = 0;
    const from = water;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 700);
      const e = 1 - Math.pow(1 - p, 3);
      const v = from + (target - from) * e;
      setWater(v);
      if (p < 1) raf = requestAnimationFrame(tick);
      else onChange?.(hours, target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours, baseSurgeM]);

  const affected = Math.min(100, Math.round(water * 26));
  const sectors = water > 2 ? "WARDS 12 · 14 · 18" : water > 1 ? "WARD 14 BUND" : water > 0.2 ? "RIVERSIDE" : "NONE";
  const riskTone = water > 2 ? "critical" : water > 1 ? "warn" : "ok";
  const zones = [
    { n: "RIVERSIDE", on: water > 0.2 },
    { n: "WARD 14", on: water > 1 },
    { n: "WARDS 12·18", on: water > 2 },
    { n: "NH-65", on: water > 1.4 },
  ];

  return (
    <div className={`dx-flood dx-flood-${riskTone}`}>
      <div className="dx-flood-head">
        <span className="dx-micro">FLOOD FORECAST TIMELINE · SIMULATION</span>
        <span className="dx-flood-water" aria-live="polite">
          +{water.toFixed(1)}m · {affected}% ZONE · {sectors}
        </span>
      </div>
      <div className="dx-flood-steps" role="group" aria-label="Forecast hour">
        {FLOOD_STEPS.map((h) => (
          <button
            key={h}
            onClick={() => setHours(h)}
            aria-pressed={hours === h}
            aria-label={h === 0 ? "Current conditions" : `Forecast plus ${h} hours`}
            className={`dx-flood-step ${hours === h ? "dx-flood-on" : ""}`}
          >
            {h === 0 ? "T-0h" : `T+${h}h`}
          </button>
        ))}
      </div>
      <div className="dx-flood-track" aria-hidden="true">
        <div className="dx-flood-wave" style={{ width: `${(water / 3.8) * 100}%` }} />
        <div className="dx-flood-marker" style={{ left: `${(water / 3.8) * 100}%` }} />
      </div>
      {/* affected-zone chips swell in sequence — cinematic state change, no jumps */}
      <div className="dx-flood-zones" aria-hidden="true">
        {zones.map((z) => (
          <span key={z.n} className={`dx-flood-zone ${z.on ? "dx-flood-zone-on" : ""}`}>
            {z.n}
          </span>
        ))}
      </div>
      <div className="dx-flood-meta">
        <span>RISING WATER INDICATOR</span>
        <span>INFRA: NH-65 UNDERPASS {water > 1.4 ? "SUBMERGED" : water > 0.6 ? "WATCH" : "CLEAR"}</span>
      </div>
    </div>
  );
}
