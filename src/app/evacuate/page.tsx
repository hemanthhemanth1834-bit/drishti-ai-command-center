// SAFE EVACUATION — shelters within 30 km only (real OSM + in-range demo).
'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import TrustBadge from '@/components/TrustBadge';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { getLivePosition, haversineKm } from '@/utils/geocode';
import { queryNearbyShelters } from '@/utils/overpass';
import { pathExposure, type PathExposure } from '@/utils/riskEngine';
import { DEMO_FACILITIES, RISK_META } from '@/data/providers';
import { Route as RouteIcon, Navigation } from 'lucide-react';

const MAX_KM = 30;

const MODES = [
  { id: 'fastest', label: 'FASTEST ROUTE', speed: 32, note: 'Shortest path (simulated risk)' },
  { id: 'safest', label: 'SAFEST ROUTE', speed: 24, note: 'Lowest path exposure (cell analysis)' },
  { id: 'vehicle', label: 'VEHICLE ROUTE', speed: 30, note: 'Main roads only (simulated risk)' },
  { id: 'walking', label: 'WALKING ROUTE', speed: 5, note: 'Footpaths + high ground (simulated risk)' },
] as const;

type Dest = { id: string; name: string; lat: number; lon: number; live: boolean; status: string };

export default function EvacuatePage() {
  const { connected } = useTelemetrySocket();
  const [at, setAt] = useState<{ lat: number; lon: number } | null>(null);
  const [real, setReal] = useState<Dest[]>([]);
  const [searching, setSearching] = useState(false);
  const [destId, setDestId] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  // In-range destinations: real OSM shelters + demo shelters, strictly ≤ 30 km.
  const dests: (Dest & { distKm: number })[] = useMemo(() => {
    if (!at) return [];
    const demo: Dest[] = DEMO_FACILITIES.filter((f) => f.kind === 'shelter').map((f) => ({
      id: f.id,
      name: f.name,
      lat: f.lat,
      lon: f.lon,
      live: false,
      status: f.status,
    }));
    return [...real, ...demo]
      .map((d) => ({ ...d, distKm: haversineKm(at.lat, at.lon, d.lat, d.lon) }))
      .filter((d) => d.distKm <= MAX_KM)
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 10);
  }, [at, real]);

  const dest = dests.find((d) => d.id === destId) ?? dests[0];
  const distKm = dest ? dest.distKm : null;

  // Hazard exposure per destination + for the selected path (straight-line estimate).
  const exposureById = useMemo(() => {
    if (!at) return {} as Record<string, PathExposure>;
    const m: Record<string, PathExposure> = {};
    for (const d of dests) m[d.id] = pathExposure(at.lat, at.lon, d.lat, d.lon);
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, dests.map((d) => d.id).join(',')]);
  const exposure = dest ? exposureById[dest.id] ?? null : null;
  const safestId = useMemo(() => {
    let best: string | null = null;
    let bestRank = 99;
    const rank: Record<string, number> = { low: 0, moderate: 1, high: 2, critical: 3 };
    for (const d of dests) {
      const r = rank[exposureById[d.id]?.maxLevel ?? 'low'];
      if (r < bestRank || (r === bestRank && best && d.distKm < (dests.find((x) => x.id === best)?.distKm ?? 1e9))) {
        bestRank = r;
        best = d.id;
      }
    }
    return best;
  }, [dests, exposureById]);

  async function locate() {
    setBusy(true);
    setNote('');
    try {
      const fix = await getLivePosition();
      const p = { lat: Math.round(fix.lat * 1000) / 1000, lon: Math.round(fix.lon * 1000) / 1000 };
      setAt(p);
      setDestId('');
      setSearching(true);
      try {
        const found = await queryNearbyShelters(p.lat, p.lon, MAX_KM * 1000);
        setReal(
          found.map((f) => ({ id: f.id, name: f.name, lat: f.lat, lon: f.lon, live: true, status: 'OSM listed' }))
        );
        if (found.length === 0) setNote('No mapped shelters within 30 km — showing in-range demo options, if any.');
      } catch {
        setReal([]);
        setNote('Shelter directory unreachable — showing in-range demo options, if any.');
      } finally {
        setSearching(false);
      }
    } catch (e: unknown) {
      setNote((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="p-4 max-w-3xl mx-auto flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <RouteIcon className="w-5 h-5 text-[#00d2ff]" />
          <h1 className="text-xl font-extrabold text-white">SAFE EVACUATION</h1>
          <TrustBadge kind="SIMULATION" source={`haversine · shelters ≤ ${MAX_KM} km`} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button onClick={locate} disabled={busy} className="px-4 py-3 rounded-xl bg-[#00d2ff] text-black font-bold disabled:opacity-60">
            {busy ? 'LOCATING…' : at ? `FROM: ${at.lat}, ${at.lon} (tap to refresh)` : '📍 USE MY LOCATION'}
          </button>
          <select
            value={dest?.id ?? ''}
            onChange={(e) => setDestId(e.target.value)}
            className="bg-[#051424] border border-[#1b314b] rounded-xl px-3 py-3 text-sm text-white"
            aria-label="Destination shelter within 30 km"
            disabled={dests.length === 0}
          >
            {dests.length === 0 && <option value="">No shelters within 30 km</option>}
            {dests.map((s) => (
              <option key={s.id} value={s.id}>
                TO: {s.name} · {s.distKm.toFixed(1)} km {s.live ? '(LIVE MAP)' : '(DEMO)'}
                {s.id === safestId ? ' ★ SAFEST PICK' : ''}
              </option>
            ))}
          </select>
        </div>
        {note && <div className="text-[12px] text-amber-300">{note}</div>}
        {searching && <div className="text-[12px] text-slate-400">Searching mapped shelters near you…</div>}
        {at && dests.length === 0 && !searching ? (
          <div className="p-4 rounded-xl bg-[#141006] border border-amber-500/40 text-sm text-center">
            <div className="font-bold text-amber-300">NO SHELTERS WITHIN {MAX_KM} KM OF YOU</div>
            <div className="text-slate-300 mt-1">
              Don&apos;t travel 250+ km on a guess. Check real mapped help around you instead.
            </div>
            <Link
              href="/nearby"
              className="mt-2 inline-block px-4 py-2 rounded-lg bg-[#00d2ff] text-black text-xs font-bold"
            >
              FIND REAL HELP NEARBY →
            </Link>
          </div>
        ) : null}
        {distKm !== null && dest ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MODES.map((m) => {
              const eta = Math.max(1, Math.round((distKm / m.speed) * 60));
              const isSafest = m.id === 'safest';
              // Safest card shows the REAL exposure analysis; others show straight distance.
              const shown = distKm;
              const expoMeta = exposure ? RISK_META[exposure.maxLevel] : null;
              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl bg-[#051424] border ${
                    isSafest ? 'border-emerald-500/50' : 'border-[#1b314b]'
                  }`}
                >
                  <div className="text-xs font-bold text-white">
                    {m.label}
                    {isSafest && dest.id === safestId && (
                      <span className="ml-2 text-[10px] text-emerald-300">★ SAFEST PICK</span>
                    )}
                  </div>
                  <div className="text-2xl font-extrabold text-[#00d2ff] mt-1">
                    {shown.toFixed(1)} km · ~{eta} min
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {m.note} · {dest.live ? 'LIVE map shelter' : 'DEMO shelter'}
                  </div>
                  {isSafest && exposure && expoMeta && (
                    <div className={`mt-2 p-2 rounded-lg border text-[11px] ${expoMeta.bg}`}>
                      <div className={`font-bold ${expoMeta.color}`}>
                        PATH EXPOSURE: {expoMeta.label}
                      </div>
                      <div className="text-slate-300 mt-0.5">
                        {exposure.crossed.length === 0
                          ? 'Straight-line path stays clear of all mapped hazard cells.'
                          : `Crosses: ${exposure.crossed
                              .map((c) => `${c.zone.label} @${c.atKm.toFixed(0)}km`)
                              .join(' · ')}`}
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        Straight-line estimate, not road routing. Verify on the ground.
                      </div>
                    </div>
                  )}
                  <div className="mt-1">
                    <TrustBadge kind={dest.live ? 'LIVE' : 'DEMO'} source={dest.live ? 'OpenStreetMap' : 'demo directory'} />
                  </div>
                  {at && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${at.lat},${at.lon}&destination=${dest.lat},${dest.lon}&travelmode=${m.id === 'walking' ? 'walking' : 'driving'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-[#00d2ff]"
                    >
                      <Navigation className="w-3.5 h-3.5" /> OPEN TURN-BY-TURN
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        ) : at ? null : (
          <div className="text-slate-500 text-sm py-4 text-center">
            Get your location — only shelters within {MAX_KM} km will be offered.
          </div>
        )}
      </div>
    </main>
  );
}
