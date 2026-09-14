"use client";
import { useEffect, useMemo, useState } from "react";
import { assessRisk } from "@/utils/riskEngine";
import { RISK_SCORE, setRiskResult, pushEvent } from "@/store/intelStore";
import type { RiskLevel } from "@/data/providers";

type Place = { name: string; lat: number; lon: number } | null;

const SCORE = RISK_SCORE;
const TONE: Record<RiskLevel, string> = {
  low: "#34d399",
  moderate: "#fbbf24",
  high: "#fb923c",
  critical: "#ff5470",
};
const LABEL: Record<RiskLevel, string> = {
  low: "LOW",
  moderate: "MODERATE",
  high: "HIGH",
  critical: "CRITICAL",
};

/**
 * Cinematic risk visualization: animated circular score, threat level,
 * confidence bar, affected-region readout + heatmap grid. Pure SVG/CSS
 * (no WebGL) so the citizen risk flow stays fast on mobile.
 */
export default function RiskVisualizer({ place }: { place: Place }) {
  const report = useMemo(
    () => (place ? assessRisk(place.lat, place.lon) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [place?.lat, place?.lon]
  );
  const level: RiskLevel = report?.level ?? "low";
  const score = SCORE[level];
  const tone = TONE[level];
  const [anim, setAnim] = useState(0);

  // Publish real risk-check results to the shared intelligence layer so
  // COMMAND, globe, AI core and ticker react to the same truth (V3).
  // Pure assessRisk output only — no invented data.
  useEffect(() => {
    if (!place || !report) return;
    const snapshot = {
      score: RISK_SCORE[report.level],
      level: report.level,
      confidence: report.confidence,
      placeName: place.name,
      lat: place.lat,
      lon: place.lon,
      source: "risk-check" as const,
    };
    setRiskResult(snapshot);
    pushEvent({
      id: `risk-${place.lat.toFixed(3)}-${place.lon.toFixed(3)}-${report.level}`,
      type: "RISK",
      severity: report.level === "critical" ? "critical" : report.level === "high" ? "warning" : report.level === "moderate" ? "watch" : "info",
      title: `Risk check ${place.name} → ${report.level.toUpperCase()} (${RISK_SCORE[report.level]})`,
      place: place.name,
      lat: place.lat,
      lon: place.lon,
      source: "risk-check",
    });
  }, [place, report]);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setAnim(score);
      return;
    }
    setAnim(0);
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 900);
      const e = 1 - Math.pow(1 - p, 3);
      setAnim(Math.round(score * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const R = 52;
  const C = 2 * Math.PI * R;
  const pct = anim / 100;

  // deterministic heatmap from coords (visual density only — labeled SIMULATION)
  const cells = useMemo(() => {
    const seed = place ? Math.abs(Math.sin(place.lat * 12.9898 + place.lon * 78.233) * 43758.5453) % 1 : 0.3;
    return Array.from({ length: 49 }, (_, i) => {
      const cx = 3 - Math.abs(3 - (i % 7));
      const cy = 3 - Math.abs(3 - Math.floor(i / 7));
      const d = (cx + cy) / 6; // 0 edge → 1 center
      const heat = Math.max(0, Math.min(1, d * (0.35 + (score / 100) * 0.85) + seed * 0.12 - (i % 5) * 0.02));
      return heat;
    });
  }, [place, score]);

  if (!place || !report) {
    return (
      <div className="dx-riskviz dx-riskviz-empty" role="status">
        <div className="dx-micro">AI RISK VISUALIZATION</div>
        <div className="dx-riskviz-empty-core" aria-hidden="true">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#132d4a" strokeWidth="8" strokeDasharray="4 6" />
            <circle cx="60" cy="60" r="34" fill="none" stroke="rgba(0,210,255,0.25)" strokeWidth="1.5" />
          </svg>
          <span>?</span>
        </div>
        <p className="dx-riskviz-hint">Run a GPS or manual check — the AI risk map renders here with score, threat level, confidence and heat zones.</p>
      </div>
    );
  }

  const topZone = report.nearby[0]?.zone;

  return (
    <div className="dx-riskviz" role="status" aria-live="polite" aria-label={`Risk ${LABEL[level]}, score ${score}`}>
      <div className="dx-riskviz-top">
        <div className="dx-riskviz-gauge">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={R} fill="none" stroke="#132d4a" strokeWidth="10" />
            <circle
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={tone}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
              transform="rotate(-90 70 70)"
              className="dx-gauge-arc"
              style={{ filter: `drop-shadow(0 0 8px ${tone}66)` }}
            />
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx="70" cy="70" r={R + 9 + i * 5} fill="none" stroke={tone} strokeWidth="1" opacity={0.14 - i * 0.03} />
            ))}
          </svg>
          <div className="dx-riskviz-score">
            <span className="dx-riskviz-num" style={{ color: tone }}>{anim}</span>
            <span className="dx-riskviz-den">/100</span>
            <span className="dx-riskviz-lvl" style={{ color: tone }}>{LABEL[level]}</span>
          </div>
        </div>
        <div className="dx-riskviz-meta">
          <div className="dx-micro">AI RISK VISUALIZATION · SIMULATION</div>
          <div className="dx-riskviz-place">{place.name}</div>
          <div className="dx-riskviz-coords">{place.lat.toFixed(3)}°N {place.lon.toFixed(3)}°E</div>
          <div className="dx-riskviz-rows">
            <div className="dx-riskviz-row"><span>THREAT LEVEL</span><b style={{ color: tone }}>{LABEL[level]}</b></div>
            <div className="dx-riskviz-row"><span>AI CONFIDENCE</span><b>{report.confidence}%</b></div>
            <div className="dx-riskviz-row"><span>AFFECTED REGION</span><b>{topZone ? `${topZone.type.toUpperCase()} · ${topZone.radiusKm} KM` : "NO CELL"}</b></div>
            <div className="dx-riskviz-row"><span>ANALYSIS</span><b className="dx-riskviz-pulse">● AI SCANNED</b></div>
          </div>
          <div className="dx-confbar" aria-hidden="true">
            <div className="dx-confbar-fill" style={{ width: `${report.confidence}%`, background: tone }} />
          </div>
          <div className="dx-threatbar" role="img" aria-label={`Threat scale: ${LABEL[level]}`}>
            {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((seg) => {
              const order = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
              const activeIdx = order.indexOf(LABEL[level]);
              const segIdx = order.indexOf(seg);
              const on = segIdx <= activeIdx;
              return (
                <span key={seg} className={`dx-threat-seg ${on ? "dx-threat-on" : ""}`} style={on ? { background: tone, boxShadow: `0 0 8px ${tone}55` } : undefined}>
                  {seg}
                </span>
              );
            })}
          </div>
        </div>
      </div>
      <div className="dx-riskviz-bottom">
        <div className="dx-heatmap" aria-hidden="true">
          {cells.map((h, i) => (
            <span
              key={i}
              className="dx-heat"
              style={{
                opacity: 0.18 + h * 0.82,
                background: h > 0.66 ? "#ff5470" : h > 0.42 ? "#fb923c" : h > 0.24 ? "#fbbf24" : "#00d2ff",
                animationDelay: `${(i % 7) * 60 + Math.floor(i / 7) * 40}ms`,
              }}
            />
          ))}
          <span className="dx-heat-you" title="Your position">◎</span>
        </div>
        <div className="dx-riskviz-factors">
          <div className="dx-micro">WHY THIS LEVEL · MODEL ESTIMATE</div>
          <ul>
            {report.factors.slice(0, 4).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
