'use client';
/** Shared predictor card: location + drivers -> ML probability + WHY. */
import { useState } from 'react';
import { demo, post } from './api';
import { StatusBadge } from './provenance';
import { useRegion } from './regionStore';

interface Pred {
  prediction_id: string; landslide_probability: number; risk_level: string;
  confidence: number; model_version: string; simulated: boolean;
  data_status: string; factors: Record<string, string>;
  contributions: { feature: string; contribution_pct: number; value: number }[];
}

export default function PredictorCard({ compact }: { compact?: boolean }) {
  const region = useRegion();
  const [lat, setLat] = useState(region.lat ?? 27.33);
  const [lon, setLon] = useState(region.lon ?? 88.61);
  const [rain, setRain] = useState(120);
  const [soil, setSoil] = useState(78);
  const [slope, setSlope] = useState(36);
  const [pred, setPred] = useState<Pred | null>(null);
  const [status, setStatus] = useState('DEMO');
  const [busy, setBusy] = useState(false);
  const [explain, setExplain] = useState<unknown>(null);

  const run = async () => {
    setBusy(true);
    const r = await post<Pred>('/api/v1/ml/predict', {
      location: { latitude: lat, longitude: lon },
      features: { rainfall_24h: rain, soil_moisture: soil, slope },
    });
    if (r.data) { setPred(r.data); setStatus(r.data.data_status); }
    else { setPred(demo.prediction(lat, lon) as Pred); setStatus('DEMO'); }
    setExplain(null);
    setBusy(false);
  };

  const showExplain = async () => {
    if (!pred || pred.prediction_id.startsWith('demo')) return;
    const { get } = await import('./api');
    const e = await get(`/api/v1/ml/explain/${pred.prediction_id}`);
    setExplain(e.data);
  };

  return (
    <div className="dx-hud">
      <div className="dx-hud-edge" />
      <div className="dx-hud-head">
        <div>
          <div className="dx-micro">AI PREDICTION · DECISION SUPPORT</div>
          <div className="dx-hud-title">Landslide probability</div>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <label>Lat <input type="number" step="0.01" value={lat} onChange={(e) => setLat(Number(e.target.value))} className="w-full bg-[#051424] border border-[#1b314b] rounded px-2 py-1" /></label>
        <label>Lon <input type="number" step="0.01" value={lon} onChange={(e) => setLon(Number(e.target.value))} className="w-full bg-[#051424] border border-[#1b314b] rounded px-2 py-1" /></label>
        <label>Rain 24h (mm) <input type="number" value={rain} onChange={(e) => setRain(Number(e.target.value))} className="w-full bg-[#051424] border border-[#1b314b] rounded px-2 py-1" /></label>
        <label>Soil % <input type="number" value={soil} onChange={(e) => setSoil(Number(e.target.value))} className="w-full bg-[#051424] border border-[#1b314b] rounded px-2 py-1" /></label>
        <label>Slope° <input type="number" value={slope} onChange={(e) => setSlope(Number(e.target.value))} className="w-full bg-[#051424] border border-[#1b314b] rounded px-2 py-1" /></label>
        <button onClick={run} disabled={busy} className="bg-[#00d2ff] text-black font-bold rounded px-3 py-1 self-end">{busy ? '…' : 'PREDICT'}</button>
      </div>
      {region.lat != null && region.lon != null && (lat !== region.lat || lon !== region.lon) && (
        <button onClick={() => { setLat(region.lat as number); setLon(region.lon as number); }} className="mt-2 text-[11px] text-[#7de9ff] hover:underline" aria-label={`Use shared location ${region.label}`}>
          USE SHARED LOCATION ({region.label})
        </button>
      )}
      {region.lat != null && lat === region.lat && lon === region.lon && (
        <p className="mt-2 text-[11px] text-[#7de9ff]">USING SHARED LOCATION: {region.label}</p>
      )}
      {pred && (
        <div className="mt-3 text-sm">
          <div className="text-3xl font-extrabold text-white">{(pred.landslide_probability * 100).toFixed(1)}% <span className="text-sm">{pred.risk_level}</span></div>
          <div className="text-[11px] text-slate-400">confidence {pred.confidence}% · {pred.model_version}{pred.simulated ? ' · SIMULATED' : ''}</div>
          {!compact && (
            <>
              <div className="dx-micro mt-2">WHY IS THIS ZONE {pred.risk_level}?</div>
              <ul className="text-xs text-slate-300 mt-1 space-y-0.5">
                {pred.contributions.slice(0, 6).map((c) => (
                  <li key={c.feature}>{c.feature}: <b>{c.contribution_pct}%</b> (value {c.value})</li>
                ))}
              </ul>
              <button onClick={showExplain} className="text-[11px] text-[#7de9ff] mt-1">Full explanation (model API)</button>
              {explain !== null && <pre className="text-[10px] bg-black/40 rounded p-2 mt-1 overflow-auto max-h-40">{JSON.stringify(explain, null, 1)}</pre>}
              <p className="text-[11px] text-amber-200/80 mt-2">Predicted risk — requires field verification. Never a certain event.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
