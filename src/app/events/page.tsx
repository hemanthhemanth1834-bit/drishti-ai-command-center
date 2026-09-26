'use client';
/**
 * STEP 27 — Disaster Event Intelligence (NASA EONET).
 * Data ONLY via Step 22 engine (fetchDataset('eonet-events')).
 * Zero records renders zero events. Categories use EONET terminology.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ModuleShell, StatusBadge } from '@/platform/provenance';
import LocationContextBar from '@/components/location/LocationContextBar';
import { fetchDataset, type DatasetResult } from '@/data/engine/engine';
import type { EventProperties } from '@/data/engine/adapters';
import { useRegion } from '@/platform/regionStore';
import { haversineKm } from '@/utils/geocode';
import { useDialogA11y } from '@/hooks/useDialogA11y';
import { categoryColor } from '@/components/events/EventMap';
import {
  categoriesOf,
  detailRows,
  filterEvents,
  formatEventTime,
  opennessLabel,
  sortByEventTime,
  summarizeEvents,
  type NatEvent,
} from '@/components/events/eventUtils';

const EventMap = dynamic(() => import('@/components/events/EventMap'), {
  ssr: false,
  loading: () => <p className="text-xs text-slate-400">Loading event map…</p>,
});

type EngineState =
  | { phase: 'loading' }
  | { phase: 'ready'; result: DatasetResult<EventProperties> }
  | { phase: 'error'; message: string };

export default function EventsPage() {
  const [state, setState] = useState<EngineState>({ phase: 'loading' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState('all');
  const [openness, setOpenness] = useState<'all' | 'open' | 'closed'>('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const region = useRegion();
  const NEARBY_KM = 500;

  useEffect(() => {
    let dead = false;
    setState({ phase: 'loading' });
    fetchDataset<EventProperties>('eonet-events', {}, { timeoutMs: 20000, maxRetries: 1, forceRefresh: refreshKey > 0 })
      .then((r) => { if (!dead) setState({ phase: 'ready', result: r }); })
      .catch((e: unknown) => { if (!dead) setState({ phase: 'error', message: (e as Error)?.message ?? 'Request failed' }); });
    return () => { dead = true; };
  }, [refreshKey]);

  const events: NatEvent[] = useMemo(() => {
    const base = state.phase === 'ready' ? sortByEventTime(filterEvents(state.result.records as NatEvent[], category, openness)) : [];
    if (!nearbyOnly || region.lat == null || region.lon == null) return base;
    return base.filter(
      (e) => e.coordinates != null && haversineKm(region.lat as number, region.lon as number, e.coordinates.lat, e.coordinates.lon) <= NEARBY_KM,
    );
  }, [state, category, openness, nearbyOnly, region]);
  const totalEvents = state.phase === 'ready' ? (state.result.records as NatEvent[]).length : 0;
  const allCats = useMemo(
    () => (state.phase === 'ready' ? categoriesOf(state.result.records as NatEvent[]) : []),
    [state],
  );
  const summary = useMemo(
    () => (state.phase === 'ready' ? summarizeEvents(state.result.records as NatEvent[]) : null),
    [state],
  );
  const selected = events.find((e) => e.id === selectedId) ?? null;
  const prov = state.phase === 'ready' ? state.result.provenance : null;
  const headStatus = state.phase === 'ready' ? state.result.provenance.status : state.phase === 'loading' ? 'OFFLINE' : 'ERROR';

  const closeDetail = useCallback(() => setSelectedId(null), []);
  useDialogA11y(selected !== null, 'dx-event-dialog', closeDetail);

  return (
    <>
      <LocationContextBar />
    <ModuleShell
      title="Disaster Event Intelligence"
      sub="Natural events reported through NASA EONET. Source records only — never predictions, never severity scores."
      status={headStatus}
      source="NASA EONET (open event API)"
    >
      <div className="dx-hud" aria-label="Event summary">
        <div className="dx-hud-edge" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {[
            ['EVENTS', summary ? String(summary.count) : '…'],
            ['CATEGORIES', summary ? String(summary.categories) : '…'],
            ['WITH COORDS', summary ? String(summary.withCoords) : '…'],
            ['WITHOUT COORDS', summary ? String(summary.withoutCoords) : '…'],
            ['LATEST SOURCE TIME', summary?.latest?.timestamp ? formatEventTime(summary.latest.timestamp) : '—'],
          ].map(([k, v]) => (
            <div key={k} className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2 min-w-0">
              <div className="dx-micro">{k}</div>
              <div className="text-white font-bold tnum truncate" title={v}>{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2 flex-wrap items-end text-xs">
          <label className="flex flex-col gap-1 text-slate-400">CATEGORY
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-[#020b14] border border-[#1b314b] rounded px-2 py-1.5 text-slate-200 min-h-[44px]" aria-label="Filter by category">
              <option value="all">All categories</option>
              {allCats.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-slate-400">STATUS
            <select value={openness} onChange={(e) => setOpenness(e.target.value as 'all' | 'open' | 'closed')} className="bg-[#020b14] border border-[#1b314b] rounded px-2 py-1.5 text-slate-200 min-h-[44px]" aria-label="Filter by open or closed">
              <option value="all">Open + closed</option>
              <option value="open">Open only</option>
              <option value="closed">Closed only</option>
            </select>
          </label>
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className="dx-touch px-3 py-1.5 rounded border border-[#1b314b] text-slate-200 hover:border-[#00d2ff]/60 font-bold" aria-label="Refresh event data">
            REFRESH
          </button>
          <button
            type="button"
            onClick={() => setNearbyOnly((v) => !v)}
            aria-pressed={nearbyOnly}
            disabled={region.lat == null || region.lon == null}
            title={region.lat == null ? 'Pick a shared location first (CHANGE LOCATION above)' : `Show only events within ${NEARBY_KM} km of ${region.label}`}
            className="dx-touch px-3 py-1.5 rounded border border-[#00d2ff]/60 text-[#7de9ff] font-bold disabled:opacity-40"
          >
            {nearbyOnly ? 'NEARBY ✓' : 'NEAR SHARED LOCATION'}
          </button>
          {nearbyOnly && region.lat != null && (
            <span className="text-[#7de9ff] text-[11px]">SHOWING {events.length} OF {totalEvents} WITHIN {NEARBY_KM} KM OF {region.label} (events without coordinates hidden)</span>
          )}
          {prov && (
            <span className="text-slate-500 text-[11px]">
              Retrieved {prov.retrievedAt.slice(0, 16).replace('T', ' ')} UTC · cache {state.phase === 'ready' ? state.result.cache : '—'}
            </span>
          )}
          {state.phase === 'ready' && <StatusBadge status={state.result.provenance.status} small />}
        </div>
      </div>

      {state.phase === 'loading' && <p className="text-xs text-slate-400 mt-2" role="status">Loading EONET feed…</p>}
      {state.phase === 'error' && (
        <p className="text-xs text-rose-400 mt-2" role="alert">ERROR — {state.message}. No cached data available offline.</p>
      )}
      {state.phase === 'ready' && events.length === 0 && (
        <p className="text-xs text-slate-300 mt-2" role="status">{nearbyOnly ? `0 EVENTS within ${NEARBY_KM} km of ${region.label} — turn off NEARBY to see the full feed. No demo events created.` : 'DISASTER EVENT DATA UNAVAILABLE — no records in this response. No demo events created.'}</p>
      )}

      {events.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 mt-3">
          <div className="xl:col-span-4 dx-hud" aria-label="Event list">
            <div className="dx-hud-edge" />
            <div className="dx-micro">EVENTS — NEWEST FIRST</div>
            <ul className="mt-2 space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
              {events.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(e.id)}
                    aria-pressed={selectedId === e.id}
                    className={`w-full text-left p-2 rounded-lg border transition-colors ${selectedId === e.id ? 'border-[#00d2ff] bg-[#00d2ff]/10' : 'border-[#1b314b] bg-[#091a2e] hover:border-[#00d2ff]/50'}`}
                  >
                    <span className="flex items-center gap-2">
                      <i aria-hidden="true" className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: categoryColor(e.properties.categoryTitle) }} />
                      <b className="text-white text-[12px] truncate">{e.properties.title}</b>
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">
                      {e.properties.categoryTitle ?? 'Uncategorized'} · {formatEventTime(e.timestamp)} · {opennessLabel(e.properties.open)}
                      {e.coordinates ? '' : ' · no coordinates (list only)'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="xl:col-span-8 dx-hud" aria-label="Event map">
            <div className="dx-hud-edge" />
            <div className="dx-micro">EVENT GEOGRAPHY — EONET COORDINATES ONLY</div>
            <div className="mt-2"><EventMap events={events} selectedId={selectedId} onSelect={setSelectedId} animated={typeof window !== 'undefined' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches} /></div>
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div className="dx-hud mt-3" aria-label="Event timeline">
          <div className="dx-hud-edge" />
          <div className="dx-micro">TIMELINE — SOURCE EVENT TIME (OLD → NEW)</div>
          <ol className="mt-2 flex gap-2 overflow-x-auto pb-1 text-[11px]">
            {[...events].reverse().map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(e.id)}
                  className={`whitespace-nowrap px-2.5 py-1.5 rounded border ${selectedId === e.id ? 'border-[#00d2ff] text-white' : 'border-[#1b314b] text-slate-300'} min-h-[44px]`}
                  aria-label={`${e.properties.title}`}
                >
                  <b>{e.properties.categoryTitle ?? '—'}</b>{' '}
                  <span className="text-slate-500 tnum">{e.timestamp ? e.timestamp.slice(5, 16).replace('T', ' ') : '—'}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      {selected && (
        <div role="dialog" aria-modal="true" aria-label={`Event detail ${selected.properties.title}`} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={closeDetail}>
          <div id="dx-event-dialog" tabIndex={-1} className="w-full max-w-lg bg-[#051424] border border-[#00d2ff]/50 rounded-xl p-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2">
              <b className="text-white">{selected.properties.title}</b>
              <button type="button" onClick={closeDetail} className="dx-touch px-3 py-1 rounded border border-[#1b314b] text-slate-200 font-bold" aria-label="Close event detail">✕</button>
            </div>
            <dl className="mt-2 text-xs space-y-1">
              {detailRows(selected).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-[#132d4a] py-1">
                  <dt className="text-slate-500 shrink-0">{k}</dt>
                  <dd className="text-slate-200 text-right break-words">{v}</dd>
                </div>
              ))}
            </dl>
            {selected.properties.sourceUrl && (
              <a href={selected.properties.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block px-3 py-2 rounded bg-[#00d2ff] text-black text-xs font-extrabold">
                VIEW SOURCE →
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
              ['SOURCE', 'NASA EONET'],
              ['DATA TYPE', 'Natural event records'],
              ['RETRIEVED', prov.retrievedAt.slice(0, 16).replace('T', ' ') + ' UTC'],
              ['STATUS', prov.status],
              ['COVERAGE', 'Returned EONET set (open + recent closed)'],
              ['LIMITATIONS', 'Curation latency varies; geometry approximate; not a warning feed.'],
              ['ATTRIBUTION', prov.attribution],
              ['DOCS', 'eonet.gsfc.nasa.gov/docs/v3'],
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
    </>
  );
}
