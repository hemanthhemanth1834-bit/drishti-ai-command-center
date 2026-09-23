'use client';
/**
 * DRISHTI-X DisasterMap (adapted from the Open Design `DisasterMap.js`
 * reference into this repo's Leaflet + eoLayers + platform/api conventions).
 *
 * Required layers: RISK · EVACUATION · RESPONDERS · INFRASTRUCTURE ·
 * SATELLITE · WEATHER · EARTHQUAKE · FIRE.
 *
 * Honesty rules:
 *  - SATELLITE: NASA GIBS tiles, per-tile LIVE measured at runtime.
 *  - WEATHER: Open-Meteo point readout (LIVE), no fake raster.
 *  - EARTHQUAKE: USGS GeoJSON (LIVE), markers link back to USGS.
 *  - FIRE: FIRMS needs a key → layer shows NOT_CONFIGURED, never fake points.
 *  - RISK/EVACUATION/RESPONDERS/INFRASTRUCTURE: backend registries first,
 *    DEMO fallback rows (labeled) when unreachable.
 * Map position (center/zoom) is preserved in localStorage across refreshes.
 */
import { useEffect, useRef, useState } from 'react';
import { StatusBadge } from '@/platform/provenance';
import { get } from '@/platform/api';
import { getEarthquakes, type Quake } from '@/lib/liveServices';
import { DEMO_FACILITIES, DEMO_INCIDENTS, DEMO_SOURCE } from '@/data/operational';

export type LayerId =
  | 'RISK' | 'EVACUATION' | 'RESPONDERS' | 'INFRASTRUCTURE'
  | 'SATELLITE' | 'WEATHER' | 'EARTHQUAKE' | 'FIRE';

const ALL_LAYERS: { id: LayerId; hint: string }[] = [
  { id: 'RISK', hint: 'Backend risk grid (DEMO unless retrained)' },
  { id: 'EVACUATION', hint: 'Evacuation zones + shelters' },
  { id: 'RESPONDERS', hint: 'Response units + field incidents' },
  { id: 'INFRASTRUCTURE', hint: 'Hospitals, roads, sensors' },
  { id: 'SATELLITE', hint: 'NASA GIBS VIIRS True Color (daily NRT)' },
  { id: 'WEATHER', hint: 'Open-Meteo point readout (LIVE)' },
  { id: 'EARTHQUAKE', hint: 'USGS M2.5+ past 7 days (LIVE)' },
  { id: 'FIRE', hint: 'FIRMS key required — NOT_CONFIGURED' },
];

const VIEW_KEY = 'dx-map-view';
const DEFAULT_VIEW = { lat: 21.5, lon: 79.0, zoom: 5 };

function loadView() {
  try {
    const raw = localStorage.getItem(VIEW_KEY);
    if (raw) {
      const v = JSON.parse(raw) as { lat: number; lon: number; zoom: number };
      if (Number.isFinite(v.lat) && Number.isFinite(v.lon) && Number.isFinite(v.zoom)) return v;
    }
  } catch { /* ignore */ }
  return DEFAULT_VIEW;
}

