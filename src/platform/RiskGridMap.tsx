'use client';
/**
 * DRISHTI-X EO risk map: verified base layers + live GIBS overlays +
 * backend risk/incident/sensor/road/shelter overlays. Tile events drive
 * per-layer LIVE/UNAVAILABLE — never claimed, always measured.
 */
import { useEffect, useRef, useState } from 'react';
import { get } from '@/platform/api';
import { BASE_LAYERS, EO_LAYERS, type Preset } from '@/platform/eoLayers';

interface Cell {
  id: string; lat: number; lon: number; probability: number; risk_level: string;
  slope_deg: number; rainfall_24h: number; history_count: number;
  nearby_roads: number; nearby_places: number; simulated: boolean;
}

const RISK_COLOR: Record<string, string> = { LOW: '#34d399', MODERATE: '#fbbf24', HIGH: '#fb923c', CRITICAL: '#ff5470' };

export interface InspectPoint { lat: number; lon: number }

interface Props {
  base: string;
  eoOn: string[];
  compare: number;
  preset: Preset | null;
  cells: Cell[];
  gridStatus: string;
  onInspect: (p: InspectPoint) => void;
  onLayerStatus: (id: string, status: 'LIVE' | 'UNAVAILABLE') => void;
}

export default function RiskGridMap({ base, eoOn, compare, preset, cells, gridStatus, onInspect, onLayerStatus }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cb = useRef({ onInspect, onLayerStatus });
  cb.current = { onInspect, onLayerStatus };
  const [cursor, setCursor] = useState<{ lat: number; lon: number; zoom: number } | null>(null);
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    let map: import('leaflet').Map | null = null;
    let dead = false;
    (async () => {
      if (!ref.current) return;
      const L = await import('leaflet');
      if (dead || !ref.current) return;
      const view: [number, number] = preset ? [preset.lat, preset.lon] : [25.5, 92.5];
      const m: import('leaflet').Map = L.map(ref.current).setView(view, preset ? preset.zoom : 6);
      L.control.scale({ imperial: false }).addTo(m);
      const bl = BASE_LAYERS.find((b) => b.id === base) ?? BASE_LAYERS[0];
      L.tileLayer(bl.url, { attribution: bl.attribution, maxZoom: bl.maxZoom }).addTo(m);

      // Live-status-tracked tile layer helper
      const tracked = (id: string, url: string, attribution: string, opacity: number, maxZoom = 9) => {
        let ok = 0; let bad = 0; let reported = false;
        const layer = L.tileLayer(url, { attribution, opacity, maxZoom, errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' });
        layer.on('tileload', () => {
          ok += 1;
          if (!reported && ok >= 2) { reported = true; cb.current.onLayerStatus(id, 'LIVE'); }
        });
        layer.on('tileerror', () => {
          bad += 1;
          if (!reported && bad >= 4 && ok === 0) { reported = true; cb.current.onLayerStatus(id, 'UNAVAILABLE'); }
        });
        // If tiles are cached and neither fires promptly, re-check after idle
        setTimeout(() => { if (!reported && !dead) { reported = true; cb.current.onLayerStatus(id, ok > 0 ? 'LIVE' : 'UNAVAILABLE'); } }, 12000);
        return layer;
      };

      for (const id of eoOn) {
        const def = EO_LAYERS.find((e) => e.id === id);
        if (!def || def.kind !== 'gibs' || !def.url) continue;
        const op = id === 'modis-721' ? compare : def.opacity;
        tracked(id, def.url, def.attribution, op).addTo(m);
      }

      // AI risk heatmap (backend cells)
      for (const c of cells) {
        L.circle([c.lat, c.lon], {
          radius: 22000, color: RISK_COLOR[c.risk_level] ?? '#64748b',
          fillColor: RISK_COLOR[c.risk_level] ?? '#64748b', fillOpacity: 0.35, weight: 1,
        }).bindPopup(
          `<b>${c.risk_level}</b> ${(c.probability * 100).toFixed(0)}% (MODEL grid: ${gridStatus})<br/>slope ${c.slope_deg}° · rain ${c.rainfall_24h}mm<br/>history ${c.history_count} · roads ${c.nearby_roads} · places ${c.nearby_places}`
        ).addTo(m);
      }

      const api = await import('@/platform/api');
      if (eoOn.includes('sensors')) {
        const s = await api.get<{ network?: { sensor_id: string; lat: number; lon: number; status: string }[] }>('/api/v1/sensors/network');
        for (const n of s.data?.network ?? []) {
          if (n.lat && n.lon) {
            L.circleMarker([n.lat, n.lon], { radius: 5, color: '#00d2ff' })
              .bindPopup(`Sensor ${n.sensor_id} · ${n.status} (DEMO registry)`).addTo(m);
          }
        }
      }
      if (eoOn.includes('roads')) {
        const r = await api.get<{ roads: { lat: number; lon: number; name: string; status: string }[] }>('/api/v1/roads');
        for (const rd of r.data?.roads ?? []) {
          if (rd.lat && rd.lon) {
            L.circleMarker([rd.lat, rd.lon], { radius: 4, color: '#fbbf24' })
              .bindPopup(`Road ${rd.name} · ${rd.status} (DEMO registry — verify before action)`).addTo(m);
          }
        }
      }
      if (eoOn.includes('shelters')) {
        const r = await api.get<{ shelters: { lat: number; lon: number; name: string; free: number }[] }>('/api/v1/resources/shelters');
        for (const s of r.data?.shelters ?? []) {
          if (s.lat && s.lon) {
            L.circleMarker([s.lat, s.lon], { radius: 6, color: '#34d399' })
              .bindPopup(`Shelter ${s.name} · free ${s.free} (operator/DEMO data)`).addTo(m);
          }
        }
      }
      if (eoOn.includes('incidents')) {
        const r = await api.get<{ incidents: { lat: number; lon: number; type: string; severity: string; verified: boolean; id: string }[] }>('/api/v1/incidents?limit=50');
        for (const i of r.data?.incidents ?? []) {
          if (i.lat && i.lon) {
            L.circleMarker([i.lat, i.lon], { radius: 5, color: i.verified ? '#ff5470' : '#fb923c' })
              .bindPopup(`Incident ${i.id} · ${i.type} · ${i.severity} · ${i.verified ? 'VERIFIED' : 'UNVERIFIED'}`).addTo(m);
          }
        }
      }

      m.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        cb.current.onInspect({ lat: Number(e.latlng.lat.toFixed(4)), lon: Number(e.latlng.lng.toFixed(4)) });
      });
      m.on('mousemove', (e: import('leaflet').LeafletMouseEvent) => {
        if (!dead) setCursor({ lat: Number(e.latlng.lat.toFixed(4)), lon: Number(e.latlng.lng.toFixed(4)), zoom: m.getZoom() });
      });
      m.on('zoomend', () => {
        if (!dead) {
          const c = m.getCenter();
          setCursor({ lat: Number(c.lat.toFixed(4)), lon: Number(c.lng.toFixed(4)), zoom: m.getZoom() });
        }
      });
      map = m;
    })();
    return () => { dead = true; try { map?.remove(); } catch { /* noop */ } };
  }, [base, eoOn, compare, cells, gridStatus, preset]);

  return (
    <div ref={wrapRef}>
      <div ref={ref} style={{ height: 480, borderRadius: 12 }} aria-label="DRISHTI-X disaster intelligence map (Leaflet + live EO)" />
      <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-400 mt-1.5" aria-label="Map readout">
        <span className="tnum" role="status">
          {cursor ? `${cursor.lat.toFixed(4)}°N, ${cursor.lon.toFixed(4)}°E · ZOOM ${cursor.zoom}` : 'Hover the map for coordinates'}
        </span>
        <button
          type="button"
          aria-pressed={isFull}
          aria-label={isFull ? 'Exit fullscreen map' : 'View map fullscreen'}
          onClick={() => {
            const el = wrapRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
            if (!el) return;
            if (document.fullscreenElement) {
              void document.exitFullscreen().catch(() => undefined);
            } else if (el.requestFullscreen) {
              void el.requestFullscreen().catch(() => undefined);
            } else if (el.webkitRequestFullscreen) {
              el.webkitRequestFullscreen();
            }
          }}
          className="dx-touch ml-auto px-2.5 py-1 rounded border border-[#1b314b] text-slate-200 hover:border-[#00d2ff]/60 font-bold"
        >
          {isFull ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}
        </button>
      </div>
      <MapFullscreenWatcher onChange={setIsFull} />
    </div>
  );
}

function MapFullscreenWatcher({ onChange }: { onChange: (v: boolean) => void }) {
  useEffect(() => {
    const fn = () => onChange(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', fn);
    return () => document.removeEventListener('fullscreenchange', fn);
  }, [onChange]);
  return null;
}
