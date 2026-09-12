// Reusable CHECK MY RISK flow: GPS (permission-gated) or manual search → risk report.
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useT } from '@/i18n/dict';
import TrustBadge from '@/components/TrustBadge';
import { getLivePosition } from '@/utils/geocode';
import { searchPlaces, type Place } from '@/utils/geocode';
import { assessRisk, nearestFacilities } from '@/utils/riskEngine';
import { haversineKm } from '@/utils/geocode';
import { RISK_META } from '@/data/providers';
import { Crosshair, Search, MapPin, TriangleAlert } from 'lucide-react';

export type RiskPlace = { name: string; lat: number; lon: number };

export default function RiskChecker({
  onPlace,
  compact = false,
}: {
  onPlace?: (p: RiskPlace) => void;
  compact?: boolean;
}) {
  const tr = useT();
  const [place, setPlace] = useState<RiskPlace | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [q, setQ] = useState('');
  const [opts, setOpts] = useState<Place[]>([]);

  function pick(name: string, lat: number, lon: number) {
    const p = { name, lat, lon };
    setPlace(p);
    setOpts([]);
    setQ('');
    onPlace?.(p);
  }

  async function useGps() {
    setBusy(true);
    setNote('');
    try {
      const fix = await getLivePosition();
      // Round to ~100m for display privacy; full fix stays in-browser only.
      pick(
        `GPS fix ±${Math.round(fix.accuracyM)}m`,
        Math.round(fix.lat * 1000) / 1000,
        Math.round(fix.lon * 1000) / 1000
      );
    } catch (e: unknown) {
      setNote((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function search() {
    if (q.trim().length < 3) return;
    setBusy(true);
    try {
      setOpts(await searchPlaces(q.trim()));
      setNote('');
    } catch (e: unknown) {
      setNote((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const report = place ? assessRisk(place.lat, place.lon) : null;
  const shelters = place ? nearestFacilities(place.lat, place.lon, 'shelter', 2) : [];
  const hospitals = place ? nearestFacilities(place.lat, place.lon, 'hospital', 2) : [];
  const meta = report ? RISK_META[report.level] : null;

  return (
    <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
      <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
        <Crosshair className="w-4 h-4 text-[#00d2ff]" /> {tr('risk_check')}
      </div>
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <button
          onClick={useGps}
          disabled={busy}
          className="px-4 py-2.5 bg-[#00d2ff] text-black text-sm font-bold rounded disabled:opacity-60"
        >
          {busy ? '…' : `📍 ${tr('risk_check')} — GPS`}
        </button>
        <div className="flex flex-1 gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Or type a place…"
            aria-label="Search location manually"
            className="flex-1 bg-[#020b14] border border-[#1b314b] rounded px-3 py-2 text-sm text-white"
          />
          <button
            onClick={search}
            disabled={busy}
            className="px-3 py-2 rounded border border-[#1b314b] text-slate-200"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>
      {note && <div className="mt-2 text-[12px] text-amber-300">{note}</div>}
      {opts.length > 0 && (
        <div className="mt-2 border border-[#1b314b] rounded overflow-hidden">
          {opts.map((o) => (
            <button
              key={o.id}
              onClick={() => pick(o.name.split(',').slice(0, 2).join(','), o.lat, o.lon)}
              className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#0e2740] border-b border-[#132d4a] last:border-0 text-slate-200"
            >
              {o.name.split(',').slice(0, 2).join(',')}
            </button>
          ))}
        </div>
      )}

      {place && report && meta && (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-[12px] text-slate-400">
            <MapPin className="w-3.5 h-3.5" /> {place.name} · {place.lat.toFixed(3)}, {place.lon.toFixed(3)}
          </div>
          <div className={`mt-2 p-3 rounded-xl border ${meta.bg}`}>
            <div className="text-[11px] text-slate-400">{tr('risk_title')}</div>
            <div className={`text-3xl font-extrabold ${meta.color}`}>{tr(`risk_${report.level}`)}</div>
            <div className="mt-1 text-[12px] text-slate-200">{report.action}</div>
            <div className="mt-2 flex gap-1.5 flex-wrap">
              <TrustBadge kind="SIMULATION" source="demo hazard cells" updated={report.assessedAt} confidence={report.confidence} />
            </div>
          </div>
          {!compact && (
            <>
              <div className="mt-3 text-[11px] font-bold text-slate-300">
                WHY THIS LEVEL? <span className="font-normal text-slate-500">(model estimate, not certainty)</span>
              </div>
              <ul className="mt-1 text-[12px] text-slate-300 list-disc ml-5">
                {report.factors.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                <div className="p-2 rounded bg-[#091a2e] border border-[#1b314b]">
                  <div className="text-slate-500 text-[10px]">NEAREST SHELTER</div>
                  {shelters.map((s) => (
                    <div key={s.f.id} className="text-slate-200">
                      {s.f.name} · {s.distKm.toFixed(1)} km
                    </div>
                  ))}
                </div>
                <div className="p-2 rounded bg-[#091a2e] border border-[#1b314b]">
                  <div className="text-slate-500 text-[10px]">NEAREST HOSPITAL</div>
                  {hospitals.map((s) => (
                    <div key={s.f.id} className="text-slate-200">
                      {s.f.name} · {s.distKm.toFixed(1)} km
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                <Link href="/evacuate" className="px-3 py-2 rounded bg-[#00d2ff] text-black text-xs font-bold">
                  VIEW SAFE ROUTE
                </Link>
                <Link href="/emergency" className="px-3 py-2 rounded bg-rose-600 text-white text-xs font-bold flex items-center gap-1">
                  <TriangleAlert className="w-3.5 h-3.5" /> EMERGENCY
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Re-export for pages that need raw distance math alongside the checker.
export { haversineKm };
