'use client';
/**
 * ModelFlowVisual — the AI/ML information flow (inputs → RandomForest →
 * output → GIS) rendered with REAL, source-backed imagery instead of flat
 * conceptual boxes.
 *
 * Information flow is UNCHANGED:
 *   RAIN + SOIL + SLOPE/TERRAIN + HISTORY → RANDOM FOREST → MODEL OUTPUT → GIS
 *
 * Truth rules:
 * - Photographs are CONTEXT, never measurements (labeled on every card).
 * - Live numbers come only from the Data Engine / model registry.
 * - No hardcoded risk score (the old SVG "87/100" is gone from this view).
 * - Model status, version, and feature count come from /api/v1/ml/model.
 * - Map preview is a real OSM tile for the shared location (© OSM).
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { StatusBadge } from '@/platform/provenance';
import { usePlatform } from '@/platform/usePlatform';
import { useRegion } from '@/platform/regionStore';
import { fetchDataset, type DatasetResult } from '@/data/engine/engine';
import type { WeatherProperties } from '@/data/engine/adapters';
import { fmt, isCurrentRecord } from '@/components/weather/weatherUtils';
import {
  OSM_ATTRIBUTION,
  OSM_LICENSE_URL,
  getAsset,
  osmTileUrl,
  type ImageAsset,
} from '@/data/images/imageRegistry';

interface ModelInfo {
  model_version: string;
  status: string;
  trained_at?: string;
  data_kind?: string;
  features?: string[];
}

const CARD =
  'dx-hud overflow-hidden flex flex-col min-w-0';
const IMG_WRAP: React.CSSProperties = { aspectRatio: '16 / 9', overflow: 'hidden', background: '#020b14' };
const IMG: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };

function ContextPhoto({ asset, alt }: { asset: ImageAsset; alt: string }) {
  return (
    <div style={IMG_WRAP}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset.localPath} alt={alt} loading="lazy" decoding="async" style={IMG} />
    </div>
  );
}

function SourceLine({ asset }: { asset: ImageAsset }) {
  return (
    <p className="text-[10px] text-slate-500 mt-1">
      SOURCE: {asset.source} · {asset.license}
      {asset.date ? ` · ${asset.date}` : ''}
    </p>
  );
}

function Arrow({ vertical }: { vertical: boolean }) {
  return (
    <div aria-hidden="true" className={`flex items-center justify-center text-[#1b6d8a] font-bold select-none ${vertical ? 'py-1' : 'px-1'}`}>
      {vertical ? '↓' : '→'}
    </div>
  );
}

export default function ModelFlowVisual({ predictHref = '/prediction' }: { predictHref?: string }) {
  const region = useRegion();
  const model = usePlatform<ModelInfo>('/api/v1/ml/model');

  const hasShared = region.lat != null && region.lon != null;
  const wxLat = region.lat ?? 25.57;
  const wxLon = region.lon ?? 91.89;
  const wxLabel = hasShared ? region.label : 'DEFAULT GRID (25.57, 91.89)';

  const [wx, setWx] = useState<DatasetResult<WeatherProperties> | null>(null);
  const [wxLoading, setWxLoading] = useState(true);
  useEffect(() => {
    let dead = false;
    setWxLoading(true);
    fetchDataset<WeatherProperties>('openmeteo-current', { lat: wxLat, lon: wxLon }, { timeoutMs: 15000, maxRetries: 1 })
      .then((r) => { if (!dead) { setWx(r); setWxLoading(false); } })
      .catch(() => { if (!dead) setWxLoading(false); });
    return () => { dead = true; };
  }, [wxLat, wxLon]);

  const curProps = (wx?.records ?? []).find(isCurrentRecord)?.properties as WeatherProperties | undefined;
  const wxStatus = wx ? wx.provenance.status : wxLoading ? 'OFFLINE' : 'ERROR';

  const rain = getAsset('rain-nilam-modis')!;
  const soil = getAsset('soil-kerala-landsat')!;
  const terrain = getAsset('terrain-himalaya-iss')!;
  const histBefore = getAsset('history-kerala-before')!;
  const histAfter = getAsset('history-kerala-after')!;

  const mapLat = region.lat ?? 22.5;
  const mapLon = region.lon ?? 79.5;
  const [tileFailed, setTileFailed] = useState(false);
  useEffect(() => { setTileFailed(false); }, [mapLat, mapLon]);

  const m = model.data ?? null;
  const featureCount = m?.features?.length;
  const registryOffline = !model.loading && !m;

  return (
    <section aria-label="AI model flow — real observations into RandomForest into GIS" className="dx-hud">
      <div className="dx-hud-edge" />
      <div className="dx-micro">MODEL FLOW · REAL OBSERVATIONS → FEATURES → RANDOM FOREST → OUTPUT → GIS</div>

      {/* INPUT LAYER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-2">
        <div className={CARD}>
          <ContextPhoto asset={rain} alt="NASA Terra/MODIS satellite view of Cyclonic Storm Nilam: spiral cloud bands over the Bay of Bengal" />
          <div className="p-2">
            <div className="flex items-center justify-between gap-2">
              <b className="text-white text-sm">RAIN</b>
              <StatusBadge status={wxStatus} small />
            </div>
            <div className="text-[11px] text-slate-400">PRECIPITATION CONTEXT · {wxLabel}</div>
            <div className="text-base font-bold text-white tnum mt-1">
              {wxLoading ? '…' : curProps ? `PRECIP ${fmt(curProps.precipitationMm, 'mm')} · ${fmt(curProps.temperatureC, '°C')}` : 'NOT AVAILABLE'}
            </div>
            <div className="text-[10px] text-slate-500">Live values: Open-Meteo via data engine. Photo shows cloud structure — never a rainfall measurement.</div>
            <SourceLine asset={rain} />
          </div>
        </div>

        <div className={CARD}>
          <ContextPhoto asset={soil} alt="NASA Landsat 8 false-color land-surface view of Kerala: green vegetation and river plains before the 2018 floods" />
          <div className="p-2">
            <div className="flex items-center justify-between gap-2">
              <b className="text-white text-sm">SOIL</b>
              <StatusBadge status="HISTORICAL" small />
            </div>
            <div className="text-[11px] text-slate-400">LAND-SURFACE CONTEXT · archival</div>
            <div className="text-[11px] text-slate-300 mt-1">SOIL MOISTURE: model input (operator-measured) — this photo is not a moisture reading.</div>
            <SourceLine asset={soil} />
          </div>
        </div>

        <div className={CARD}>
          <ContextPhoto asset={terrain} alt="Oblique orbital photograph of India and the Himalayas from the International Space Station showing mountain-slope terrain" />
          <div className="p-2">
            <div className="flex items-center justify-between gap-2">
              <b className="text-white text-sm">SLOPE · TERRAIN</b>
              <StatusBadge status="REFERENCE" small />
            </div>
            <div className="text-[11px] text-slate-400">ELEVATION / SLOPE CONTEXT</div>
            <div className="text-[11px] text-slate-300 mt-1">Slope/elevation are model inputs — verify on the ground. No elevation invented here.</div>
            <SourceLine asset={terrain} />
          </div>
        </div>

        <div className={CARD}>
          <div className="grid grid-cols-2 gap-1" style={{ background: '#020b14' }}>
            <div style={{ ...IMG_WRAP, aspectRatio: '8 / 9' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={histBefore.localPath} alt="Kerala before the August 2018 floods: pre-flood landscape from Landsat 8, 6 February 2018" loading="lazy" decoding="async" style={IMG} />
            </div>
            <div style={{ ...IMG_WRAP, aspectRatio: '8 / 9' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={histAfter.localPath} alt="Kerala after inundation: dark-blue flood water across the same region from Sentinel-2, 22 August 2018" loading="lazy" decoding="async" style={IMG} />
            </div>
          </div>
          <div className="p-2">
            <div className="flex items-center justify-between gap-2">
              <b className="text-white text-sm">HISTORY · REPORTS</b>
              <StatusBadge status="HISTORICAL" small />
            </div>
            <div className="text-[11px] text-slate-400">BEFORE 2018-02-06 → AFTER 2018-08-22 · Kerala floods</div>
            <div className="text-[10px] text-slate-500 mt-1">Archived event context — not a report for the selected location. No causality claimed from image differences.</div>
            <SourceLine asset={histAfter} />
          </div>
        </div>
      </div>

      <Arrow vertical />

      {/* MODEL LAYER */}
      <div className="dx-hud" style={{ borderColor: '#34d39955' }}>
        <div className="dx-hud-edge" style={{ background: '#34d399' }} />
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="dx-micro">MODEL · ALGORITHM (NO PHOTO — ALGORITHMS ARE NOT PLACES)</div>
            <div className="text-lg font-extrabold text-white">RANDOM FOREST</div>
          </div>
          {m ? <StatusBadge status={m.status} /> : <StatusBadge status={model.loading ? 'OFFLINE' : 'OFFLINE'} />}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2">
          <div className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2">
            <div className="dx-micro">FEATURES</div>
            <div className="text-white font-bold tnum">{featureCount ?? '—'}</div>
          </div>
          <div className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2">
            <div className="dx-micro">VERSION</div>
            <div className="text-white font-bold truncate" title={m?.model_version ?? ''}>{m?.model_version ?? '—'}</div>
          </div>
          <div className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2">
            <div className="dx-micro">TRAINING</div>
            <div className="text-white font-bold">{m?.data_kind ?? (registryOffline ? 'REGISTRY OFFLINE' : '…')}</div>
          </div>
          <div className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2">
            <div className="dx-micro">TRAINED</div>
            <div className="text-white font-bold tnum">{m?.trained_at ? m.trained_at.slice(0, 10) : '—'}</div>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">SOURCE: model registry /api/v1/ml/model. Synthetic training stays labeled {m?.data_kind ?? 'SYNTHETIC-DEMO'} — never presented as field accuracy.</p>
      </div>

      <Arrow vertical />

      {/* OUTPUT + GIS LAYER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="dx-hud" style={{ borderColor: '#ff547055' }}>
          <div className="dx-hud-edge" style={{ background: '#ff5470' }} />
          <div className="dx-micro">MODEL OUTPUT · RISK SCORE</div>
          {registryOffline ? (
            <div className="mt-1">
              <div className="text-xl font-extrabold text-white">NOT AVAILABLE</div>
              <div className="text-[11px] text-slate-400">Model registry OFFLINE — no score invented.</div>
              <StatusBadge status="OFFLINE" small />
            </div>
          ) : (
            <div className="mt-1">
              <div className="text-[11px] text-slate-300">Scores are produced per-run by the predictor below — this diagram never carries a static number.</div>
              <Link href={predictHref} className="inline-block mt-2 min-h-[44px] leading-[44px] px-4 rounded bg-[#00d2ff] text-black text-xs font-bold" aria-label="Open the landslide predictor to run the model">
                RUN PREDICTION →
              </Link>
            </div>
          )}
        </div>

        <div className={CARD}>
          {!tileFailed ? (
            <div style={IMG_WRAP}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={osmTileUrl(mapLat, mapLon, 5)}
                alt={`Real OpenStreetMap preview centred near ${mapLat.toFixed(1)}, ${mapLon.toFixed(1)}`}
                loading="lazy" decoding="async" style={IMG}
                onError={() => setTileFailed(true)}
              />
            </div>
          ) : (
            <div className="p-3 text-[11px] text-slate-400" role="status">MAP PREVIEW UNAVAILABLE offline — open the live risk map instead.</div>
          )}
          <div className="p-2">
            <div className="flex items-center justify-between gap-2">
              <b className="text-white text-sm">WARN · GIS</b>
              <StatusBadge status="LIVE" small />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Real OSM tile for {hasShared ? region.label : 'India default view'} · {OSM_ATTRIBUTION} · <a className="underline" href={OSM_LICENSE_URL} target="_blank" rel="noreferrer">license</a></div>
            <Link href="/risk-map" className="inline-block mt-2 min-h-[44px] leading-[44px] px-4 rounded border border-[#ffb020]/60 text-[#ffd88a] text-xs font-bold" aria-label="Open the live GIS risk map">
              OPEN RISK MAP →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
