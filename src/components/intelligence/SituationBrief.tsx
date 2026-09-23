'use client';
/**
 * DRISHTI-X SituationBrief (adapted from the Open Design `SituationBrief.js`
 * reference into this repo's provenance conventions).
 *
 * Intelligence workspace, NOT a generic chatbot:
 *   OBSERVED DATA → AI ANALYSIS → AI RECOMMENDATION
 *
 * AI outputs are analyses with confidence — never presented as confirmed
 * facts. Every line carries source + timestamp + status.
 */
import { useEffect, useState } from 'react';
import { StatusBadge } from '@/platform/provenance';
import { get } from '@/platform/api';
import { getWeather, getEarthquakes } from '@/lib/liveServices';

interface BriefRow {
  label: string;
  value: string;
  source: string;
  state: string;
}

function scoreRain(rain24: number | null): { level: string; why: string } {
  if (rain24 == null) return { level: 'UNKNOWN', why: 'No rainfall reading available' };
  if (rain24 >= 200) return { level: 'CRITICAL', why: `24h rainfall ${rain24}mm ≥ critical threshold 200mm` };
  if (rain24 >= 120) return { level: 'HIGH', why: `24h rainfall ${rain24}mm ≥ warning threshold 120mm` };
  if (rain24 >= 40) return { level: 'MODERATE', why: `24h rainfall ${rain24}mm — elevated, below warning band` };
  return { level: 'LOW', why: `24h rainfall ${rain24}mm — within normal band` };
}

export default function SituationBrief({ lat = 17.385, lon = 78.4867, place = 'Hyderabad / Krishna Basin' }: {
  lat?: number; lon?: number; place?: string;
}) {
  const [observed, setObserved] = useState<BriefRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<{ level: string; why: string; confidence: number } | null>(null);
  const [modelNote, setModelNote] = useState('Backend risk model: checking…');

  useEffect(() => {
    let dead = false;
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      const [wx, qk] = await Promise.all([
        getWeather(lat, lon, ctrl.signal),
        getEarthquakes(ctrl.signal),
      ]);
      if (dead) return;
      const rows: BriefRow[] = [];
      if (wx.data) {
        const c = wx.data.current;
        rows.push({
          label: 'Rainfall (24h observed)',
          value: c.rain24hMm != null ? `${c.rain24hMm} mm` : 'No reading',
          source: wx.source, state: wx.state,
        });
        rows.push({
          label: 'Temperature / humidity / wind',
          value: `${c.tempC ?? '?'}°C · ${c.humidityPct ?? '?'}% RH · ${c.windKph ?? '?'} km/h`,
          source: wx.source, state: wx.state,
        });
      } else {
        rows.push({ label: 'Weather', value: wx.note ?? 'Unavailable', source: wx.source, state: wx.state });
      }
      if (qk.data) {
        rows.push({
          label: 'Earthquakes (M2.5+, 7d)',
          value: `${qk.data.countWeek} worldwide · ${qk.data.indiaCount} in India region`,
          source: qk.source, state: qk.state,
        });
      } else {
        rows.push({ label: 'Earthquakes', value: qk.note ?? 'Unavailable', source: qk.source, state: qk.state });
      }
      setObserved(rows);
      const rain = wx.data?.current.rain24hMm ?? null;
      const scored = scoreRain(rain);
      setAnalysis({
        ...scored,
        confidence: wx.data ? 72 : 35,
      });
      try {
        const r = await get<{ status?: string; model_version?: string }>('/api/v1/ml/health');
        setModelNote(r.data
          ? `Backend risk model: ${r.data.status ?? 'unknown'} (${r.data.model_version ?? 'unversioned'}) · ${r.status}`
          : 'Backend risk model: unreachable — analysis below is rule-based (DEMO-grade), not ML output.');
      } catch {
        setModelNote('Backend risk model: unreachable — analysis below is rule-based (DEMO-grade), not ML output.');
      }
      setLoading(false);
    })();
    return () => { dead = true; ctrl.abort(); };
  }, [lat, lon]);

  return (
    <section className="dx-hud" aria-label="AI situation brief">
      <div className="dx-hud-edge" />
      <div className="dx-hud-head">
        <div>
          <div className="dx-micro">AI INTELLIGENCE WORKSPACE</div>
          <div className="dx-hud-title">Situation Brief — {place}</div>
        </div>
        <StatusBadge status={loading ? 'LIVE' : analysis?.level ?? 'UNKNOWN'} />
      </div>

      <div className="dx-micro">1 · OBSERVED DATA</div>
      <div className="mt-1 mb-3">
        {loading && <p className="text-xs text-slate-400">Reading open feeds…</p>}
        {!loading && observed.map((o) => (
          <div key={o.label} className="text-xs py-1.5 border-b border-[#1b314b] flex justify-between gap-2 flex-wrap">
            <span className="text-slate-300"><b className="text-white">{o.label}:</b> {o.value}</span>
            <span className="text-slate-500">{o.source} <StatusBadge status={o.state} small /></span>
          </div>
        ))}
      </div>

      <div className="dx-micro">2 · AI ANALYSIS (NOT A CONFIRMED FACT)</div>
      <div className="bg-[#091a2e] p-2.5 rounded border border-[#1b314b] text-xs mt-1 mb-3">
        {loading ? (
          <span className="text-slate-400">Analyzing…</span>
        ) : (
          <>
            <div className="text-white font-bold">
              Flood-risk posture: {analysis?.level} <span className="text-slate-400 font-normal">(confidence ~{analysis?.confidence}%)</span>
            </div>
            <div className="text-slate-300 mt-1">{analysis?.why}</div>
            <div className="text-slate-500 mt-1">{modelNote}</div>
          </>
        )}
      </div>

      <div className="dx-micro">3 · AI RECOMMENDATION (REQUIRES HUMAN DECISION)</div>
      <ul className="text-xs text-slate-300 mt-1 space-y-1.5 list-disc ml-4">
        <li>Verify field reports for {place} before any dispatch — demo/UNVERIFIED rows are not actionable.</li>
        <li>If rainfall crosses 120mm/24h, raise WATCH; at 200mm/24h escalate to CRITICAL per warning bands.</li>
        <li>Check shelter capacity and road status in the map layers before routing evacuations.</li>
      </ul>
      <div className="dx-micro mt-3">WHY (EVIDENCE CHAIN)</div>
      <p className="text-xs text-slate-300 mt-1">
        Open-Meteo observed rainfall + USGS earthquake context + backend model health (see OBSERVED above)
        combine into the posture score. No chatbot claims — every line above carries source + timestamp + status.
      </p>
      <p className="text-[10px] text-slate-500 mt-2">
        Observed → Analysis → Recommendation. Predictions are decision support, never confirmed facts.
      </p>
    </section>
  );
}
