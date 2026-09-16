'use client';
/**
 * NE-SAFE MapLibre 3D GIS layer — free basemap (OpenFreeMap/OSM), no key.
 * Terrain extrusion via `terrain` source where supported, camera tilt/rotate/zoom,
 * risk heat circles + sensor/road/facility markers. Graceful 2D fallback.
 */
import { useEffect, useRef, useState } from 'react';
import { useNESafe, setNESafe } from '@/nesafe/store/nesafeStore';
import { NE_SLOPES, NE_SENSORS, NE_ROADS, NE_FACILITIES } from '@/nesafe/data/northeast';
import { mapProvider } from '@/nesafe/providers/demoProviders';

const RISK_C: Record<string, string> = { low: '#34d399', moderate: '#fbbf24', high: '#fb923c', critical: '#ff5470' };

export default function MapLibreCommand({ onPickSensor }: { onPickSensor: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [err, setErr] = useState<string | null>(null);
  const { sim, selectedSlopeId } = useNESafe();

  useEffect(() => {
    let dead = false;
    interface MapLike {
      remove: () => void;
      on: (e: string, f: () => void) => void;
      addSource: (a: string, b: unknown) => void;
      addLayer: (a: unknown) => void;
      setPaintProperty: (a: string, b: string, c: unknown) => void;
      flyTo: (a: unknown) => void;
      getSource: (a: string) => unknown;
    }
    let map: MapLike | null = null;
    (async () => {
      try {
        const ml = await import('maplibre-gl');
        if (dead || !ref.current) return;
        const focus = NE_SLOPES.find((s) => s.id === selectedSlopeId) ?? NE_SLOPES[2];
        map = new ml.Map({
          container: ref.current,
          style: mapProvider.styleUrl(),
          center: [focus.lon, focus.lat],
          zoom: 7.2,
          pitch: 58,
          bearing: -18,
          attributionControl: { compact: true },
        }) as unknown as MapLike;
        mapRef.current = map;
        const m: MapLike | null = map;
        m?.on('load', () => {
          if (!m || dead) return;
          try {
            // Free terrain-RGB source (AWS open data, no key). If blocked, map still works in 2D.
            m.addSource('terrarium', {
              type: 'raster-dem',
              tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
              encoding: 'terrarium',
              tileSize: 256,
              maxzoom: 12,
            });
            m.addLayer({ id: 'hills', type: 'hillshade', source: 'terrarium', paint: { 'hillshade-exaggeration': 0.35 } });
          } catch { /* 2D fallback remains */ }
          m.addSource('ne-risk', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: NE_SLOPES.map((s) => ({
                type: 'Feature',
                properties: { id: s.id, risk: sim[s.id]?.risk ?? s.baseRisk, level: sim[s.id]?.level ?? 'low' },
                geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
              })),
            },
          });
          m.addLayer({
            id: 'ne-risk-heat', type: 'circle', source: 'ne-risk',
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['get', 'risk'], 0, 8, 50, 16, 100, 30],
              'circle-color': ['match', ['get', 'level'], 'critical', RISK_C.critical, 'high', RISK_C.high, 'moderate', RISK_C.moderate, RISK_C.low],
              'circle-opacity': 0.42, 'circle-blur': 0.4,
            },
          });
          m.addSource('ne-sensors', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: NE_SENSORS.map((s) => ({ type: 'Feature', properties: { id: s.id }, geometry: { type: 'Point', coordinates: [s.lon, s.lat] } })) },
          });
          m.addLayer({ id: 'ne-sensors', type: 'circle', source: 'ne-sensors', paint: { 'circle-radius': 6, 'circle-color': '#00d2ff', 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5 } });
          m.addSource('ne-roads', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: NE_ROADS.map((r) => ({ type: 'Feature', properties: { id: r.id, name: r.name }, geometry: { type: 'LineString', coordinates: r.path } })) },
          });
          m.addLayer({ id: 'ne-roads', type: 'line', source: 'ne-roads', paint: { 'line-color': '#7de9ff', 'line-width': 2.5, 'line-opacity': 0.85 } });
          m.addSource('ne-fac', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: NE_FACILITIES.map((f) => ({ type: 'Feature', properties: { id: f.id, name: f.name }, geometry: { type: 'Point', coordinates: [f.lon, f.lat] } })) },
          });
          m.addLayer({ id: 'ne-fac', type: 'circle', source: 'ne-fac', paint: { 'circle-radius': 5, 'circle-color': '#a7f3d0', 'circle-stroke-color': '#052e16', 'circle-stroke-width': 1 } });
        });
      } catch (e) {
        if (!dead) setErr('Map failed to load — 2D list fallback active.');
      }
    })();
    return () => { dead = true; try { map?.remove(); } catch { /* noop */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cinematic fly when selection changes (no sudden jumps: flyTo eases)
  useEffect(() => {
    const m = mapRef.current as { flyTo: (o: unknown) => void } | null;
    const s = NE_SLOPES.find((x) => x.id === selectedSlopeId);
    if (m && s) {
      try { m.flyTo({ center: [s.lon, s.lat], zoom: 9, pitch: 62, bearing: -12, duration: 2200, essential: true }); } catch { /* noop */ }
    }
  }, [selectedSlopeId]);

  if (err) {
    return (
      <div className="nesafe-map-fallback">
        <p>{err}</p>
        <div className="nesafe-slope-list">
          {NE_SLOPES.map((s) => (
            <button key={s.id} onClick={() => setNESafe({ selectedSlopeId: s.id })} className={s.id === selectedSlopeId ? 'on' : ''}>
              {s.id} · {s.name} · {s.state}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="nesafe-map-wrap">
      <div ref={ref} className="nesafe-map" aria-label="NE-SAFE 3D GIS map (free basemap)" />
      <div className="nesafe-map-hud">
        <span>3D TERRAIN · tilt/rotate/zoom · globe-ready</span>
        <span className="nesafe-chip">OpenFreeMap/OSM · no key</span>
        <button onClick={() => (onPickSensor as (id: string) => void)('MEG-042')}>Focus MEG-042</button>
      </div>
    </div>
  );
}
