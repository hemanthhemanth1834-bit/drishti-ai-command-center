'use client';
/** Explainable risk card — score counts up, WHY panel lists contributions. */
import { useEffect, useState } from 'react';
import { assessRisk } from '@/nesafe/engine/riskEngine';
import { NE_SLOPES } from '@/nesafe/data/northeast';
import { selectedSim, useNESafe } from '@/nesafe/store/nesafeStore';
import { RiskTimeline, ForecastPanel } from './RiskTimeline';
import ModeBadge from './ModeBadge';

const COLOR: Record<string, string> = { low: '#34d399', moderate: '#fbbf24', high: '#fb923c', critical: '#ff5470' };

export default function RiskScoreCard() {
  const { selectedSlopeId } = useNESafe();
  const sim = selectedSim();
  const slope = NE_SLOPES.find((s) => s.id === selectedSlopeId)!;
  const out = assessRisk({
    rainfallMmHr: sim.rainfallMmHr, soilMoisturePct: sim.soilPct, slopeDeg: slope.slopeDeg,
    elevationM: slope.elevationM, groundMoveMm: sim.groundMoveMm, historicalRisk: slope.baseRisk,
    satelliteDeformMm: sim.satelliteDeformMm, roadExposure: sim.risk * 0.6, citizenReports: sim.risk > 70 ? 3 : 1,
  }, sim.history);
  const [shown, setShown] = useState(out.score);
  useEffect(() => {
    const from = shown; const to = out.score; const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 600);
      setShown(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [out.score]);
  const c = COLOR[out.level];
  return (
    <div className="nesafe-glass nesafe-risk" style={{ borderColor: c + '66' }}>
      <div className="nesafe-row" style={{ justifyContent: 'space-between' }}>
        <div><div className="nesafe-micro">AI RISK ENGINE · DEMO/SIMULATION</div>
          <h3>{slope.name} · {slope.district}</h3></div>
        <ModeBadge />
      </div>
      <div className="nesafe-risk-top">
        <div className="nesafe-score" style={{ borderColor: c }}>
          <span className="nesafe-bignum" style={{ color: c }}>{shown.toFixed(0)}</span>
          <span>/ 100</span>
          <b style={{ color: c }}>{out.level.toUpperCase()}</b>
          <small style={{ color: out.trendPct >= 0 ? '#ff8ba0' : '#6ee7b7' }}>
            {out.trendPct >= 0 ? '↑' : '↓'} {out.trendPct >= 0 ? '+' : ''}{out.trendPct}% recent
          </small>
          <small>Probability {out.probabilityPct}% · {slope.populationExposed.toLocaleString()} exposed (demo)</small>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <RiskTimeline history={sim.history} color={c} />
        </div>
      </div>
      <details className="nesafe-why" open>
        <summary>WHY DID RISK CHANGE? (+explainability, not a black box)</summary>
        <ul>
          {out.factors.map((f) => (
            <li key={f.key}><span>+{f.contributionPct}% {f.label}</span><i style={{ width: `${f.contributionPct}%`, background: c }} /></li>
          ))}
        </ul>
        <p>Overall <b>{out.score.toFixed(0)} / 100</b> · {out.action}</p>
      </details>
      <ForecastPanel current={out.score} input={{
        rainfallMmHr: sim.rainfallMmHr, soilMoisturePct: sim.soilPct, slopeDeg: slope.slopeDeg,
        elevationM: slope.elevationM, groundMoveMm: sim.groundMoveMm, historicalRisk: slope.baseRisk,
        satelliteDeformMm: sim.satelliteDeformMm, roadExposure: 40, citizenReports: 2,
      }} />
      <div className="nesafe-grid2">
        <div>🌧 Rain <b>{sim.rainfallMmHr} mm/hr</b></div>
        <div>💧 Soil <b>{sim.soilPct}%</b></div>
        <div>📈 Movement <b>{sim.groundMoveMm} mm</b></div>
        <div>🛰 Deformation <b>{sim.satelliteDeformMm} mm</b></div>
      </div>
    </div>
  );
}
