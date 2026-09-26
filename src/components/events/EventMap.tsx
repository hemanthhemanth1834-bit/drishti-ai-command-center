'use client';
/**
 * STEP 27 — EventMap: Leaflet markers for EONET events WITH coordinates.
 * Events without coordinates never reach the map (list-only, no fake points).
 * Non-Point geometries were already excluded by the adapter.
 */
import { useEffect, useRef } from 'react';
import type { NatEvent } from './eventUtils';

interface Props {
  events: NatEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  animated: boolean;
}

const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const CAT_COLOR: Record<string, string> = {
  Wildfires: '#fb923c',
  'Severe Storms': '#38bdf8',
  Volcanoes: '#ff5470',
  Earthquakes: '#a78bfa',
  Floods: '#00d2ff',
  Landslides: '#fbbf24',
};

export function categoryColor(cat: string | null): string {
  return (cat && CAT_COLOR[cat]) || '#7de9ff';
}

export default function EventMap({ events, selectedId, onSelect, animated }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cb = useRef({ onSelect });
  cb.current = { onSelect };
  const st = useRef({ events, selectedId, animated });
  st.current = { events, selectedId, animated };

  useEffect(() => {
    let map: import('leaflet').Map | null = null;
    let dead = false;
    (async () => {
      if (!ref.current) return;
      const L = await import('leaflet');
      if (dead || !ref.current) return;
      const s = st.current;
      const m = L.map(ref.current, { zoomAnimation: s.animated }).setView([22.5, 79.5], 3);
      L.tileLayer(OSM, { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(m);
      for (const e of s.events) {
        if (!e.coordinates) continue;
        const marker = L.circleMarker([e.coordinates.lat, e.coordinates.lon], {
          radius: e.id === s.selectedId ? 9 : 6,
          color: categoryColor(e.properties.categoryTitle),
          weight: e.id === s.selectedId ? 3 : 1.5,
          fillColor: categoryColor(e.properties.categoryTitle),
          fillOpacity: 0.6,
        });
        const p = e.properties;
        marker.bindPopup(
          `<b>${p.title}</b><br/>${p.categoryTitle ?? 'Uncategorized'} · ${e.timestamp ? e.timestamp.slice(0, 16).replace('T', ' ') + ' UTC' : 'time unknown'}`,
        );
        marker.on('click', () => cb.current.onSelect(e.id));
        marker.addTo(m);
      }
      map = m;
    })();
    return () => { dead = true; try { map?.remove(); } catch { /* noop */ } };
  }, [events, selectedId, animated]);

  function toggleFull() {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void el.requestFullscreen?.().catch(() => undefined);
  }

  return (
    <div ref={wrapRef}>
      <div ref={ref} style={{ height: 440 }} className="rounded-xl border border-[#1b314b]" role="application" aria-label="EONET natural event map" />
      <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-400 mt-1.5">
        <span aria-label="Map legend">Marker color = EONET category (names in popups/lists, never color alone)</span>
        <button type="button" onClick={toggleFull} className="dx-touch ml-auto px-2.5 py-1 rounded border border-[#1b314b] text-slate-200 hover:border-[#00d2ff]/60 font-bold" aria-label="View event map fullscreen">
          FULLSCREEN
        </button>
      </div>
    </div>
  );
}
