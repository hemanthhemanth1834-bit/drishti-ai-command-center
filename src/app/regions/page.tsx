'use client';
/** Dynamic region command: Country → State → District → City drives map/weather/risk/shelters.
 * No code changes needed for new regions — hierarchy comes from /api/regions.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import { get } from '@/platform/api';
import VizFigure from '@/platform/VizFigure';
import RealPhotoCard from '@/components/visuals/RealPhotoCard';
import { setRegion, useRegion } from '@/platform/regionStore';
import { usePT } from '@/platform/i18n';
import { SHOWCASE_CITIES, STATE_NAMES } from '@/config/regions';

interface Opt { code: string; name: string; lat?: number | null; lon?: number | null }

export default function RegionsPage() {
  const t = usePT();
  const region = useRegion();
  const [states, setStates] = useState<Opt[]>([]);
  const [districts, setDistricts] = useState<Opt[]>([]);
  const [cities, setCities] = useState<Opt[]>([]);
  const [wx, setWx] = useState<Record<string, unknown> | null>(null);
  const [risk, setRisk] = useState<Record<string, unknown> | null>(null);
  const [shelters, setShelters] = useState<{ id: string; name: string; free: number; dist_km?: number }[]>([]);

  useEffect(() => {
    get<{ states: Opt[] }>('/api/regions/states?country=IN').then((r) => {
      if (r.data) setStates(r.data.states);
    });
  }, []);

  const pickState = async (code: string) => {
    setRegion({ state: code, district: '', city: '', lat: null, lon: null });
    const d = await get<{ districts: Opt[] }>(`/api/regions/districts?state=${code}`);
    setDistricts(d.data?.districts ?? []);
    setCities([]);
  };

  const pickDistrict = async (code: string, name: string) => {
    setRegion({ district: name, city: '', lat: null, lon: null });
    const c = await get<{ cities: Opt[] }>(`/api/regions/cities?district=${code}`);
    setCities(c.data?.cities ?? []);
  };

  const pickCity = async (c: Opt) => {
    const lat = c.lat ?? null;
    const lon = c.lon ?? null;
    setRegion({ city: c.name, lat, lon });
    if (lat === null || lon === null) { setWx(null); setRisk(null); setShelters([]); return; }
    const [w, sh] = await Promise.all([
      get<Record<string, unknown>>(`/api/v1/rainfall/current?lat=${lat}&lon=${lon}`),
      get<{ shelters: { id: string; name: string; free: number; dist_km?: number }[] }>(`/api/v1/resources/nearest-shelter?lat=${lat}&lon=${lon}`),
    ]);
    setWx(w.data);
    const rr = await (await import('@/platform/api')).post<Record<string, unknown>>('/api/v1/risk/assess', { lat, lon });
    setRisk(rr.data);
    setShelters(sh.data?.shelters ?? []);
  };

  return (
    <ModuleShell title={t('region_title')} sub={t('region_sub')} status={region.lat !== null ? 'LIVE' : 'DEMO'} source="Region API + weather/risk/shelter APIs">
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">{t('context')}: {region.label}</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2">
          <label>{t('select_country')}
            <select value={region.country} onChange={() => {}} className="w-full bg-[#051424] border border-[#1b314b] rounded px-2 py-1">
              <option value="IN">India</option>
            </select>
          </label>
          <label>{t('select_state')}
            <select value={region.state} onChange={(e) => pickState(e.target.value)} className="w-full bg-[#051424] border border-[#1b314b] rounded px-2 py-1">
              <option value="">—</option>
              {states.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </label>
          <label>{t('select_district')}
            <select value={region.district} onChange={(e) => { const o = districts.find((d) => d.name === e.target.value); if (o) pickDistrict(o.code, o.name); }} className="w-full bg-[#051424] border border-[#1b314b] rounded px-2 py-1">
              <option value="">—</option>
              {districts.map((d) => <option key={d.code} value={d.name}>{d.name}</option>)}
            </select>
          </label>
          <label>{t('select_city')}
            <select value={region.city} onChange={(e) => { const o = cities.find((c) => c.name === e.target.value); if (o) pickCity(o); }} className="w-full bg-[#051424] border border-[#1b314b] rounded px-2 py-1">
              <option value="">—</option>
              {cities.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <div className="dx-micro mt-2">SHOWCASE (AP + TELANGANA — EQUAL)</div>
        <div className="flex gap-2 flex-wrap mt-1">
          {SHOWCASE_CITIES.map((c) => (
            <button key={c.code} onClick={() => {
              const st = c.code.startsWith('IN-AP') ? 'IN-AP' : 'IN-TG';
              setRegion({ state: st });
              pickState(st).then(() => pickCity({ code: c.code, name: c.name, lat: c.lat, lon: c.lon }));
            }} className="text-xs bg-[#051424] border border-[#1b314b] rounded px-2 py-1">{c.name}</button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-2">{t('demo_geo')} {Object.values(STATE_NAMES).join(' · ')}</p>
        <div className="mt-2"><VizFigure src="/img/regions.svg" alt="Schematic region hierarchy India to Andhra Pradesh Telangana districts" caption="Hierarchy schematic — boundaries not to survey scale" status="DEMO" /></div>
        <div className="mt-2"><RealPhotoCard assetId="terrain-himalaya-iss" badge="REFERENCE" contextNote="INDIA-LEVEL TERRAIN CONTEXT — archival orbital photo of India and the Himalayas. Country-level context only, never a city or survey map." /></div>
      </div>
      <div className="dx-hud">
        <div className="dx-hud-edge" />
        <div className="dx-micro">SECTORS (7) — SAME ARCHITECTURE EVERYWHERE</div>
        <div className="nesafe-vizgrid mt-2">
          <VizFigure src="/img/dis-landslide.svg" alt="Natural hazards reference" caption="Natural" status="DEMO" />
          <VizFigure src="/img/dis-flood.svg" alt="Urban flooding reference" caption="Urban" status="DEMO" />
          <VizFigure src="/img/dis-cyclone.svg" alt="Coastal cyclone reference" caption="Coastal" status="DEMO" />
          <VizFigure src="/img/dis-fire.svg" alt="Industrial fire reference" caption="Industrial" status="DEMO" />
          <VizFigure src="/img/response.svg" alt="Emergency medical response reference" caption="Health" status="DEMO" />
          <VizFigure src="/img/dis-drought.svg" alt="Drought farmland reference" caption="Agriculture" status="DEMO" />
          <VizFigure src="/img/dis-road.svg" alt="Road incident reference" caption="Transport" status="DEMO" />
        </div>
      </div>

      {region.lat === null ? (
        <div className="dx-hud"><div className="dx-hud-edge" /><p className="text-xs">{t('no_coords')}</p></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="dx-hud"><div className="dx-hud-edge" />
              <div className="dx-micro">{t('weather_now')}</div>
              <div className="text-lg font-bold text-white">{wx ? `${String(wx.rain_24h_mm ?? '?')}mm/24h` : '…'}</div>
              <div className="text-[11px] text-slate-400">{wx ? String(wx.source ?? '') : ''} {wx ? <StatusBadge status={String(wx.data_status ?? 'DEMO')} small /> : null}</div>
            </div>
            <div className="dx-hud"><div className="dx-hud-edge" />
              <div className="dx-micro">{t('risk_now')}</div>
              <div className="text-lg font-bold text-white">{risk ? `${String(risk.score)} · ${String(risk.risk_level)}` : '…'}</div>
              <div className="text-[11px] text-slate-400">deterministic engine · DEMO</div>
            </div>
            <div className="dx-hud"><div className="dx-hud-edge" />
              <div className="dx-micro">{t('shelters_near')}</div>
              {(shelters.slice(0, 3)).map((s) => (
                <div key={s.id} className="text-xs">{s.name} · free {s.free}{s.dist_km !== undefined ? ` · ${s.dist_km}km` : ''}</div>
              ))}
              {!shelters.length && <div className="text-xs">…</div>}
            </div>
          </div>
          <div className="dx-hud"><div className="dx-hud-edge" />
            <p className="text-sm text-white font-bold">{t('evacuate_now')}</p>
            <p className="text-xs text-slate-300">{t('call_help')}</p>
            <Link href="/risk-map" className="text-[#7de9ff] text-xs">Open risk map →</Link>
          </div>
        </>
      )}
    </ModuleShell>
  );
}
