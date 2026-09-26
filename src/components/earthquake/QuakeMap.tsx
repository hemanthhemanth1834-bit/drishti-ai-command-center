'use client';
/**
 * STEP 25 — QuakeMap: Leaflet visualization of normalized USGS records.
 * Marker size = magnitude (linear rule), ring color = depth bucket AND
 * numeric depth in every popup (never color alone). Click selects.
 */
import { useEffect, useRef } from 'react';
import { depthColor, formatDepth, formatMagnitude, magnitudeRadius, type Quake } from './quakeUtils';

interface Props {
  quakes: Quake[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  animated: boolean;
}

const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export default function QuakeMap({ quakes, selectedId, onSelect, animated }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cb = useRef({ onSelect });
  cb.current = { onSelect };
  const stateRef = useRef({ quakes, selectedId, animated });
  stateRef.current = { quakes, selectedId, animated };

  useEffect(() => {
    let map: import('leaflet').Map | null = null;
    let dead = false;
    (async () => {
      if (!ref.current) return;
      const L = await import('leaflet');
      if (dead || !ref.current) return;
      const m = L.map(ref.current, { zoomAnimation: stateRef.current.animated }).setView([22.5, 79.5], 4);
      L.tileLayer(OSM, { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(m);
      const st = stateRef.current;
      for (const q of st.quakes) {
        if (!q.coordinates) continue;
        const mag = q.properties.magnitude;
        const depth = q.properties.depthKm;
        const marker = L.circleMarker([q.coordinates.lat, q.coordinates.lon], {
          radius: magnitudeRadius(mag),
          color: depthColor(depth),
          weight: q.id === st.selectedId ? 3 : 1.5,
          fillColor: depthColor(depth),
          fillOpacity: 0.55,
          className: q.id === st.selectedId && st.animated ? 'dx-quake-pulse' : undefined,
        });
        marker.bindPopup(
          `<b>${formatMagnitude(mag)}</b> — ${q.properties.place ?? 'Unknown place'}<br/>${formatDepth(depth)}<br/>${q.timestamp ? q.timestamp.slice(0, 16).replace('T', ' ') + ' UTC' : 'time unknown'}`,
        );
        marker.on('click', () => cb.current.onSelect(q.id));
        marker.addTo(m);
      }
      map = m;
    })();
    return () => { dead = true; try { map?.remove(); } catch { /* noop */ } };
  }, [quakes, selectedId, animated]);

  function toggleFull() {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void el.requestFullscreen?.().catch(() => undefined);
  }

  return (
    <div ref={wrapRef}>
      <div ref={ref} style={{ height: 440 }} className="rounded-xl border border-[#1b314b]" role="application" aria-label="USGS earthquake map" />
      <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-400 mt-1.5">
        <span aria-label="Map legend">● SHALLOW (&lt;70km) ● INTERMEDIATE ● DEEP (≥300km) — marker size = magnitude, exact values in popups</span>
        <button type="button" onClick={toggleFull} className="dx-touch ml-auto px-2.5 py-1 rounded border border-[#1b314b] text-slate-200 hover:border-[#00d2ff]/60 font-bold" aria-label="View earthquake map fullscreen">
          FULLSCREEN
        </button>
      </div>
    </div>
  );
}
