// src/app/location/page.tsx — Location Intel: search any place, inspect details
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import {
  searchPlaces,
  reverseGeocode,
  getLivePosition,
  haversineKm,
  bearingDeg,
  compass16,
  toDMS,
  type Place,
} from '@/utils/geocode';
import {
  fetchGooglePlace,
  googleKey,
  GOOGLE_KEY_MISSING,
  type GooglePlaceDetails,
} from '@/utils/googlePlaces';
import { MapPin, Search, Crosshair, History, Navigation, LocateFixed, FileText, Copy, Check, ExternalLink, Star, Phone, Clock } from 'lucide-react';
import CinematicShell from '@/components/cinematic/CinematicShell';
import StatusHeader from '@/components/cinematic/StatusHeader';
import { DEMO_FACILITIES, DEMO_HAZARDS } from '@/data/providers';
import type { MapCircle } from '@/components/RadarMap';

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
  const [liveFix, setLiveFix] = useState<{
    placeId: string;
    accuracyM: number;
    at: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [layersOff, setLayersOff] = useState<Record<string, boolean>>({});
  const toggleLayer = (k: string) => setLayersOff((o) => ({ ...o, [k]: !o[k] }));

  const LEVEL_COLOR: Record<string, string> = {
    low: '#34d399',
    moderate: '#facc15',
    high: '#fb923c',
    critical: '#fb7185',
  };
  const FAC_COLOR: Record<string, string> = {
    shelter: '#34d399',
    hospital: '#38bdf8',
    police: '#a78bfa',
    fire: '#f87171',
    relief: '#fbbf24',
    dam: '#22d3ee',
    bridge: '#f59e0b',
  };
  const HAZ_TYPES = ['flood', 'cyclone', 'fire', 'earthquake', 'landslide', 'heat', 'lightning', 'industrial', 'dam'];
  const FAC_KINDS = ['shelter', 'hospital', 'police', 'fire', 'relief', 'dam', 'bridge'];

  const layerCircles: MapCircle[] = useMemo(
    () => [
      ...DEMO_HAZARDS.filter((z) => !layersOff[z.type]).map((z) => ({
        lat: z.lat,
        lon: z.lon,
        radiusM: z.radiusKm * 1000,
        color: LEVEL_COLOR[z.level],
        label: `${z.label} (${z.level}, SIM)`,
        level: z.level,
      })),
      ...DEMO_FACILITIES.filter((f) => !layersOff[f.kind]).map((f) => ({
        lat: f.lat,
        lon: f.lon,
        radiusM: 600,
        color: FAC_COLOR[f.kind],
        label: `${f.name} — ${f.status}`,
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layersOff]
  );
  const [gplace, setGplace] = useState<GooglePlaceDetails | null>(null);
  const [gloading, setGloading] = useState(false);
  const [gerror, setGerror] = useState('');
  const [mapSrc, setMapSrc] = useState<'OSM' | 'GOOGLE'>('OSM');
  const gmapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';
  const gmapsEmbed = place
    ? gmapsKey
      ? `https://www.google.com/maps/embed/v1/place?key=${gmapsKey}&q=${place.lat},${place.lon}&zoom=15`
      : `https://maps.google.com/maps?q=${place.lat},${place.lon}&z=15&output=embed`
    : '';
  const gmapsLink = place
    ? `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`
    : 'https://www.google.com/maps';
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

  // Live location is the main view: auto-locate once on load.
  // Falls back to the default viewport if permission is denied.
  const autoGps = useRef(false);
  useEffect(() => {
    if (autoGps.current) return;
    autoGps.current = true;
    locateMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function select(p: Place) {
    setPlace(p);
    setResults([]);
    setQuery(shortName(p.name));
    setRecent((r) => [p, ...r.filter((x) => x.id !== p.id)].slice(0, 5));
    // Google enrichment follows the selection (no-op + guide when keyless).
    setGplace(null);
    setGerror('');
    setGloading(true);
    fetchGooglePlace(shortName(p.name), p.lat, p.lon)
      .then((g) => setGplace(g))
      .catch((e: Error) => setGerror(e.message === GOOGLE_KEY_MISSING ? GOOGLE_KEY_MISSING : e.message))
      .finally(() => setGloading(false));
  }

  async function locateMe() {
    setLocating(true);
    setGpsNote('');
    try {
      const fix = await getLivePosition();
      const p = await reverseGeocode(fix.lat, fix.lon);
      select(p);
      setLiveFix({ placeId: p.id, accuracyM: fix.accuracyM, at: Date.now() });
      setGpsNote(`GPS fix ±${Math.round(fix.accuracyM)}m — showing your live position`);
    } catch (e: unknown) {
      setLiveFix(null);
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

  const addr = place?.address ?? {};
  const showReport = place !== null && liveFix !== null && place.id === liveFix.placeId;
  const dms = place ? toDMS(place.lat, place.lon) : null;
  const etaMin =
    distKm !== null && live && live.speed_ms > 0.5
      ? (distKm / (live.speed_ms * 3.6)) * 60
      : null;

  function reportText(): string {
    if (!place || !liveFix) return '';
    const lines = [
      `DRISHTI-X LIVE LOCATION REPORT — ${new Date(liveFix.at).toLocaleString()}`,
      `Place: ${place.name}`,
      `Coords: ${place.lat.toFixed(6)}, ${place.lon.toFixed(6)} (${dms?.lat}, ${dms?.lon})`,
      `GPS accuracy: ±${Math.round(liveFix.accuracyM)}m`,
      `Type: ${place.kind} / ${place.category}`,
      distKm !== null && brg !== null
        ? `Nearest drone: ${live?.drone_id ?? '—'} — ${distKm.toFixed(2)} km ${compass16(brg)}` +
          (etaMin !== null ? ` — ETA ~${etaMin.toFixed(0)} min` : '')
        : 'Nearest drone: no live fix',
      `Scenario: ${live?.scenario ?? '—'} | Link: ${live ? `${live.signal_pct.toFixed(0)}%` : '—'}`,
      ...(gplace?.rating !== undefined
        ? [`Google: ★${gplace.rating.toFixed(1)} (${gplace.ratingCount ?? 0} reviews)`]
        : []),
    ];
    return lines.join('\n');
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(reportText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setGpsNote('clipboard blocked by browser — long-press to copy manually');
    }
  }
  const addrRows = [
    ['Road / Area', addr.road ?? addr.suburb ?? addr.neighbourhood ?? '—'],
    ['City', addr.city ?? addr.town ?? addr.village ?? addr.county ?? '—'],
    ['State', addr.state ?? '—'],
    ['Postcode', addr.postcode ?? '—'],
    ['Country', addr.country ?? '—'],
  ];

  return (
    <CinematicShell intensity={0.55} label="Location intelligence">
    <main className="min-h-screen text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <StatusHeader wsConnected={connected} />
      <div className="px-4 pt-3 text-[10px] tracking-[0.14em] text-slate-500">
        OPENSTREETMAP + LEAFLET · FREE TILES · <span className="text-slate-300">IF TILES FAIL → LOCAL GRID FALLBACK (2D COMMAND MAP)</span>
      </div>
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
                onClick={locateMe}
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
              </div>
              <Link
                href={`/drones?lat=${place.lat}&lon=${place.lon}&name=${encodeURIComponent(shortName(place.name))}`}
                className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-[#00d2ff] text-black text-xs font-bold rounded hover:bg-[#00b0d6]"
              >
                <Crosshair className="w-3.5 h-3.5" /> TRACK ON SAR RADAR
              </Link>
              <a
                href={gmapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 rounded text-xs font-bold border border-[#1b314b] text-slate-200 hover:border-[#00d2ff]/60"
              >
                <ExternalLink className="w-3.5 h-3.5" /> OPEN IN GOOGLE MAPS
              </a>
              {!gmapsKey && (
                <div className="mt-1.5 text-[10px] text-slate-500">
                  Keyless Google embed. Ratings, hours & photos need a billing-enabled
                  Maps key (set NEXT_PUBLIC_GOOGLE_MAPS_KEY).
                </div>
              )}
            </div>
          )}

          {showReport && place && liveFix && dms && (
            <div className="bg-[#051424] border border-[#00d2ff]/40 rounded-xl p-4">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
                <FileText className="w-4 h-4 text-[#00d2ff]" /> LIVE LOCATION DETAIL REPORT
              </div>
              <div className="mt-2 text-[11px] space-y-1">
                <div className="flex justify-between border-b border-[#132d4a] py-1">
                  <span className="text-slate-500">Fix time</span>
                  <span className="text-slate-200">{new Date(liveFix.at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-[#132d4a] py-1">
                  <span className="text-slate-500">GPS accuracy</span>
                  <span className="text-slate-200">±{Math.round(liveFix.accuracyM)}m</span>
                </div>
                <div className="flex justify-between border-b border-[#132d4a] py-1">
                  <span className="text-slate-500">Decimal</span>
                  <span className="text-slate-200">{place.lat.toFixed(6)}, {place.lon.toFixed(6)}</span>
                </div>
                <div className="flex justify-between border-b border-[#132d4a] py-1">
                  <span className="text-slate-500">DMS</span>
                  <span className="text-slate-200">{dms.lat}, {dms.lon}</span>
                </div>
                <div className="flex justify-between border-b border-[#132d4a] py-1">
                  <span className="text-slate-500">Nearest drone</span>
                  <span className="text-[#00d2ff] font-bold">
                    {distKm !== null && brg !== null
                      ? `${live?.drone_id ?? '—'} • ${distKm.toFixed(2)} km ${compass16(brg)}` +
                        (etaMin !== null ? ` • ETA ~${etaMin.toFixed(0)} min` : '')
                      : 'awaiting live fix…'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Scenario / Link</span>
                  <span className="text-slate-200">
                    {live?.scenario ?? '—'} / {live ? `${live.signal_pct.toFixed(0)}%` : '—'}
                  </span>
                </div>
              </div>
              <button
                onClick={copyReport}
                className="mt-3 w-full py-2 rounded text-xs font-bold border border-[#00d2ff]/50 text-[#00d2ff] hover:bg-[#00d2ff]/10 flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'COPIED ✓' : 'COPY FULL REPORT'}
              </button>
            </div>
          )}

          {place && (
            <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
                <Star className="w-4 h-4 text-amber-300" /> GOOGLE PLACE DATA
              </div>
              {gloading && (
                <div className="text-[11px] text-slate-500 py-3 text-center">
                  Fetching Google data…
                </div>
              )}
              {!gloading && gerror === GOOGLE_KEY_MISSING && (
                <div className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                  <div className="text-amber-300 font-bold">NO GOOGLE KEY CONFIGURED</div>
                  <ol className="list-decimal ml-4 mt-1 space-y-0.5">
                    <li>Create a key: Google Cloud Console → APIs & Services → Credentials → Create Credentials → API key.</li>
                    <li>Enable the <b>Places API (New)</b> on the project (free $200/mo credit covers testing).</li>
                    <li>Restrict the key by HTTP referrer to your domains.</li>
                    <li>Set <b>NEXT_PUBLIC_GOOGLE_MAPS_KEY</b> in <b>.env.local</b> (local) and Vercel → Project → Settings → Environment Variables (live), then redeploy.</li>
                  </ol>
                </div>
              )}
              {!gloading && gerror !== '' && gerror !== GOOGLE_KEY_MISSING && (
                <div className="text-[11px] text-rose-400 mt-2">Google: {gerror}</div>
              )}
              {!gloading && gplace && (
                <div className="mt-2 text-[11px]">
                  {gplace.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={gplace.photoUrl}
                      alt={gplace.name}
                      className="w-full h-36 object-cover rounded border border-[#1b314b]"
                      loading="lazy"
                    />
                  )}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-amber-300 font-bold text-sm">
                      <Star className="w-4 h-4" /> {gplace.rating?.toFixed(1) ?? '—'}
                    </span>
                    <span className="text-slate-500">
                      {gplace.ratingCount !== undefined ? `${gplace.ratingCount.toLocaleString()} reviews` : ''}
                    </span>
                    {gplace.openNow !== undefined && (
                      <span className={gplace.openNow ? 'text-emerald-400' : 'text-rose-400'}>
                        • {gplace.openNow ? 'OPEN NOW' : 'CLOSED'}
                      </span>
                    )}
                  </div>
                  {gplace.types && gplace.types.length > 0 && (
                    <div className="mt-1 text-slate-500">
                      {gplace.types.slice(0, 4).join(' • ').replaceAll('_', ' ')}
                    </div>
                  )}
                  <div className="mt-2 flex flex-col gap-1">
                    {gplace.phone && (
                      <a href={`tel:${gplace.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 text-[#00d2ff]">
                        <Phone className="w-3.5 h-3.5" /> {gplace.phone}
                      </a>
                    )}
                    {gplace.website && (
                      <a href={gplace.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#00d2ff] truncate">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{gplace.website.replace(/^https?:\/\//, '').split('/')[0]}</span>
                      </a>
                    )}
                  </div>
                  {gplace.weekdayHours && gplace.weekdayHours.length > 0 && (
                    <details className="mt-2">
                      <summary className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                        <Clock className="w-3.5 h-3.5" /> OPENING HOURS
                      </summary>
                      <div className="mt-1 text-slate-400 space-y-0.5">
                        {gplace.weekdayHours.map((h) => (
                          <div key={h}>{h}</div>
                        ))}
                      </div>
                    </details>
                  )}
                  {gplace.reviews && gplace.reviews.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {gplace.reviews.map((r, i) => (
                        <div key={i} className="p-2 rounded bg-[#081a2c] border border-[#132d4a]">
                          <div className="flex justify-between">
                            <span className="text-white font-bold">{r.author}</span>
                            <span className="text-amber-300">★ {r.rating}{r.time ? ` • ${r.time}` : ''}</span>
                          </div>
                          <div className="text-slate-300 mt-0.5 line-clamp-3">{r.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Map + drone proximity */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-[#051424] border border-[#1b314b] rounded-xl overflow-hidden">
            <div className="bg-[#081b2e] px-4 py-2 border-b border-[#1b314b] text-xs font-bold text-white flex items-center gap-2 flex-wrap">
              <span>
                {place ? shortName(place.name).toUpperCase() : 'NO FIX — SEARCH A PLACE'}{' '}
                {place ? `${place.lat.toFixed(4)}°N, ${place.lon.toFixed(4)}°E` : '—.————°N, —.————°E'}
              </span>
              <span className="ml-auto flex items-center gap-1 bg-[#020b14] p-0.5 rounded border border-[#1b314b]">
                {(['OSM', 'GOOGLE'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setMapSrc(s)}
                    className={`px-2.5 py-0.5 text-[10px] rounded transition-all ${
                      mapSrc === s ? 'bg-[#00d2ff] text-black font-bold' : 'text-slate-400'
                    }`}
                  >
                    {s === 'OSM' ? 'OSM RADAR' : 'GOOGLE MAPS'}
                  </button>
                ))}
              </span>
            </div>
            <div className="h-[380px] bg-black">
              {mapSrc === 'OSM' || !place ? (
                <DroneLeafletTracker
                  lat={place?.lat ?? 17.385}
                  lon={place?.lon ?? 78.4867}
                  circles={mapSrc === 'OSM' ? layerCircles : []}
                />
              ) : (
                <iframe
                  title={`Google Maps — ${shortName(place.name)}`}
                  src={gmapsEmbed}
                  className="w-full border-0"
                  style={{ height: 380 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              )}
            </div>
          </div>

          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="text-xs font-bold text-white pb-2">
              HAZARD LAYERS <span className="font-normal text-slate-500">(OSM view · SIMULATION zones)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {HAZ_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleLayer(t)}
                  aria-pressed={!layersOff[t]}
                  className={`px-2 py-1 rounded text-[10px] border ${
                    layersOff[t]
                      ? 'border-[#1b314b] text-slate-500'
                      : 'border-[#00d2ff]/60 text-[#00d2ff]'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
              {FAC_KINDS.map((k) => (
                <button
                  key={k}
                  onClick={() => toggleLayer(k)}
                  aria-pressed={!layersOff[k]}
                  className={`px-2 py-1 rounded text-[10px] border ${
                    layersOff[k]
                      ? 'border-[#1b314b] text-slate-500'
                      : 'border-emerald-500/60 text-emerald-300'
                  }`}
                >
                  {k === 'shelter' ? '🏕' : k === 'hospital' ? '🏥' : k === 'police' ? '🚔' : k === 'fire' ? '🚒' : k === 'dam' ? '🌊' : k === 'bridge' ? '🌉' : '📦'} {k.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400" aria-label="Map legend">
              <span className="font-bold text-slate-300">LEGEND:</span>
              {[
                ['#34d399', 'Safe / open'],
                ['#facc15', 'Watch'],
                ['#fb923c', 'Warning'],
                ['#fb7185', 'Critical'],
              ].map(([c, l]) => (
                <span key={l} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: c }} />
                  {l}
                </span>
              ))}
            </div>
            <details className="mt-2 text-[11px] text-slate-400">
              <summary className="cursor-pointer text-[#00d2ff]">EXPLAIN THIS MAP</summary>
              <div className="mt-1 leading-relaxed">
                Circles are labeled demo/simulation hazard cells and facility markers — not live
                official data. Colors show the cell&apos;s drill level (green→red). Pulsing rings
                mark high/critical cells. Tap any circle for its label. Your GPS fix never leaves
                this browser.
              </div>
            </details>
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
    </CinematicShell>
  );
}
