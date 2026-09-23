'use client';
/**
 * DRISHTI-X Settings — operator preferences + data-source transparency.
 * All settings are local (localStorage); nothing here changes backend state.
 * Existing environment variables and backend config are preserved untouched.
 */
import { useEffect, useState } from 'react';
import { ModuleShell, StatusBadge } from '@/platform/provenance';

const LS_KEY = 'dx-settings';

interface Settings {
  mapBase: string;
  layersDefaultOn: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  weatherCenter: string;
}

const DEFAULTS: Settings = {
  mapBase: 'dark',
  layersDefaultOn: true,
  reduceMotion: false,
  highContrast: false,
  weatherCenter: '21.5,79.0',
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch { /* ignore */ }
  return DEFAULTS;
}

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    setS(load());
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
    document.body.classList.toggle('a11y-still', s.reduceMotion);
    document.body.classList.toggle('a11y-contrast', s.highContrast);
  }, [s]);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  return (
    <ModuleShell
      title="Settings"
      sub="Local operator preferences + data-source transparency. Backend configuration is unchanged."
      status="LIVE"
      source="Browser localStorage (this device only)"
    >
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">MAP & DISPLAY</div>
        <label className="flex items-center justify-between gap-3 text-xs text-slate-300 py-2 border-b border-[#1b314b]">
          Default base map
          <select
            value={s.mapBase}
            onChange={(e) => set('mapBase', e.target.value)}
            className="bg-[#020b14] border border-[#1b314b] rounded px-2 py-1 text-slate-200"
            aria-label="Default base map"
          >
            <option value="dark">Dark (CartoDB)</option>
            <option value="osm">OpenStreetMap</option>
            <option value="satellite">Esri Satellite</option>
            <option value="topo">OpenTopoMap</option>
          </select>
        </label>
        <label className="flex items-center justify-between gap-3 text-xs text-slate-300 py-2 border-b border-[#1b314b]">
          Operational layers on by default
          <input type="checkbox" checked={s.layersDefaultOn} onChange={(e) => set('layersDefaultOn', e.target.checked)} aria-label="Operational layers on by default" />
        </label>
        <label className="flex items-center justify-between gap-3 text-xs text-slate-300 py-2 border-b border-[#1b314b]">
          Reduce motion (also honors OS setting)
          <input type="checkbox" checked={s.reduceMotion} onChange={(e) => set('reduceMotion', e.target.checked)} aria-label="Reduce motion" />
        </label>
        <label className="flex items-center justify-between gap-3 text-xs text-slate-300 py-2">
          High contrast text
          <input type="checkbox" checked={s.highContrast} onChange={(e) => set('highContrast', e.target.checked)} aria-label="High contrast text" />
        </label>
      </div>

      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">WEATHER CENTER (OPEN-METEO POINT)</div>
        <label className="flex items-center justify-between gap-3 text-xs text-slate-300 py-2">
          Latitude, Longitude
          <input
            value={s.weatherCenter}
            onChange={(e) => set('weatherCenter', e.target.value)}
            className="bg-[#020b14] border border-[#1b314b] rounded px-2 py-1 text-slate-200 w-40"
            aria-label="Weather center coordinates"
            placeholder="21.5,79.0"
          />
        </label>
        <p className="text-[10px] text-slate-500">Keyless Open-Meteo point readout. No raster is drawn from it — see the live map notes.</p>
      </div>

      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">LIVE DATA SOURCES & REQUIREMENTS</div>
        {[
          ['Open-Meteo weather', 'LIVE', 'No key. Always available.'],
          ['USGS earthquakes', 'LIVE', 'No key. M2.5+ past 7 days.'],
          ['NASA GIBS satellite', 'LATEST_AVAILABLE', 'No key. Daily NRT, ~1-day latency.'],
          ['OSM / Nominatim / Overpass', 'LIVE', 'No key. 1 req/s courtesy throttle.'],
          ['NASA FIRMS fire', 'NOT_CONFIGURED', 'Needs free FIRMS MAP_KEY → env FIRMS_MAP_KEY.'],
          ['Copernicus / Earthdata', 'NOT_CONFIGURED', 'Needs free account → COPERNICUS_USER / EARTHDATA_TOKEN.'],
          ['SMS / push / email', 'NOT_CONFIGURED', 'Needs provider keys → SMS_*, WEB_PUSH_*, SMTP_*.'],
        ].map(([name, st, note]) => (
          <div key={name} className="text-xs py-1.5 border-b border-[#1b314b] flex justify-between gap-2 flex-wrap">
            <span className="text-slate-200"><b>{name}</b> <span className="text-slate-500">· {note}</span></span>
            <StatusBadge status={st} small />
          </div>
        ))}
        <p className="text-[10px] text-slate-500 mt-2">
          Secrets are never committed. Provider keys belong in Vercel environment variables / server env, never in code.
        </p>
      </div>
    </ModuleShell>
  );
}
