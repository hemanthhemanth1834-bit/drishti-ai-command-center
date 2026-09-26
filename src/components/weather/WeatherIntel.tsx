'use client';
/**
 * STEP 26 — WeatherIntel: Open-Meteo intelligence through the Step 22 engine.
 * Current (OBSERVED) and forecast (FORECAST) are never merged: separate
 * panels, separate labels. Missing metrics render NOT AVAILABLE, never zero.
 * No severe-weather alerts: Open-Meteo values are not official warnings.
 */
import { useEffect, useMemo, useState } from 'react';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import { fetchDataset, type DatasetResult } from '@/data/engine/engine';
import type { DataRecord } from '@/data/engine/types';
import type { DailyProperties, HourlyProperties, WeatherProperties } from '@/data/engine/adapters';
import { SHOWCASE_CITIES } from '@/config/regions';
import { useRegion } from '@/platform/regionStore';
import {
  fmt,
  fmtDay,
  fmtHour,
  isCurrentRecord,
  isDailyRecord,
  isHourlyRecord,
  weatherCodeText,
  windCompass,
} from '@/components/weather/weatherUtils';

type WxRecord =
  | DataRecord<WeatherProperties>
  | DataRecord<HourlyProperties>
  | DataRecord<DailyProperties>;

/** Index of the showcase city matching shared-location coords (within ~1km), else -1. */
function matchSharedCity(lat: number | null, lon: number | null): number {
  if (lat == null || lon == null) return -1;
  return SHOWCASE_CITIES.findIndex(
    (c) => c.lat != null && c.lon != null && Math.abs(c.lat - lat) < 0.011 && Math.abs(c.lon - lon) < 0.011,
  );
}

