// src/app/location/page.tsx — Location Intel: search any place, inspect details
'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { isInsideGeofence, HYDERABAD_GEOFENCE } from '@/utils/geofenceDetection';
import {
  searchPlaces,
  reverseGeocode,
  getLivePosition,
  haversineKm,
  bearingDeg,
  compass16,
  type Place,
} from '@/utils/geocode';
import { MapPin, Search, Crosshair, History, Navigation, LocateFixed } from 'lucide-react';

const DroneLeafletTracker = dynamic(
  () => import('@/components/maps/DroneLeafletTracker'),
  { ssr: false }
);

const QUICK_PICKS = [
  'Charminar, Hyderabad',
  'Hussain Sagar Lake',
  'Rajiv Gandhi International Airport',
  'Prakasam Barrage, Vijayawada',
];

function shortName(full: string): string {
  return full.split(',').slice(0, 2).join(',').trim();
}

export default function LocationPage() {
  const { live, connected } = useTelemetrySocket();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [place, setPlace] = useState<Place | null>(null);
  const [recent, setRecent] = useState<Place[]>([]);
  const [locating, setLocating] = useState(false);
  const [gpsNote, setGpsNote] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search (~1 req/sec per Nominatim policy)
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(async () => {
      try {
        setResults(await searchPlaces(query));
        setError('');
      } catch (e: unknown) {
        setError((e as Error).message);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  function select(p: Place) {
    setPlace(p);
    setResults([]);
    setQuery(shortName(p.name));
    setRecent((r) => [p, ...r.filter((x) => x.id !== p.id)].slice(0, 5));
  }

  async function useMyLocation() {
    setLocating(true);
    setGpsNote('');
    try {
      const fix = await getLivePosition();
      const p = await reverseGeocode(fix.lat, fix.lon);
      select(p);
      setGpsNote(`GPS fix ±${Math.round(fix.accuracyM)}m — showing your live position`);
    } catch (e: unknown) {
      setGpsNote((e as Error).message);
    } finally {
      setLocating(false);
    }
  }

  const droneLat = live?.lat;
  const droneLon = live?.lon;
  const distKm =
    place && droneLat !== undefined && droneLon !== undefined
      ? haversineKm(droneLat, droneLon, place.lat, place.lon)
      : null;
  const brg =
    place && droneLat !== undefined && droneLon !== undefined
      ? bearingDeg(droneLat, droneLon, place.lat, place.lon)
      : null;
  const insideOps = place
    ? isInsideGeofence({ lat: place.lat, lon: place.lon }, HYDERABAD_GEOFENCE)
    : null;

  const addr = place?.address ?? {};
  const addrRows = [
    ['Road / Area', addr.road ?? addr.suburb ?? addr.neighbourhood ?? '—'],
    ['City', addr.city ?? addr.town ?? addr.village ?? addr.county ?? '—'],
    ['State', addr.state ?? '—'],
    ['Postcode', addr.postcode ?? '—'],
    ['Country', addr.country ?? '—'],
  ];

  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Search + details */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
              <Search className="w-4 h-4 text-[#00d2ff]" /> LOCATION SEARCH (OSM • NO KEY)
            </div>
            <div className="relative mt-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a place — e.g. Charminar, airport, dam…"
                className="w-full bg-[#020b14] border border-[#1b314b] rounded px-3 py-2 text-xs text-white outline-none focus:border-[#00d2ff]/60"
              />
              {searching && (
                <div className="text-[11px] text-slate-500 mt-1">Searching…</div>
              )}
              {error && <div className="text-[11px] text-rose-400 mt-1">{error}</div>}
              {results.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-[#081b2e] border border-[#1b314b] rounded overflow-hidden">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => select(r)}
                      className="w-full text-left px-3 py-2 text-[11px] hover:bg-[#0e2740] border-b border-[#132d4a] last:border-0"
                    >
                      <div className="text-white truncate">{shortName(r.name)}</div>
                      <div className="text-slate-500 truncate">
                        {r.kind} • {r.lat.toFixed(4)}, {r.lon.toFixed(4)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                onClick={useMyLocation}
                disabled={locating}
                className="text-[10px] px-2 py-1 rounded bg-[#00d2ff] text-black font-bold flex items-center gap-1 disabled:opacity-60"
              >
                <LocateFixed className="w-3 h-3" />
                {locating ? 'READING GPS…' : 'USE MY LIVE LOCATION'}
              </button>
              {QUICK_PICKS.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuery(q)}
                  className="text-[10px] px-2 py-1 rounded bg-[#091a2e] border border-[#1b314b] text-slate-300 hover:border-[#00d2ff]/60"
                >
                  {q}
                </button>
              ))}
            </div>
            {gpsNote && (
              <div className="mt-2 text-[11px] text-[#00d2ff]">{gpsNote}</div>
            )}
            {recent.length > 0 && (
              <div className="mt-3 text-[11px]">
                <div className="text-slate-500 flex items-center gap-1 mb-1">
                  <History className="w-3 h-3" /> RECENT
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recent.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => select(r)}
                      className="px-2 py-1 rounded bg-[#091a2e] border border-[#1b314b] text-[#00d2ff] hover:border-[#00d2ff]/60"
                    >
                      {shortName(r.name)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {place && (
            <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
                <MapPin className="w-4 h-4 text-[#00d2ff]" /> PLACE DETAILS
              </div>
              <div className="mt-2 text-xs font-bold text-white leading-relaxed">
                {place.name}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="bg-[#091a2e] p-2 rounded border border-[#1b314b]">
                  <div className="text-slate-500">LAT</div>
                  <div className="text-white font-bold">{place.lat.toFixed(6)}</div>
                </div>
                <div className="bg-[#091a2e] p-2 rounded border border-[#1b314b]">
                  <div className="text-slate-500">LON</div>
                  <div className="text-white font-bold">{place.lon.toFixed(6)}</div>
                </div>
                <div className="bg-[#091a2e] p-2 rounded border border-[#1b314b]">
                  <div className="text-slate-500">TYPE</div>
                  <div className="text-[#00d2ff] font-bold">{place.kind}</div>
                </div>
              </div>
              <div className="mt-2 text-[11px] space-y-1">
                {addrRows.map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-[#132d4a] py-1">
                    <span className="text-slate-500">{k}</span>
                    <span className="text-slate-200 text-right">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Ops geofence</span>
                  <span className={insideOps ? 'text-emerald-400' : 'text-amber-300'}>
                    {insideOps ? 'INSIDE Hyderabad polygon' : 'OUTSIDE Hyderabad polygon'}
                  </span>
                </div>
              </div>
              <Link
                href={`/drones?lat=${place.lat}&lon=${place.lon}&name=${encodeURIComponent(shortName(place.name))}`}
                className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-[#00d2ff] text-black text-xs font-bold rounded hover:bg-[#00b0d6]"
              >
                <Crosshair className="w-3.5 h-3.5" /> TRACK ON SAR RADAR
              </Link>
            </div>
          )}
        </section>

        {/* Map + drone proximity */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-[#051424] border border-[#1b314b] rounded-xl overflow-hidden">
            <div className="bg-[#081b2e] px-4 py-2 border-b border-[#1b314b] text-xs font-bold text-white">
              {place ? shortName(place.name).toUpperCase() : 'NO FIX — SEARCH A PLACE'} //{' '}
              {place ? `${place.lat.toFixed(4)}°N, ${place.lon.toFixed(4)}°E` : '—.————°N, —.————°E'}
            </div>
            <div className="h-[380px] bg-black">
              <DroneLeafletTracker
                lat={place?.lat ?? 17.385}
                lon={place?.lon ?? 78.4867}
              />
            </div>
          </div>

          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
              <Navigation className="w-4 h-4 text-[#00d2ff]" /> DRONE PROXIMITY
            </div>
            {place && distKm !== null && brg !== null ? (
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="bg-[#091a2e] p-2 rounded border border-[#1b314b]">
                  <div className="text-slate-500">NEAREST UNIT</div>
                  <div className="text-[#00d2ff] font-bold">{live?.drone_id}</div>
                </div>
                <div className="bg-[#091a2e] p-2 rounded border border-[#1b314b]">
                  <div className="text-slate-500">DISTANCE</div>
                  <div className="text-white font-bold">{distKm.toFixed(2)} km</div>
                </div>
                <div className="bg-[#091a2e] p-2 rounded border border-[#1b314b]">
                  <div className="text-slate-500">BEARING</div>
                  <div className="text-white font-bold">
                    {Math.round(brg)}° {compass16(brg)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-[11px] py-3 text-center">
                Select a place to compute live drone distance / bearing…
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
