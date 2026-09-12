// SAFE EVACUATION — distance/ETA to shelter + labeled simulated route options.
'use client';
import { useMemo, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import TrustBadge from '@/components/TrustBadge';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { getLivePosition, haversineKm } from '@/utils/geocode';
import { DEMO_FACILITIES } from '@/data/providers';
import { Route as RouteIcon, Navigation } from 'lucide-react';

const MODES = [
  { id: 'fastest', label: 'FASTEST ROUTE', speed: 32, note: 'Shortest path (simulated risk)' },
  { id: 'safest', label: 'SAFEST ROUTE', speed: 24, note: 'Avoids hazard cells (simulated risk)' },
  { id: 'vehicle', label: 'VEHICLE ROUTE', speed: 30, note: 'Main roads only (simulated risk)' },
  { id: 'walking', label: 'WALKING ROUTE', speed: 5, note: 'Footpaths + high ground (simulated risk)' },
] as const;

export default function EvacuatePage() {
  const { connected } = useTelemetrySocket();
  const shelters = useMemo(() => DEMO_FACILITIES.filter((f) => f.kind === 'shelter'), []);
  const [at, setAt] = useState<{ lat: number; lon: number } | null>(null);
  const [destId, setDestId] = useState(shelters[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const dest = shelters.find((s) => s.id === destId) ?? shelters[0];
  const distKm = at && dest ? haversineKm(at.lat, at.lon, dest.lat, dest.lon) : null;

  async function locate() {
    setBusy(true);
    setNote('');
    try {
      const fix = await getLivePosition();
      setAt({ lat: Math.round(fix.lat * 1000) / 1000, lon: Math.round(fix.lon * 1000) / 1000 });
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
        <div className="flex items-center gap-2">
          <RouteIcon className="w-5 h-5 text-[#00d2ff]" />
          <h1 className="text-xl font-extrabold text-white">SAFE EVACUATION</h1>
          <TrustBadge kind="SIMULATION" source="haversine + demo shelters" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button onClick={locate} disabled={busy} className="px-4 py-3 rounded-xl bg-[#00d2ff] text-black font-bold disabled:opacity-60">
            {busy ? 'LOCATING…' : at ? `FROM: ${at.lat}, ${at.lon} (tap to refresh)` : '📍 USE MY LOCATION'}
          </button>
          <select
            value={destId}
            onChange={(e) => setDestId(e.target.value)}
            className="bg-[#051424] border border-[#1b314b] rounded-xl px-3 py-3 text-sm text-white"
            aria-label="Destination shelter"
          >
            {shelters.map((s) => (
              <option key={s.id} value={s.id}>
                TO: {s.name} ({s.status})
              </option>
            ))}
          </select>
        </div>
        {note && <div className="text-[12px] text-amber-300">{note}</div>}
        {distKm !== null && dest ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MODES.map((m) => {
              const eta = Math.max(1, Math.round((distKm / m.speed) * 60));
              // Safest trades distance for hazard avoidance (simulated +20%).
              const shown = m.id === 'safest' ? distKm * 1.2 : distKm;
              return (
                <div key={m.id} className="p-3 rounded-xl bg-[#051424] border border-[#1b314b]">
                  <div className="text-xs font-bold text-white">{m.label}</div>
                  <div className="text-2xl font-extrabold text-[#00d2ff] mt-1">
                    {shown.toFixed(1)} km · ~{m.id === 'safest' ? Math.round(eta * 1.2) : eta} min
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{m.note}</div>
                  <div className="mt-1">
                    <TrustBadge kind="SIMULATION" source="route risk" />
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
        ) : (
          <div className="text-slate-500 text-sm py-4 text-center">
            Get your location to compute distance, time and route options to {dest?.name}.
          </div>
        )}
      </div>
    </main>
  );
}
