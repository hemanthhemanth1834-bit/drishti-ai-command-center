'use client';
/** Animated risk timeline (SVG draw-on) + forecast with uncertainty bands. */
import { useEffect, useState } from 'react';
import { forecastRisk } from '@/nesafe/engine/riskEngine';
import type { RiskInput } from '@/nesafe/providers/types';

export function RiskTimeline({ history, color }: { history: number[]; color: string }) {
  const [draw, setDraw] = useState(0.2);
  useEffect(() => {
    const id = setInterval(() => setDraw((d) => (d >= 1 ? 1 : d + 0.12)), 120);
    return () => clearInterval(id);
  }, [history.length]);
  const W = 320; const H = 120; const P = 10;
  const data = history.slice(-24);
  const pts = data.map((v, i) => {
    const x = P + (i / Math.max(1, data.length - 1)) * (W - P * 2);
    const y = H - P - (v / 100) * (H - P * 2);
    return [x, y] as const;
  });
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const totalLen = 900;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="nesafe-chart" role="img" aria-label="Risk timeline last 24 ticks">
        {[20, 40, 60, 80, 100].map((g) => (
          <line key={g} x1={P} x2={W - P} y1={H - P - (g / 100) * (H - P * 2)} y2={H - P - (g / 100) * (H - P * 2)} stroke="#1b314b" strokeWidth={1} />
        ))}
        <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeDasharray={totalLen} strokeDashoffset={totalLen * (1 - draw)} strokeLinecap="round" />
        {pts.slice(-1).map((p, i) => (<circle key={i} cx={p[0]} cy={p[1]} r={4} fill="#ff5470" />))}
      </svg>
      <div className="nesafe-axis"><span>24 ticks ago</span><span>6h</span><span>12h</span><span>18h</span><span>NOW</span></div>
    </div>
  );
}

export function ForecastPanel({ current, input }: { current: number; input: RiskInput }) {
  const f = forecastRisk(current, input);
  return (
    <div className="nesafe-forecast">
      {f.map((p) => (
        <div key={p.at} className="nesafe-frow">
          <span>{p.at}</span>
          <div className="nesafe-fbar">
            <i style={{ left: `${p.lo}%`, width: `${Math.max(3, p.hi - p.lo)}%` }} />
            <b style={{ left: `${p.score}%` }} />
          </div>
          <b>{p.score}</b>
        </div>
      ))}
      <p className="nesafe-note">Forecast: risk is forecast to increase with rain — uncertainty bands shown. Never a fixed failure time.</p>
    </div>
  );
}
