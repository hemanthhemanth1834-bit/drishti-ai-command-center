// HELP NEAR ME — real OSM amenities via Overpass, demo fallback. Never invents status.
'use client';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import TrustBadge from '@/components/TrustBadge';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { getLivePosition, haversineKm } from '@/utils/geocode';
import { queryNearbyHelp, type OsmPlace } from '@/utils/overpass';
import { DEMO_FACILITIES } from '@/data/providers';
import { LifeBuoy, Navigation } from 'lucide-react';

const FILTERS = ['All', 'Hospital', 'Police', 'Fire Station', 'Clinic', 'Pharmacy'] as const;

export default function NearbyPage() {
  const { connected } = useTelemetrySocket();
  const [at, setAt] = useState<{ lat: number; lon: number } | null>(null);
  const [places, setPlaces] = useState<OsmPlace[]>([]);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  async function locate() {
    setBusy(true);
    setNote('');
    try {
      const fix = await getLivePosition();
      const rounded = { lat: Math.round(fix.lat * 1000) / 1000, lon: Math.round(fix.lon * 1000) / 1000 };
      setAt(rounded);
      try {
        const real = await queryNearbyHelp(rounded.lat, rounded.lon);
        setPlaces(real);
        setLive(true);
      } catch {
        setLive(false);
        setPlaces(
          DEMO_FACILITIES.map((f) => ({ id: f.id, name: f.name, lat: f.lat, lon: f.lon, kind: f.kind }))
        );
        setNote('Live directory unreachable — showing demo facilities.');
      }
    } catch (e: unknown) {
      setNote((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const shown = places
    .filter((p) => filter === 'All' || p.kind === filter)
    .map((p) => ({ p, d: at ? haversineKm(at.lat, at.lon, p.lat, p.lon) : 0 }))
    .sort((a, b) => a.d - b.d);

  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="p-4 max-w-4xl mx-auto flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <LifeBuoy className="w-5 h-5 text-[#00d2ff]" />
          <h1 className="text-xl font-extrabold text-white">HELP NEAR ME</h1>
          {at && <TrustBadge kind={live ? 'LIVE' : 'DEMO'} source={live ? 'OpenStreetMap' : 'demo directory'} />}
        </div>
        <button
          onClick={locate}
          disabled={busy}
          className="px-4 py-3 rounded-xl bg-[#00d2ff] text-black font-bold disabled:opacity-60"
        >
          {busy ? 'LOCATING…' : at ? `RESCAN · ${at.lat}, ${at.lon}` : '📍 FIND HELP AROUND ME'}
        </button>
        {note && <div className="text-[12px] text-amber-300">{note}</div>}
        {at && (
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded text-[11px] border ${
                  filter === f ? 'bg-[#00d2ff] text-black font-bold border-[#00d2ff]' : 'border-[#1b314b] text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
        <div className="space-y-2">
          {at &&
            shown.map(({ p, d }) => (
              <div key={p.id} className="p-3 rounded-xl bg-[#051424] border border-[#1b314b]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white text-sm">{p.name}</span>
                  <span className="text-[11px] text-[#00d2ff]">{d.toFixed(1)} km</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {p.kind} · {live ? 'LOCATION FOUND · STATUS UNKNOWN' : 'DEMO entry — call ahead'}
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${at.lat},${at.lon}&destination=${p.lat},${p.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-bold text-[#00d2ff]"
                >
                  <Navigation className="w-3.5 h-3.5" /> NAVIGATE
                </a>
              </div>
            ))}
          {at && shown.length === 0 && (
            <div className="text-slate-500 text-sm py-4 text-center">No places in this category nearby.</div>
          )}
          {!at && (
            <div className="text-slate-500 text-sm py-4 text-center">
              Tap above — results come from OpenStreetMap around your (approx) position.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
