// src/app/shelter/page.tsx — Shelter Evacuee Scanner
'use client';
import { useMemo, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import CinematicShell from '@/components/cinematic/CinematicShell';
import StatusHeader from '@/components/cinematic/StatusHeader';
import HudPanel from '@/components/cinematic/HudPanel';
import AnimatedCounter, { RadialGauge } from '@/components/cinematic/AnimatedCounter';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { Users, ScanLine, Search } from 'lucide-react';

type Evacuee = { id: string; name: string; shelter: string; verified: boolean };

const SEED: Evacuee[] = [
  { id: 'EV-1042', name: 'Anitha Rao', shelter: 'City Sports Complex', verified: true },
  { id: 'EV-1043', name: 'Ravi Kumar', shelter: 'City Sports Complex', verified: true },
  { id: 'EV-1077', name: 'Meera S.', shelter: 'Riverbend Hall', verified: false },
];

export default function ShelterPage() {
  const { connected } = useTelemetrySocket();
  const [log, setLog] = useState<Evacuee[]>(SEED);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');

  const matches = useMemo(
    () =>
      query.trim()
        ? log.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
        : log,
    [log, query]
  );
  const occupancy = Math.min(100, 74.2 + log.length * 0.1);

  function checkIn() {
    if (!name.trim()) return;
    setLog((l) => [
      { id: `EV-${1080 + l.length}`, name: name.trim(), shelter: 'City Sports Complex', verified: false },
      ...l,
    ]);
    setName('');
  }

  return (
    <CinematicShell intensity={0.6} label="Shelter scanner">
    <main className="min-h-screen text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <StatusHeader wsConnected={connected} />
      {/* Holographic shelter nodes */}
      <div className="px-4 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { n: 'SHELTER 07 · SPORTS COMPLEX', cap: 2000, occ: 1480, eta: '12 MIN', risk: 'LOW' },
          { n: 'RIVERBEND HALL', cap: 800, occ: 328, eta: '8 MIN', risk: 'WATCH' },
          { n: 'CANTONMENT GROUND', cap: 1200, occ: 96, eta: '18 MIN', risk: 'LOW' },
        ].map((s) => {
          const pct = Math.round((s.occ / s.cap) * 100);
          return (
            <HudPanel key={s.n} micro={`HOLOGRAPHIC NODE · ${s.risk}`} title={s.n} tone={pct > 85 ? 'critical' : pct > 60 ? 'warn' : 'ok'}>
              <div className="flex items-center gap-3">
                <RadialGauge value={pct} label="OCCUPIED" tone={pct > 85 ? '#ff5470' : pct > 60 ? '#ffb020' : '#34d399'} />
                <div className="text-[11px] space-y-1">
                  <div>CAPACITY <b className="text-white"><AnimatedCounter value={s.cap} /></b></div>
                  <div>OCCUPIED <b className="text-white"><AnimatedCounter value={s.occ} /></b></div>
                  <div>AVAILABLE <b className="text-emerald-300"><AnimatedCounter value={s.cap - s.occ} /></b></div>
                  <div>ETA <b className="text-[#00d2ff]">{s.eta}</b> · STATUS <b>{pct > 85 ? 'FULL' : 'STABLE'}</b></div>
                </div>
              </div>
            </HudPanel>
          );
        })}
      </div>
      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-5 bg-[#051424] border border-[#1b314b] rounded-xl p-4">
          <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
            <ScanLine className="w-4 h-4 text-[#00d2ff]" /> KIOSK CHECK-IN SCANNER
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            Optical QR scan • offline Aadhaar verification (mock) • family cross-match
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Evacuee name…"
              className="flex-1 bg-[#020b14] border border-[#1b314b] rounded px-3 py-2 text-xs text-white"
            />
            <button
              onClick={checkIn}
              className="px-4 py-2 bg-[#00d2ff] text-black text-xs font-bold rounded"
            >
              CHECK-IN
            </button>
          </div>
          <div className="mt-4">
            <div className="text-[10px] text-slate-400 flex justify-between">
              <span>SHELTER CAPACITY</span>
              <span className="text-emerald-400">{occupancy.toFixed(1)}% OCCUPIED</span>
            </div>
            <div className="h-2 mt-1 rounded bg-[#091a2e] border border-[#1b314b]">
              <div className="h-full rounded bg-emerald-400" style={{ width: `${occupancy}%` }} />
            </div>
          </div>
          <div className="mt-3 text-[11px]">
            <div className="text-slate-400 font-bold mb-1">
              SHELTER STATUS <span className="font-normal">(DEMO DATA — call ahead)</span>
            </div>
            {[
              { n: 'City Sports Complex', cap: 2000, occ: 1480, lat: 17.395, lon: 78.472 },
              { n: 'Riverbend Hall', cap: 800, occ: 328, lat: 17.368, lon: 78.49 },
              { n: 'Cantonment Ground', cap: 1200, occ: 0, lat: 17.42, lon: 78.47 },
            ].map((s) => (
              <div key={s.n} className="py-1.5 border-b border-[#132d4a] last:border-0">
                <div className="flex justify-between">
                  <span className="text-slate-100 font-bold">{s.n}</span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00d2ff]"
                  >
                    NAVIGATE →
                  </a>
                </div>
                <div className="text-slate-400">
                  Capacity {s.cap.toLocaleString()} · Occupied {s.occ.toLocaleString()} ·{' '}
                  <span className="text-emerald-300">Remaining {(s.cap - s.occ).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-7 bg-[#051424] border border-[#1b314b] rounded-xl p-4">
          <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
            <Users className="w-4 h-4 text-[#00d2ff]" /> FAMILY REUNIFICATION CROSS-MATCH
          </div>
          <div className="mt-3 flex items-center gap-2 bg-[#020b14] border border-[#1b314b] rounded px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search registered evacuees…"
              className="flex-1 bg-transparent text-xs text-white outline-none"
            />
          </div>
          <div className="mt-2 space-y-1 text-[11px] max-h-[300px] overflow-y-auto">
            {matches.map((e) => (
              <div
                key={e.id}
                className="p-2 rounded bg-[#081a2c] border border-[#132d4a] flex items-center justify-between"
              >
                <span className="text-[#00d2ff] font-bold">{e.id}</span>
                <span>{e.name}</span>
                <span className="text-slate-400">{e.shelter}</span>
                <span className={e.verified ? 'text-emerald-400' : 'text-amber-300'}>
                  {e.verified ? 'VERIFIED' : 'PENDING'}
                </span>
              </div>
            ))}
            {matches.length === 0 && (
              <div className="text-slate-500 py-4 text-center">No matches found.</div>
            )}
          </div>
        </section>
      </div>
    </main>
    </CinematicShell>
  );
}