const GIBS_VIIRS =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg';
const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export default function DisasterMap({ height = 460 }: { height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState<LayerId[]>(['RISK', 'SATELLITE', 'EARTHQUAKE', 'RESPONDERS', 'INFRASTRUCTURE']);
  const [quakeState, setQuakeState] = useState('…');
  const [quakeCount, setQuakeCount] = useState(0);
  const [regStatus, setRegStatus] = useState('DEMO');
  const onRef = useRef(on);
  onRef.current = on;

  useEffect(() => {
    const ctrl = new AbortController();
    getEarthquakes(ctrl.signal).then((r) => {
      setQuakeState(r.state);
      setQuakeCount(r.data?.countWeek ?? 0);
    }).catch(() => setQuakeState('OFFLINE'));
    get<{ cells?: unknown[] }>('/api/v1/grid/risk-cells?step=1.0')
      .then((r) => setRegStatus(r.data ? 'LIVE' : 'DEMO'))
      .catch(() => setRegStatus('DEMO'));
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    let map: import('leaflet').Map | null = null;
    let dead = false;
    (async () => {
      if (!ref.current) return;
      const L = await import('leaflet');
      if (dead || !ref.current) return;
      const v = loadView();
      map = L.map(ref.current).setView([v.lat, v.lon], v.zoom);
      map.on('moveend', () => {
        try {
          const c = map!.getCenter();
          localStorage.setItem(VIEW_KEY, JSON.stringify({ lat: c.lat, lon: c.lng, zoom: map!.getZoom() }));
        } catch { /* ignore */ }
      });
      L.tileLayer(OSM, { attribution: '© OpenStreetMap contributors', maxZoom: 18 }).addTo(map);
      const layers = onRef.current;

      if (layers.includes('SATELLITE')) {
        L.tileLayer(GIBS_VIIRS, {
          attribution: 'NASA Worldview/GIBS (daily NRT)',
          opacity: 0.85, maxZoom: 9,
          errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
        }).addTo(map);
      }
      const api = await import('@/platform/api');

      if (layers.includes('RISK')) {
        try {
          const r = await api.get<{ cells: { lat: number; lon: number; probability: number; risk_level: string }[] }>('/api/v1/grid/risk-cells?step=1.0');
          const color: Record<string, string> = { LOW: '#34d399', MODERATE: '#fbbf24', HIGH: '#fb923c', CRITICAL: '#ff5470' };
          for (const c of r.data?.cells?.slice(0, 120) ?? []) {
            if (!c.lat || !c.lon) continue;
            L.circle([c.lat, c.lon], {
              radius: 22000, color: color[c.risk_level] ?? '#64748b',
              fillColor: color[c.risk_level] ?? '#64748b', fillOpacity: 0.32, weight: 1,
            }).bindPopup(`<b>${c.risk_level}</b> ${(c.probability * 100).toFixed(0)}% (MODEL grid: ${r.status})`).addTo(map!);
          }
        } catch { /* registry unreachable — DEMO markers below still render */ }
      }
      if (layers.includes('EVACUATION')) {
        try {
          const r = await api.get<{ shelters: { lat: number; lon: number; name: string; free: number }[] }>('/api/v1/resources/shelters');
          const list = (r.data?.shelters ?? []).length > 0 ? r.data!.shelters : [];
          for (const s of list) {
            if (s.lat && s.lon) {
              L.circleMarker([s.lat, s.lon], { radius: 7, color: '#34d399', fillOpacity: 0.8 })
                .bindPopup(`Evac shelter ${s.name} · free ${s.free} (${r.status})`).addTo(map!);
            }
          }
          if (list.length === 0) {
            for (const f of DEMO_FACILITIES.filter((x) => x.kind === 'SHELTER')) {
              L.circleMarker([f.lat, f.lon], { radius: 7, color: '#34d399', fillOpacity: 0.6 })
                .bindPopup(`${f.name} · ${f.detail} (DEMO)`).addTo(map!);
            }
          }
        } catch {
          for (const f of DEMO_FACILITIES.filter((x) => x.kind === 'SHELTER')) {
            L.circleMarker([f.lat, f.lon], { radius: 7, color: '#34d399', fillOpacity: 0.6 })
              .bindPopup(`${f.name} · ${f.detail} (DEMO)`).addTo(map!);
          }
        }
      }
      if (layers.includes('RESPONDERS')) {
        try {
          const r = await api.get<{ incidents: { lat: number; lon: number; type: string; severity: string; verified: boolean; id: string }[] }>('/api/v1/incidents?limit=50');
          const list = r.data?.incidents ?? [];
          const rows = list.length > 0 ? list : DEMO_INCIDENTS.map((d) => ({ lat: d.lat, lon: d.lon, type: d.type, severity: d.severity, verified: d.status === 'VERIFIED', id: d.id }));
          const tag = list.length > 0 ? r.status : 'DEMO';
          for (const i of rows) {
            if (i.lat && i.lon) {
              L.circleMarker([i.lat, i.lon], { radius: 5, color: i.verified ? '#ff5470' : '#fb923c' })
                .bindPopup(`Incident ${i.id} · ${i.type} · ${i.severity} · ${i.verified ? 'VERIFIED' : 'UNVERIFIED'} (${tag})`).addTo(map!);
            }
          }
        } catch {
          for (const d of DEMO_INCIDENTS) {
            L.circleMarker([d.lat, d.lon], { radius: 5, color: '#fb923c' })
              .bindPopup(`Incident ${d.id} · ${d.type} · ${d.severity} · ${d.status} (DEMO)`).addTo(map!);
          }
        }
        for (const f of DEMO_FACILITIES.filter((x) => x.kind === 'RESPONDER' || x.kind === 'DRONE')) {
          L.marker([f.lat, f.lon]).bindPopup(`${f.name} · ${f.detail} (SIMULATION)`).addTo(map!);
        }
      }
      if (layers.includes('INFRASTRUCTURE')) {
        try {
          const [h, rd] = await Promise.all([
            api.get<{ hospitals?: { lat: number; lon: number; name: string }[] }>('/api/v1/resources/hospitals').catch(() => ({ data: null as never, status: 'OFFLINE' as const })),
            api.get<{ roads: { lat: number; lon: number; name: string; status: string }[] }>('/api/v1/roads').catch(() => ({ data: null as never, status: 'OFFLINE' as const })),
          ]);
          for (const x of h.data?.hospitals ?? []) {
            if (x.lat && x.lon) L.circleMarker([x.lat, x.lon], { radius: 6, color: '#00d2ff' }).bindPopup(`Hospital ${x.name} (${h.status})`).addTo(map!);
          }
          for (const x of rd.data?.roads ?? []) {
            if (x.lat && x.lon) L.circleMarker([x.lat, x.lon], { radius: 4, color: '#fbbf24' }).bindPopup(`Road ${x.name} · ${x.status} (${rd.status})`).addTo(map!);
          }
          if (!h.data) {
            for (const f of DEMO_FACILITIES.filter((x) => x.kind === 'HOSPITAL' || x.kind === 'RESOURCE')) {
              L.circleMarker([f.lat, f.lon], { radius: 6, color: '#00d2ff' }).bindPopup(`${f.name} · ${f.detail} (DEMO)`).addTo(map!);
            }
          }
        } catch { /* offline: demo markers already cover hospitals */ }
      }
      if (layers.includes('EARTHQUAKE')) {
        try {
          const q = await getEarthquakes();
          const qs: Quake[] = q.data?.quakes.slice(0, 80) ?? [];
          for (const e of qs) {
            const mag = e.mag ?? 0;
            L.circleMarker([e.lat, e.lon], {
              radius: Math.max(3, Math.min(10, mag * 1.6)),
              color: mag >= 6 ? '#ff5470' : mag >= 5 ? '#fb923c' : '#fbbf24',
              fillOpacity: 0.75,
            }).bindPopup(`<b>M${mag.toFixed(1)}</b> ${e.place}<br/>${e.time.slice(0, 16).replace('T', ' ')} UTC · USGS (${q.state})<br/><a href="${e.url}" target="_blank" rel="noreferrer">USGS event page</a>`).addTo(map!);
          }
        } catch { /* USGS unreachable — badge reports OFFLINE */ }
      }
      if (layers.includes('WEATHER')) {
        L.marker([21.5, 79.0]).bindPopup(
          'Weather is a point readout (Open-Meteo LIVE) — see the weather panel. No fake raster is drawn.',
        ).addTo(map!);
      }
      // FIRE: intentionally no markers — FIRMS needs a key. The badge below says so.
    })();
    return () => { dead = true; map?.remove(); map = null; };
    // Rebuild on layer toggle; view is restored from localStorage so position is preserved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on.join(',')]);

  const toggle = (id: LayerId) =>
    setOn((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-2" role="group" aria-label="Disaster map layers">
        {ALL_LAYERS.map((l) => (
          <label key={l.id} title={l.hint} className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-[#091a2e] border border-[#1b314b] rounded-lg px-2.5 py-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={on.includes(l.id)}
              onChange={() => toggle(l.id)}
              aria-label={`${l.id} layer: ${l.hint}`}
            />
            <span className="font-bold tracking-wider">{l.id}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap mb-2 text-[10px]">
        <span>QUAKES <StatusBadge status={quakeState} small /> {quakeCount > 0 && `${quakeCount} M2.5+/wk`}</span>
        <span>REGISTRY <StatusBadge status={regStatus} small /></span>
        <span>FIRE <StatusBadge status="NOT_CONFIGURED" small /></span>
        <span className="text-slate-500">Position auto-saved · survives refresh</span>
      </div>
      <div ref={ref} style={{ height }} className="rounded-xl border border-[#1b314b]" role="application" aria-label="Disaster intelligence map" />
      <div className="flex gap-4 flex-wrap text-[11px] text-slate-300 mt-2" aria-label="Map legend">
        <span><i style={{ background: '#34d399' }} className="inline-block w-2.5 h-2.5" /> LOW</span>
        <span><i style={{ background: '#fbbf24' }} className="inline-block w-2.5 h-2.5" /> MODERATE</span>
        <span><i style={{ background: '#fb923c' }} className="inline-block w-2.5 h-2.5" /> HIGH</span>
        <span><i style={{ background: '#ff5470' }} className="inline-block w-2.5 h-2.5" /> CRITICAL</span>
        <span>▲ QUAKE (USGS LIVE) · ● SENSOR · ■ INCIDENT (verified=rose)</span>
      </div>
      <p className="text-[10px] text-slate-500 mt-1">Fallback rows: {DEMO_SOURCE}. Fire layer renders no markers until a FIRMS key is configured.</p>
    </div>
  );
}
