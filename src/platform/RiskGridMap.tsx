'use client';
/** NER risk grid on Leaflet: GREEN/YELLOW/ORANGE/RED + legend + layers + source. */
import { useEffect, useRef, useState } from 'react';
import { get } from '@/platform/api';

interface Cell {
  id: string; lat: number; lon: number; probability: number; risk_level: string;
  slope_deg: number; rainfall_24h: number; history_count: number;
  nearby_roads: number; nearby_places: number; simulated: boolean;
}

const COLOR: Record<string, string> = { LOW: '#34d399', MODERATE: '#fbbf24', HIGH: '#fb923c', CRITICAL: '#ff5470' };

export default function RiskGridMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [showSensors, setShowSensors] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [status, setStatus] = useState('DEMO');

  useEffect(() => {
    get<{ cells: Cell[]; data_status: string }>('/api/v1/grid/risk-cells?step=1.0').then((r) => {
      if (r.data) { setCells(r.data.cells); setStatus(r.data.data_status); }
    });
  }, []);

  useEffect(() => {
    let map: import('leaflet').Map | null = null;
    let dead = false;
    (async () => {
      if (!ref.current || !cells.length) return;
      const L = await import('leaflet');
      if (dead || !ref.current) return;
      const m: import('leaflet').Map = L.map(ref.current).setView([25.5, 92.5], 6);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 18,
      }).addTo(m);
      for (const c of cells) {
        L.circle([c.lat, c.lon], {
          radius: 22000, color: COLOR[c.risk_level] ?? '#64748b',
          fillColor: COLOR[c.risk_level] ?? '#64748b', fillOpacity: 0.35, weight: 1,
        }).bindPopup(
          `<b>${c.risk_level}</b> ${(c.probability * 100).toFixed(0)}%<br/>slope ${c.slope_deg}° · rain ${c.rainfall_24h}mm<br/>history ${c.history_count} · roads ${c.nearby_roads} · places ${c.nearby_places}`
        ).addTo(m);
      }
      if (showSensors) {
        const s = await (await import('@/platform/api')).get<{ network?: { sensor_id: string; lat: number; lon: number; status: string }[] }>('/api/v1/sensors/network');
        for (const n of s.data?.network ?? []) {
          if (n.lat && n.lon) {
            L.circleMarker([n.lat, n.lon], { radius: 5, color: '#00d2ff' })
              .bindPopup(`Sensor ${n.sensor_id} · ${n.status}`).addTo(m);
          }
        }
      }
      if (showRoads) {
        const r = await (await import('@/platform/api')).get<{ roads: { lat: number; lon: number; name: string; status: string }[] }>('/api/v1/roads');
        for (const rd of r.data?.roads ?? []) {
          if (rd.lat && rd.lon) {
            L.circleMarker([rd.lat, rd.lon], { radius: 4, color: '#fbbf24' })
              .bindPopup(`Road ${rd.name} · ${rd.status}`).addTo(m);
          }
        }
      }
      map = m;
    })();
    return () => { dead = true; try { map?.remove(); } catch { /* noop */ } };
  }, [cells, showSensors, showRoads]);

  return (
    <div>
      <div className="flex gap-4 flex-wrap text-xs text-slate-300 mb-2">
        <span className="flex gap-1 items-center"><i style={{ background: '#34d399', width: 10, height: 10, display: 'inline-block' }} /> LOW</span>
        <span className="flex gap-1 items-center"><i style={{ background: '#fbbf24', width: 10, height: 10, display: 'inline-block' }} /> MODERATE</span>
        <span className="flex gap-1 items-center"><i style={{ background: '#fb923c', width: 10, height: 10, display: 'inline-block' }} /> HIGH</span>
        <span className="flex gap-1 items-center"><i style={{ background: '#ff5470', width: 10, height: 10, display: 'inline-block' }} /> CRITICAL</span>
        <label><input type="checkbox" checked={showSensors} onChange={(e) => setShowSensors(e.target.checked)} /> sensors</label>
        <label><input type="checkbox" checked={showRoads} onChange={(e) => setShowRoads(e.target.checked)} /> roads</label>
        <span>STATUS: {status} · {cells.length} cells</span>
      </div>
      <div ref={ref} style={{ height: 440, borderRadius: 12 }} aria-label="NER risk heatmap (Leaflet + OSM)" />
    </div>
  );
}
