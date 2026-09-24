'use client';
import { useEffect, useState } from 'react';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import { usePlatform } from '@/platform/usePlatform';
import { get } from '@/platform/api';
import { cacheGet, cachePut } from '@/platform/offlineDb';
import VizFigure from '@/platform/VizFigure';

export default function WeatherPage() {
  const [lat, setLat] = useState(25.57);
  const [lon, setLon] = useState(91.89);
  const [q, setQ] = useState(`${lat},${lon}`);
  const cur = usePlatform<Record<string, unknown>>(`/api/v1/rainfall/current?lat=${q.split(',')[0]}&lon=${q.split(',')[1]}`);
  const now = usePlatform<Record<string, unknown>>(`/api/v1/weather/current?lat=${q.split(',')[0]}&lon=${q.split(',')[1]}`);
  const th = usePlatform<{ warn_24h_mm: number; crit_24h_mm: number }>('/api/v1/weather/thresholds');
  const pv = usePlatform<{ providers: { name: string; status: string; key_required: boolean; detail?: string }[] }>('/api/v1/weather/providers');
  const [cached, setCached] = useState<{ value: Record<string, unknown>; ts: number } | null>(null);

  useEffect(() => {
    if (cur.data) cachePut('weather:last', cur.data);
    else if (!cur.loading) cacheGet<Record<string, unknown>>('weather:last').then(setCached);
  }, [cur.data, cur.loading]);

  const go = () => setQ(`${lat},${lon}`);

  const live = cur.data as Record<string, unknown> | null;
  const d = live ?? cached?.value ?? null;
  const badge = live ? String(live.data_status ?? cur.status) : cached ? 'CACHED' : cur.status;
  const rain24 = Number(d?.rain_24h_mm ?? 0);
  const wxImg = rain24 >= 200 ? '/img/wx-storm.svg' : rain24 >= 60 ? '/img/wx-rain.svg' : '/img/wx-clear.svg';
  const wxAlt = rain24 >= 200 ? 'Extreme storm warning illustration' : rain24 >= 60 ? 'Heavy rainfall illustration' : 'Clear weather illustration';
  return (
    <ModuleShell title="Weather Intelligence" sub="Rainfall 1/6/24/72h · accumulation · anomaly · forecast · thresholds" status={badge} source={String(d?.source ?? 'provider chain')}>
      {cached && !live && <p className="text-[11px] text-sky-300">CACHED DATA from {new Date(cached.ts).toLocaleString()} — backend unreachable.</p>}
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="flex gap-2 text-xs flex-wrap">
          <label>Lat <input type="number" step="0.01" value={lat} onChange={(e) => setLat(Number(e.target.value))} className="w-24 bg-[#051424] border border-[#1b314b] rounded px-2 py-1" /></label>
          <label>Lon <input type="number" step="0.01" value={lon} onChange={(e) => setLon(Number(e.target.value))} className="w-24 bg-[#051424] border border-[#1b314b] rounded px-2 py-1" /></label>
          <button onClick={go} className="bg-[#00d2ff] text-black font-bold rounded px-3">LOAD</button>
        </div>
        {cur.loading ? <p className="text-xs mt-2">Loading…</p> : d ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2">
            {([['1h', d.rain_1h_mm], ['6h', d.rain_6h_mm], ['24h', d.rain_24h_mm], ['72h', d.rain_72h_mm]] as [string, unknown][]).map(([l, v]) => (
              <div key={l as string} className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2">
                <div className="dx-micro">RAIN {l}</div>
                <div className="text-lg font-bold text-white tnum">{v === null || v === undefined ? '—' : `${v}mm`}</div>
              </div>
            ))}
          </div>
        ) : <p className="text-xs mt-2">Backend offline — showing DEMO fallback only where labeled.</p>}
        <p className="text-[11px] text-slate-400 mt-2">Thresholds: warn ≥ {th.data?.warn_24h_mm}mm/24h · critical ≥ {th.data?.crit_24h_mm}mm/24h (env RAIN_WARN_24H / RAIN_CRIT_24H).</p>
        {now.data && !('error' in now.data) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2" aria-label="Current conditions">
            {[['TEMP', `${String(now.data.temp_c ?? '—')}°C`], ['HUMIDITY', `${String(now.data.humidity ?? '—')}%`], ['WIND', `${String(now.data.wind_kmh ?? '—')} km/h`], ['CONDITION', String(now.data.condition ?? now.data.source ?? '—')]].map(([l, v]) => (
              <div key={l as string} className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2">
                <div className="dx-micro">{l}</div>
                <div className="text-base font-bold text-white tnum">{v as string}</div>
              </div>
            ))}
          </div>
        )}
        {d && <div className="mt-2"><VizFigure src={wxImg} alt={wxAlt} caption={`Visual state for ${rain24}mm/24h — context only, data above is authoritative`} status={badge} /></div>}
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">PROVIDERS (FREE-FIRST)</div>
        {(pv.data?.providers ?? []).map((p) => (
          <div key={p.name} className="flex justify-between text-xs py-1 border-b border-[#1b314b]">
            <span>{p.name}</span><StatusBadge status={p.status === 'FREE/LIVE' ? 'LIVE' : p.status === 'ALWAYS_AVAILABLE' ? 'DEMO' : 'NOT_CONFIGURED'} small />
          </div>
        ))}
        <p className="text-[11px] text-slate-400 mt-2">Attribution: © Open-Meteo (CC-BY 4.0). IMD integration is an opt-in stub — never synthesized.</p>
      </div>
    </ModuleShell>
  );
}
