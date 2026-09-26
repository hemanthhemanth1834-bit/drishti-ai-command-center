'use client';
/**
 * STEP 23 — SatelliteViewer: live NASA GIBS Earth-observation viewer.
 *
 * Layer + nominal date + opacity + location presets + fullscreen.
 * Tile liveness is MEASURED (tileload/tileerror counters) and surfaced as
 * LATEST_AVAILABLE / UNAVAILABLE / OFFLINE — never assumed. Copernicus
 * stays NOT_CONFIGURED. No fake acquisition timestamps: the panel shows
 * the SELECTED nominal date separately from the RETRIEVED time.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBadge } from '@/platform/provenance';
import { useRegion } from '@/platform/regionStore';
import {
  GIBS_LAYERS,
  copernicusState,
  earliestNominalDate,
  gibsProduct,
  gibsTileUrl,
  isSelectableDate,
  latestNominalDate,
} from '@/data/engine/satellite';

interface Preset { id: string; label: string; lat: number; lon: number; zoom: number }

const PRESETS: Preset[] = [
  { id: 'india', label: 'All India', lat: 22.5, lon: 79.5, zoom: 5 },
  { id: 'krishna', label: 'Krishna Basin', lat: 17.38, lon: 78.48, zoom: 8 },
  { id: 'kerala', label: 'Kerala Coast', lat: 10.5, lon: 76.2, zoom: 7 },
  { id: 'northeast', label: 'Northeast', lat: 26.0, lon: 93.5, zoom: 6 },
];

const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

type TileState = 'PROBING' | 'LIVE_TILES' | 'NO_TILES' | 'OFFLINE';

export default function SatelliteViewer() {
  const mapRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<{ map: unknown; overlay: unknown; L: typeof import('leaflet') } | null>(null);
  const region = useRegion();
  // Shared location becomes the first preset when set; otherwise the viewer keeps its defaults.
  const sharedPreset: Preset | null = useMemo(
    () =>
      region.lat != null && region.lon != null
        ? { id: 'shared-location', label: `Shared — ${region.label}`, lat: region.lat, lon: region.lon, zoom: 9 }
        : null,
    [region.lat, region.lon, region.label],
  );
  const presetList = useMemo(() => (sharedPreset ? [sharedPreset, ...PRESETS] : PRESETS), [sharedPreset]);
  const activePreset = presetList.find((p) => p.id === presetId) ?? PRESETS[0];
  const [layerId, setLayerId] = useState(GIBS_LAYERS[0].id);
  const [date, setDate] = useState(() => latestNominalDate());
  const [opacity, setOpacity] = useState(1);
  const [presetId, setPresetId] = useState(sharedPreset ? 'shared-location' : 'india');
  const [tileState, setTileState] = useState<TileState>('PROBING');
  const [retrievedAt, setRetrievedAt] = useState<string | null>(null);
  const [isFull, setIsFull] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const minDate = earliestNominalDate();
  const maxDate = latestNominalDate();
  const dateValid = isSelectableDate(date);
  const product = dateValid ? gibsProduct(layerId, date, presetList.find((p) => p.id === presetId)?.label ?? 'India') : null;
  const copernicus = copernicusState();

  useEffect(() => {
    let dead = false;
    let map: import('leaflet').Map | null = null;
    (async () => {
      if (!mapRef.current) return;
      const L = await import('leaflet');
      if (dead || !mapRef.current) return;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      const preset = PRESETS[0];
      const m = L.map(mapRef.current, { zoomAnimation: !reduced, fadeAnimation: !reduced }).setView(
        [preset.lat, preset.lon],
        preset.zoom,
      );
      L.tileLayer(OSM, { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(m);
      map = m;
      mapObj.current = { map: m, overlay: null, L };
      if (!dead) setMapReady(true);
    })();

    const onFull = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFull);
    return () => {
      dead = true;
      document.removeEventListener('fullscreenchange', onFull);
      try { map?.remove(); } catch { /* noop */ }
      mapObj.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply control changes to the live map without rebuilding it.
  useEffect(() => {
    if (!mapReady) return;
    const holder = mapObj.current as { map: import('leaflet').Map; overlay: { setOpacity?: (n: number) => void } | null; L: typeof import('leaflet') } | null;
    if (!holder?.map) return;
    const preset = activePreset;
    holder.map.setView([preset.lat, preset.lon], preset.zoom);
    const url = gibsTileUrl(layerId, date);
    // Rebuild overlay only (cheap, preserves view + base tiles).
    try {
      const L = holder.L;
      if (holder.overlay) {
        try { holder.map.removeLayer(holder.overlay as import('leaflet').Layer); } catch { /* noop */ }
      }
      if (url && isSelectableDate(date)) {
        setTileState('PROBING');
        setRetrievedAt(new Date().toISOString());
        let ok = 0;
        let bad = 0;
        let done = false;
        const layer = L.tileLayer(url, {
          attribution: 'Imagery: NASA Worldview / GIBS',
          opacity,
          maxZoom: 9,
          errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
        });
        layer.on('tileload', () => {
          ok += 1;
          if (!done && ok >= 2) { done = true; setTileState('LIVE_TILES'); }
        });
        layer.on('tileerror', () => {
          bad += 1;
          if (!done && bad >= 4 && ok === 0) { done = true; setTileState('NO_TILES'); }
        });
        setTimeout(() => { if (!done) { done = true; setTileState(ok > 0 ? 'LIVE_TILES' : 'NO_TILES'); } }, 12000);
        layer.addTo(holder.map);
        holder.overlay = layer;
      } else {
        holder.overlay = null;
        setTileState('NO_TILES');
      }
    } catch { /* map tearing down */ }
  }, [mapReady, layerId, date, opacity, activePreset]);

  const statusBadge = tileState === 'LIVE_TILES' ? 'LATEST_AVAILABLE' : tileState === 'NO_TILES' ? 'NOT_AVAILABLE' : tileState === 'OFFLINE' ? 'OFFLINE' : 'STALE';

  function reset() {
    setLayerId(GIBS_LAYERS[0].id);
    setDate(latestNominalDate());
    setOpacity(1);
    setPresetId(sharedPreset ? 'shared-location' : 'india');
  }

  function toggleFull() {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void el.requestFullscreen?.().catch(() => undefined);
  }

  return (
    <div ref={wrapRef} className="dx-hud">
      <div className="dx-hud-edge" />
      <div className="dx-hud-head">
        <div>
          <div className="dx-micro">SATELLITE INTELLIGENCE · NASA GIBS DAILY NRT</div>
          <div className="dx-hud-title">Live Earth-Observation Viewer</div>
        </div>
        <StatusBadge status={statusBadge} />
      </div>

      <div className="flex gap-2 flex-wrap items-end text-xs mt-2" role="group" aria-label="Satellite viewer controls">
        <label className="flex flex-col gap-1 text-slate-400">SOURCE
          <select value={layerId} onChange={(e) => setLayerId(e.target.value)} className="bg-[#020b14] border border-[#1b314b] rounded px-2 py-1.5 text-slate-200 min-h-[44px]" aria-label="Imagery layer">
            {GIBS_LAYERS.map((l) => (
              <option key={l.id} value={l.id}>{l.title} · {l.platform}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-slate-400">DATE
          <input type="date" value={date} min={minDate} max={maxDate} onChange={(e) => setDate(e.target.value)} className="bg-[#020b14] border border-[#1b314b] rounded px-2 py-1.5 text-slate-200 min-h-[44px]" aria-label="Nominal acquisition date" />
        </label>
        <label className="flex flex-col gap-1 text-slate-400">LOCATION
          <select value={presetId} onChange={(e) => setPresetId(e.target.value)} className="bg-[#020b14] border border-[#1b314b] rounded px-2 py-1.5 text-slate-200 min-h-[44px]" aria-label="Location preset">
            {presetList.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </label>
        {sharedPreset && presetId !== 'shared-location' && (
          <button type="button" onClick={() => setPresetId('shared-location')} className="dx-touch px-3 py-1.5 rounded border border-[#00d2ff]/60 text-[#7de9ff] font-bold self-end" aria-label={`Centre on shared location ${region.label}`}>
            USE SHARED LOCATION
          </button>
        )}
        <label className="flex flex-col gap-1 text-slate-400 min-w-[120px]">OPACITY {Math.round(opacity * 100)}%
          <input type="range" min={0.1} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="min-h-[44px]" aria-label="Imagery opacity" />
        </label>
        <button type="button" onClick={reset} className="dx-touch px-3 py-1.5 rounded border border-[#1b314b] text-slate-200 hover:border-[#00d2ff]/60 font-bold" aria-label="Reset viewer">RESET</button>
        <button type="button" onClick={toggleFull} aria-pressed={isFull} className="dx-touch px-3 py-1.5 rounded border border-[#1b314b] text-slate-200 hover:border-[#00d2ff]/60 font-bold" aria-label={isFull ? 'Exit fullscreen' : 'View fullscreen'}>
          {isFull ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}
        </button>
      </div>

      <div ref={mapRef} style={{ height: 440 }} className="rounded-xl border border-[#1b314b] mt-2" role="application" aria-label="GIBS satellite imagery map" />
      {!dateValid && (
        <p className="text-xs text-amber-300 mt-2" role="alert">NO IMAGERY AVAILABLE FOR SELECTED DATE — choose a date between {minDate} and {maxDate} (daily NRT window).</p>
      )}
      {tileState === 'NO_TILES' && dateValid && (
        <p className="text-xs text-slate-400 mt-2" role="status">Tiles did not load for this layer/date — source may be updating. Try another date or layer.</p>
      )}

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2" aria-label="Imagery provenance">
        {[
          ['SOURCE', 'NASA GIBS (keyless WMTS)'],
          ['PRODUCT', product ? `${product.layer} · ${product.platform}/${product.instrument}` : '—'],
          ['ACQUISITION (nominal)', product?.acquisitionDate ?? '—'],
          ['RETRIEVED', retrievedAt ? new Date(retrievedAt).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : '—'],
          ['STATUS', tileState === 'LIVE_TILES' ? 'LATEST_AVAILABLE' : tileState],
          ['COVERAGE', product?.coverage ?? '—'],
          ['COPERNICUS', `${copernicus.status} — free account required`],
          ['ATTRIBUTION', 'NASA Worldview / GIBS · © OpenStreetMap'],
        ].map(([k, v]) => (
          <div key={k} className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2 min-w-0">
            <dt className="dx-micro">{k}</dt>
            <dd className="text-slate-200 font-bold truncate" title={String(v)}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