export default function WeatherIntel() {
  const region = useRegion();
  const sharedIdx = matchSharedCity(region.lat, region.lon);
  const [cityIdx, setCityIdx] = useState(() => (sharedIdx >= 0 ? sharedIdx : 7));
  const [refreshKey, setRefreshKey] = useState(0);
  const [result, setResult] = useState<DatasetResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const city = SHOWCASE_CITIES[cityIdx] ?? SHOWCASE_CITIES[0];
  const lat = city.lat ?? 21.5;
  const lon = city.lon ?? 79.0;

  useEffect(() => {
    let dead = false;
    setLoading(true);
    setFailed(false);
    fetchDataset('openmeteo-current', { lat, lon }, { timeoutMs: 15000, maxRetries: 1, forceRefresh: refreshKey > 0 })
      .then((r) => { if (!dead) { setResult(r); setLoading(false); } })
      .catch(() => { if (!dead) { setFailed(true); setLoading(false); } });
    return () => { dead = true; };
  }, [lat, lon, refreshKey]);

  const records = useMemo(() => ((result?.records ?? []) as unknown as WxRecord[]), [result]);
  const current = useMemo(() => records.find(isCurrentRecord), [records]);
  const hourly = useMemo(() => records.filter(isHourlyRecord).slice(0, 24), [records]);
  const daily = useMemo(() => records.filter(isDailyRecord).slice(0, 7), [records]);
  const cur = current?.properties as WeatherProperties | undefined;
  const prov = result?.provenance ?? null;
  const headStatus = result ? result.provenance.status : loading ? 'OFFLINE' : 'ERROR';

  return (
    <ModuleShell
      title="Weather Intelligence — Open-Meteo Direct"
      sub="Current conditions are OBSERVED model values; future values are FORECAST. Forecasts may differ from actual conditions and are not official warnings."
      status={headStatus}
      source="Open-Meteo (CC-BY 4.0) via DRISHTI-X data engine"
    >
      <div className="dx-hud" aria-label="Location and refresh">
        <div className="dx-hud-edge" />
        <div className="flex gap-2 flex-wrap items-end text-xs">
          <label className="flex flex-col gap-1 text-slate-400">LOCATION
            <select
              value={cityIdx}
              onChange={(e) => setCityIdx(Number(e.target.value))}
              className="bg-[#020b14] border border-[#1b314b] rounded px-2 py-1.5 text-slate-200 min-h-[44px]"
              aria-label="Location preset"
            >
              {SHOWCASE_CITIES.map((c, i) => (
                <option key={c.code} value={i}>{c.name} · {(c.lat ?? 0).toFixed(2)}, {(c.lon ?? 0).toFixed(2)}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className="dx-touch px-3 py-1.5 rounded border border-[#1b314b] text-slate-200 hover:border-[#00d2ff]/60 font-bold" aria-label="Refresh weather data">
            REFRESH
          </button>
          {sharedIdx >= 0 && cityIdx !== sharedIdx && (
            <button type="button" onClick={() => setCityIdx(sharedIdx)} className="dx-touch px-3 py-1.5 rounded border border-[#00d2ff]/60 text-[#7de9ff] font-bold" aria-label={`Use shared location ${region.label}`}>
              USE SHARED LOCATION
            </button>
          )}
          {sharedIdx >= 0 && cityIdx === sharedIdx && (
            <span className="text-[#7de9ff] text-[11px]">USING SHARED LOCATION: {region.label}</span>
          )}
          {region.lat != null && sharedIdx < 0 && (
            <span className="text-slate-500 text-[11px]">Shared location ({region.label}) has no showcase-city match — nearest city selected manually.</span>
          )}
          {prov && (
            <span className="text-slate-500 text-[11px]">
              Retrieved {prov.retrievedAt.slice(0, 16).replace('T', ' ')} UTC · cache {result?.cache} · {result?.freshness}
            </span>
          )}
          {result && <StatusBadge status={result.provenance.status} small />}
        </div>
      </div>

      {loading && <p className="text-xs text-slate-400 mt-2" role="status">Loading Open-Meteo…</p>}
      {failed && !result && (
        <p className="text-xs text-rose-400 mt-2" role="alert">WEATHER DATA UNAVAILABLE — Open-Meteo unreachable and no cached data. No fallback temperatures generated.</p>
      )}

      {cur && (
        <div className="dx-hud mt-3" aria-label="Current conditions (observed)">
          <div className="dx-hud-edge" />
          <div className="dx-micro">CURRENT CONDITIONS · OBSERVED MODEL VALUES</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2">
            {[
              ['TEMPERATURE', fmt(cur.temperatureC, '°C')],
              ['FEELS LIKE', fmt(cur.feelsLikeC, '°C')],
              ['CONDITION', weatherCodeText(cur.weatherCode)],
              ['HUMIDITY', fmt(cur.humidityPct, '%', 0)],
              ['PRECIPITATION', fmt(cur.precipitationMm, 'mm')],
              ['WIND', cur.windKph != null ? `${cur.windKph.toFixed(1)} km/h ${windCompass(cur.windDirDeg).split(' ')[0]}` : 'NOT AVAILABLE'],
              ['WIND GUST', fmt(cur.windGustKph, 'km/h')],
              ['PRESSURE', fmt(cur.pressureHpa, 'hPa', 0)],
              ['CLOUD COVER', fmt(cur.cloudPct, '%', 0)],
              ['WIND DIR', windCompass(cur.windDirDeg)],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2 min-w-0">
                <div className="dx-micro">{k}</div>
                <div className="text-white font-bold tnum truncate" title={v}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hourly.length > 0 && (
        <div className="dx-hud mt-3" aria-label="Hourly forecast">
          <div className="dx-hud-edge" />
          <div className="dx-micro">HOURLY FORECAST · NEXT {hourly.length}H (MODEL FORECAST, NOT OBSERVED)</div>
          <ol className="mt-2 flex gap-2 overflow-x-auto pb-1 text-[11px]">
            {hourly.map((h) => {
              const p = h.properties as HourlyProperties;
              return (
                <li key={h.id} className="shrink-0 w-[92px] bg-[#091a2e] rounded-lg border border-[#1b314b] p-2 text-center">
                  <div className="text-slate-500 tnum">{fmtHour(p.hourIso)}</div>
                  <div className="text-white font-bold tnum">{p.temperatureC != null ? `${p.temperatureC.toFixed(0)}°` : '—'}</div>
                  <div className="text-slate-400 truncate" title={weatherCodeText(p.weatherCode)}>{weatherCodeText(p.weatherCode)}</div>
                  <div className="text-sky-300 tnum">{p.precipitationMm != null ? `${p.precipitationMm.toFixed(1)}mm` : '—'}</div>
                  <div className="text-slate-500 tnum">{p.precipitationProbPct != null ? `${p.precipitationProbPct}%` : 'prob n/a'}</div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {daily.length > 0 && (
        <div className="dx-hud mt-3" aria-label="Daily forecast">
          <div className="dx-hud-edge" />
          <div className="dx-micro">7-DAY FORECAST · MODEL FORECAST</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs mt-2">
            {daily.map((d) => {
              const p = d.properties as DailyProperties;
              return (
                <div key={d.id} className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2 min-w-0">
                  <div className="dx-micro">{fmtDay(p.date)}</div>
                  <div className="text-white font-bold tnum">
                    {p.tempMinC != null && p.tempMaxC != null ? `${p.tempMinC.toFixed(0)}° / ${p.tempMaxC.toFixed(0)}°` : 'NOT AVAILABLE'}
                  </div>
                  <div className="text-slate-400 truncate" title={weatherCodeText(p.weatherCode)}>{weatherCodeText(p.weatherCode)}</div>
                  <div className="text-sky-300 tnum">{p.precipitationMm != null ? `${p.precipitationMm.toFixed(1)}mm` : '—'}</div>
                  <div className="text-slate-500 tnum">{p.precipitationProbPct != null ? `${p.precipitationProbPct}%` : 'prob n/a'}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {prov && (
        <div className="dx-hud mt-3" aria-label="Provenance">
          <div className="dx-hud-edge" />
          <div className="dx-micro">PROVENANCE</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2">
            {[
              ['SOURCE', 'Open-Meteo'],
              ['DATA TYPE', 'Current + hourly + daily'],
              ['LOCATION', `${city.name} · ${lat.toFixed(2)}, ${lon.toFixed(2)}`],
              ['SOURCE TIME', cur ? 'current block (model)' : '—'],
              ['RETRIEVED', prov.retrievedAt.slice(0, 16).replace('T', ' ') + ' UTC'],
              ['STATUS', prov.status],
              ['COVERAGE', 'Point forecast — not a regional raster'],
              ['ATTRIBUTION', prov.attribution],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2 min-w-0">
                <div className="dx-micro">{k}</div>
                <div className="text-slate-200 font-bold break-words">{v}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Forecasts are model output and may differ from actual conditions. No official alert source is
            configured — forecast values are never presented as emergency warnings.
          </p>
        </div>
      )}
    </ModuleShell>
  );
}
