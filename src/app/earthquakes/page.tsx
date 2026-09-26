'use client';
/**
 * STEP 25 — Earthquake Intelligence: dedicated USGS experience.
 * Data ONLY via Step 22 engine (fetchDataset('usgs-earthquakes-7d')).
 * No synthetic events: zero records renders zero events.
 * DRISHTI-X reports observed USGS information. It does NOT predict earthquakes.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import { fetchDataset, type DatasetResult } from '@/data/engine/engine';
import type { QuakeProperties } from '@/data/engine/adapters';
import { useDialogA11y } from '@/hooks/useDialogA11y';
import {
  depthColor,
  detailRows,
  formatDepth,
  formatMagnitude,
  prefersReducedMotion,
  sortByEventTime,
  summarize,
  timeAgo,
  type Quake,
} from '@/components/earthquake/quakeUtils';

const QuakeMap = dynamic(() => import('@/components/earthquake/QuakeMap'), {
  ssr: false,
  loading: () => <p className="text-xs text-slate-400">Loading earthquake map…</p>,
});

type EngineState =
  | { phase: 'loading' }
  | { phase: 'ready'; result: DatasetResult<QuakeProperties> }
  | { phase: 'error'; message: string };

export default function EarthquakesPage() {
  const [state, setState] = useState<EngineState>({ phase: 'loading' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(!prefersReducedMotion());
  }, []);

  useEffect(() => {
    let dead = false;
    setState({ phase: 'loading' });
    fetchDataset<QuakeProperties>('usgs-earthquakes-7d', {}, { timeoutMs: 15000, maxRetries: 1, forceRefresh: refreshKey > 0 })
      .then((r) => { if (!dead) setState({ phase: 'ready', result: r }); })
      .catch((e: unknown) => { if (!dead) setState({ phase: 'error', message: (e as Error)?.message ?? 'Request failed' }); });
    return () => { dead = true; };
  }, [refreshKey]);

  const quakes: Quake[] = useMemo(
    () => (state.phase === 'ready' ? sortByEventTime(state.result.records as Quake[]) : []),
    [state],
  );
  const summary = useMemo(() => summarize(quakes), [quakes]);
  const selected = quakes.find((q) => q.id === selectedId) ?? null;
  const prov = state.phase === 'ready' ? state.result.provenance : null;

  const closeDetail = useCallback(() => setSelectedId(null), []);
  useDialogA11y(selected !== null, 'dx-quake-dialog', closeDetail);

  const headStatus = state.phase === 'ready' ? state.result.provenance.status : state.phase === 'loading' ? 'OFFLINE' : 'ERROR';

  return (
    <ModuleShell
      title="Earthquake Intelligence"
      sub="USGS — last 7 days, M2.5+. Observed events only; DRISHTI-X does not predict earthquakes."
      status={headStatus}
      source="USGS Earthquake Hazards Program"
    >
      <div className="dx-hud" aria-label="Dataset summary">
        <div className="dx-hud-edge" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            ['EVENTS', String(summary.count)],
            ['STRONGEST', summary.strongest ? formatMagnitude(summary.strongest.properties.magnitude) : '—'],
            ['LATEST', summary.latest ? timeAgo(summary.latest.timestamp) : '—'],
            ['COVERAGE', 'USGS · last 7 days'],
          ].map(([k, v]) => (
            <div key={k} className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2 min-w-0">
              <div className="dx-micro">{k}</div>
              <div className="text-white font-bold tnum truncate" title={v}>{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2 flex-wrap items-center text-[11px]">
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className="dx-touch px-3 py-1.5 rounded border border-[#1b314b] text-slate-200 hover:border-[#00d2ff]/60 font-bold" aria-label="Refresh earthquake data">
            REFRESH
          </button>
          {prov && <span className="text-slate-500">Retrieved {prov.retrievedAt.slice(0, 16).replace('T', ' ')} UTC · cache {state.phase === 'ready' ? state.result.cache : '—'}</span>}
          {state.phase === 'ready' && <StatusBadge status={state.result.freshness === 'UNKNOWN' ? state.result.provenance.status : state.result.freshness} small />}
        </div>
      </div>

      {state.phase === 'loading' && <p className="text-xs text-slate-400 mt-2" role="status">Loading USGS feed…</p>}
      {state.phase === 'error' && (
        <p className="text-xs text-rose-400 mt-2" role="alert">ERROR — {state.message}. No cached data available offline.</p>
      )}
      {state.phase === 'ready' && quakes.length === 0 && (
        <p className="text-xs text-slate-300 mt-2" role="status">0 EVENTS — no earthquakes in this feed window. No placeholder events created.</p>
      )}

      {quakes.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 mt-3">
          <div className="xl:col-span-4 dx-hud" aria-label="Event list">
            <div className="dx-hud-edge" />
            <div className="dx-micro">EVENT LIST — NEWEST FIRST</div>
            <ul className="mt-2 space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
              {quakes.map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(q.id)}
                    aria-pressed={selectedId === q.id}
                    className={`w-full text-left p-2 rounded-lg border transition-colors ${selectedId === q.id ? 'border-[#00d2ff] bg-[#00d2ff]/10' : 'border-[#1b314b] bg-[#091a2e] hover:border-[#00d2ff]/50'}`}
                  >
                    <span className="flex items-center gap-2">
                      <i aria-hidden="true" className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: depthColor(q.properties.depthKm) }} />
                      <b className="text-white tnum">{formatMagnitude(q.properties.magnitude)}</b>
                      <span className="text-slate-300 text-[11px] truncate">{q.properties.place ?? 'Unknown place'}</span>
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5 tnum">
                      {formatDepth(q.properties.depthKm)} · {timeAgo(q.timestamp)} · {q.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="xl:col-span-8 dx-hud" aria-label="Event map">
            <div className="dx-hud-edge" />
            <div className="dx-micro">EPICENTER MAP — MARKER SIZE = MAGNITUDE</div>
            <div className="mt-2"><QuakeMap quakes={quakes} selectedId={selectedId} onSelect={setSelectedId} animated={animated} /></div>
          </div>
        </div>
      )}

      {quakes.length > 0 && (
        <div className="dx-hud mt-3" aria-label="Event timeline">
          <div className="dx-hud-edge" />
          <div className="dx-micro">TIMELINE — EVENT TIME (OLD → NEW)</div>
          <ol className="mt-2 flex gap-2 overflow-x-auto pb-1 text-[11px]">
            {[...quakes].reverse().map((q) => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(q.id)}
                  className={`whitespace-nowrap px-2.5 py-1.5 rounded border ${selectedId === q.id ? 'border-[#00d2ff] text-white' : 'border-[#1b314b] text-slate-300'} min-h-[44px]`}
                  aria-label={`${formatMagnitude(q.properties.magnitude)} ${q.properties.place ?? ''}`}
                >
                  <b className="tnum">{formatMagnitude(q.properties.magnitude)}</b>{' '}
                  <span className="text-slate-500 tnum">{q.timestamp ? q.timestamp.slice(5, 16).replace('T', ' ') : '—'}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      {selected && (
        <div role="dialog" aria-modal="true" aria-label={`Earthquake detail ${selected.properties.eventId}`} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={closeDetail}>
          <div id="dx-quake-dialog" tabIndex={-1} className="w-full max-w-lg bg-[#051424] border border-[#00d2ff]/50 rounded-xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2">
              <b className="text-white">{formatMagnitude(selected.properties.magnitude)} — {selected.properties.place ?? 'Unknown place'}</b>
              <button type="button" onClick={closeDetail} className="dx-touch px-3 py-1 rounded border border-[#1b314b] text-slate-200 font-bold" aria-label="Close event detail">✕</button>
            </div>
            <dl className="mt-2 text-xs space-y-1">
              {detailRows(selected).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-[#132d4a] py-1">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-slate-200 text-right break-all">{v}</dd>
                </div>
              ))}
            </dl>
            {selected.properties.eventUrl && (
              <a href={selected.properties.eventUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block px-3 py-2 rounded bg-[#00d2ff] text-black text-xs font-extrabold">
                VIEW ON USGS →
              </a>
            )}
          </div>
        </div>
      )}

      {prov && (
        <div className="dx-hud mt-3" aria-label="Provenance">
          <div className="dx-hud-edge" />
          <div className="dx-micro">PROVENANCE</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2">
            {[
              ['SOURCE', 'USGS Earthquake Hazards Program'],
              ['DATASET', 'usgs-earthquakes-7d'],
              ['RETRIEVED', prov.retrievedAt.slice(0, 16).replace('T', ' ') + ' UTC'],
              ['EVENT TIME', 'per event (observed)'],
              ['STATUS', prov.status],
              ['COVERAGE', 'Global M2.5+, last 7 days'],
              ['LIMITATIONS', 'Feed latency ~minutes; magnitudes revise; not a prediction.'],
              ['ATTRIBUTION', prov.attribution],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2 min-w-0">
                <div className="dx-micro">{k}</div>
                <div className="text-slate-200 font-bold break-words">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ModuleShell>
  );
}
