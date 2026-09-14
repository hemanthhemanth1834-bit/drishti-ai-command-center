// EMERGENCY MODE — cinematic SOS command: big touch targets, configurable numbers, share + navigate.
// SOS activation adds a professional red emergency mode (radar pulse, location lock,
// status HUD, elapsed timer) WITHOUT changing any existing rescue logic.
'use client';
import { useEffect, useRef, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import TrustBadge from '@/components/TrustBadge';
import CinematicShell from '@/components/cinematic/CinematicShell';
import HudPanel from '@/components/cinematic/HudPanel';
import SosRadar from '@/components/cinematic/SosRadar';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { useT } from '@/i18n/dict';
import { EMERGENCY_NUMBERS, DEMO_FACILITIES } from '@/data/providers';
import { getLivePosition } from '@/utils/geocode';
import { haversineKm } from '@/utils/geocode';
import { Phone, Share2, Navigation, Siren, Hospital, Tent, Crosshair } from 'lucide-react';
import { setSosPhase, pushEvent, resolveEvent, type SosPhase } from '@/store/intelStore';

function useElapsed(running: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) {
      setSecs(0);
      return;
    }
    const t0 = Date.now();
    const t = window.setInterval(() => setSecs(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => window.clearInterval(t);
  }, [running]);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function EmergencyPage() {
  const { connected } = useTelemetrySocket();
  const tr = useT();
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [note, setNote] = useState('');
  const [shared, setShared] = useState(false);
  const [sos, setSos] = useState<SosPhase>('idle');
  const lockTimer = useRef<number | null>(null);
  const elapsed = useElapsed(sos === 'active');

  useEffect(() => () => {
    if (lockTimer.current) window.clearTimeout(lockTimer.current);
  }, []);

  // Publish SOS state to the shared intelligence layer (V3) so COMMAND,
  // globe, AI core, alerts and ticker react as one system. Local rescue
  // logic below is untouched — this only mirrors phase + real coords.
  const prevSos = useRef<SosPhase>('idle');
  useEffect(() => {
    setSosPhase(sos, coords);
    if (prevSos.current !== sos) {
      prevSos.current = sos;
      if (sos === 'locking') {
        pushEvent({
          id: 'sos-locking',
          type: 'SOS',
          severity: 'warning',
          title: 'SOS acquiring location lock',
          lat: coords?.lat,
          lon: coords?.lon,
          source: 'emergency',
        });
      } else if (sos === 'active') {
        pushEvent({
          id: 'sos-active',
          type: 'SOS',
          severity: 'critical',
          title: `SOS ACTIVE${coords ? ` — ${coords.lat}, ${coords.lon}` : ''}`,
          lat: coords?.lat,
          lon: coords?.lon,
          source: 'emergency',
        });
      } else {
        resolveEvent('sos-active');
        resolveEvent('sos-locking');
        pushEvent({
          id: `sos-stood-down-${Date.now()}`,
          type: 'SOS',
          severity: 'info',
          title: 'SOS stood down — beacon off',
          source: 'emergency',
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sos, coords?.lat, coords?.lon]);

  async function locate() {
    setNote('');
    try {
      const fix = await getLivePosition();
      // Round to ~100m before any sharing/display.
      setCoords({ lat: Math.round(fix.lat * 1000) / 1000, lon: Math.round(fix.lon * 1000) / 1000 });
    } catch (e: unknown) {
      setNote((e as Error).message);
    }
  }

  async function activateSos() {
    if (sos !== 'idle') return;
    setSos('locking');
    setNote('');
    try {
      const fix = await getLivePosition();
      setCoords({ lat: Math.round(fix.lat * 1000) / 1000, lon: Math.round(fix.lon * 1000) / 1000 });
    } catch (e: unknown) {
      setNote((e as Error).message);
    }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    lockTimer.current = window.setTimeout(() => setSos('active'), reduced ? 200 : 1800);
  }

  function standDown() {
    if (lockTimer.current) window.clearTimeout(lockTimer.current);
    setSos('idle');
  }

  const shelter = coords
    ? DEMO_FACILITIES.filter((f) => f.kind === 'shelter')
        .map((f) => ({ f, d: haversineKm(coords.lat, coords.lon, f.lat, f.lon) }))
        .sort((a, b) => a.d - b.d)[0]
    : null;
  const hospital = coords
    ? DEMO_FACILITIES.filter((f) => f.kind === 'hospital')
        .map((f) => ({ f, d: haversineKm(coords.lat, coords.lon, f.lat, f.lon) }))
        .sort((a, b) => a.d - b.d)[0]
    : null;

  async function share() {
    if (!coords) {
      await locate();
      return;
    }
    const text = `EMERGENCY — I need help near ${coords.lat}, ${coords.lon} (approx). Sent via DRISHTI-X.`;
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      setNote('Clipboard blocked — read the coords aloud instead.');
    }
  }

  const dir = (toLat: number, toLon: number, mode: 'driving' | 'walking' = 'driving') =>
    coords
      ? `https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lon}&destination=${toLat},${toLon}&travelmode=${mode}`
      : `https://www.google.com/maps/dir/?api=1&destination=${toLat},${toLon}&travelmode=${mode}`;

  const sosOn = sos !== 'idle';

  return (
    <CinematicShell
      intensity={sosOn ? 0.55 : 0.7}
      label="DRISHTI-X emergency SOS command"
      tone={sosOn ? "critical" : "ok"}
      focusKind={sosOn ? "sos" : null}
    >
      <main className={`min-h-screen font-mono ${sosOn ? 'dx-sos-mode' : 'bg-[#1a0505]'} text-slate-100`}>
        <Navbar wsConnected={connected} />
        <div className="p-4 max-w-3xl mx-auto flex flex-col gap-3 pb-10">
          <div className="flex items-center gap-2">
            <Siren className="w-6 h-6 text-rose-400" />
            <h1 className="text-2xl font-extrabold text-white">{tr('emg_title')}</h1>
            {sos === 'active' && <span className="dx-sos-live">◉ SOS ACTIVE · {elapsed}</span>}
          </div>
          <p className="text-sm bg-[#2a0a0a]/90 backdrop-blur border border-rose-500/40 rounded-xl p-3">{tr('emg_advice')}</p>

          {/* ── Cinematic SOS activator ── */}
          <HudPanel
            micro="DRISHTI-X · SOS COMMAND"
            title={sos === 'active' ? 'EMERGENCY BEACON ACTIVE' : sos === 'locking' ? 'ACQUIRING LOCATION LOCK…' : 'SOS EMERGENCY BEACON'}
            tone={sosOn ? 'critical' : 'default'}
            right={
              sos === 'active' ? (
                <span className="dx-sos-timer" role="timer" aria-label={`SOS active for ${elapsed}`}>{elapsed}</span>
              ) : (
                <TrustBadge kind="LOCAL" source="on-device only" />
              )
            }
          >
            <SosRadar active={sosOn} lat={coords?.lat ?? null} lon={coords?.lon ?? null} />
            <div className="dx-sos-grid" aria-hidden="false">
              <div><span>BEACON</span><b className={sosOn ? 'dx-sos-on' : ''}>{sos === 'active' ? 'BROADCASTING' : sos === 'locking' ? 'LOCKING…' : 'STANDBY'}</b></div>
              <div><span>LOCATION</span><b>{coords ? `${coords.lat}, ${coords.lon}` : 'AWAITING FIX'}</b></div>
              <div><span>NETWORK</span><b>{connected ? 'LIVE WS' : 'ON-DEVICE'}</b></div>
              <div><span>LEVEL</span><b className={sosOn ? 'dx-sos-on' : ''}>{sosOn ? 'PRIORITY-1' : '—'}</b></div>
            </div>
            {sos === 'idle' && (
              <button onClick={activateSos} className="dx-sos-btn" aria-label="Activate SOS emergency beacon">
                <Crosshair className="w-5 h-5" /> ACTIVATE SOS BEACON
              </button>
            )}
            {sos === 'locking' && (
              <div role="status" aria-live="polite">
                <div className="dx-sos-locking">
                  <span className="dx-sos-lock-ring" aria-hidden="true" />
                  LOCKING LOCATION… KEEP DEVICE STEADY
                </div>
                <ol className="dx-sos-stages">
                  <li className="dx-sos-stage dx-sos-stage-1"><span>RED SYSTEM SCAN</span><b>RUNNING</b></li>
                  <li className="dx-sos-stage dx-sos-stage-2"><span>LOCATION ACQUISITION</span><b>{coords ? "LOCKED" : "SEARCHING"}</b></li>
                  <li className="dx-sos-stage dx-sos-stage-3"><span>NETWORK VERIFICATION</span><b>{connected ? "LIVE" : "ON-DEVICE"}</b></li>
                </ol>
              </div>
            )}
            {sos === 'active' && (
              <div className="flex gap-2 flex-wrap mt-3">
                <button onClick={share} className="dx-sos-btn dx-sos-btn-share">
                  <Share2 className="w-4 h-4" /> {shared ? 'COPIED ✓' : 'SHARE LOCATION TEXT'}
                </button>
                <button onClick={standDown} className="dx-sos-standdown" aria-label="Stand down SOS beacon">
                  STAND DOWN
                </button>
              </div>
            )}
            <p className="dx-sos-note">Beacon prepares your approx location on-device. Nothing is uploaded — sharing only copies text when you tap share.</p>
          </HudPanel>

          <section aria-label="Emergency numbers">
            <h2 className="text-xs font-bold text-slate-300 mb-2">CALL / CONTACT</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EMERGENCY_NUMBERS.map((n) => (
                <a
                  key={n.key}
                  href={`tel:${n.number}`}
                  className="flex items-center gap-3 p-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white dx-sos-call"
                >
                  <Phone className="w-6 h-6 shrink-0" />
                  <span>
                    <span className="block text-xs opacity-80">{tr(n.key)}</span>
                    <span className="block text-2xl font-extrabold">{n.number}</span>
                  </span>
                  <span className="ml-auto text-xs font-bold opacity-80">{tr('emg_call')}</span>
                </a>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Numbers are configurable in one place (<code>EMERGENCY_NUMBERS</code>). Verify for your region.
            </p>
          </section>

          <section className="bg-[#051424]/90 backdrop-blur border border-[#1b314b] rounded-xl p-4">
            <h2 className="text-xs font-bold text-white">YOUR LOCATION (approx, on-device only)</h2>
            <div className="mt-2 flex gap-2 flex-wrap">
              <button onClick={locate} className="px-4 py-2.5 rounded-lg bg-[#00d2ff] text-black text-sm font-bold">
                {coords ? `${coords.lat}, ${coords.lon}` : 'GET MY LOCATION'}
              </button>
              <button
                onClick={share}
                className="px-4 py-2.5 rounded-lg border border-[#00d2ff]/50 text-[#00d2ff] text-sm font-bold flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4" /> {shared ? 'COPIED ✓' : tr('emg_share')}
              </button>
              <a
                href="/family"
                className="px-4 py-2.5 rounded-lg border border-emerald-500/50 text-emerald-300 text-sm font-bold flex items-center"
              >
                👪 FAMILY CHECK-IN
              </a>
            </div>
            {note && <div className="mt-2 text-[12px] text-amber-300">{note}</div>}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="p-3 rounded-lg bg-[#091a2e] border border-[#1b314b]">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Tent className="w-3.5 h-3.5" /> NEAREST SHELTER <TrustBadge kind="DEMO" />
                </div>
                <div className="font-bold text-white mt-0.5">{shelter ? shelter.f.name : 'Get location first'}</div>
                {shelter && (
                  <a
                    className="mt-1 inline-flex items-center gap-1 text-[#00d2ff] font-bold"
                    href={dir(shelter.f.lat, shelter.f.lon)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="w-3.5 h-3.5" /> {tr('emg_shelter')} · {shelter.d.toFixed(1)} km
                  </a>
                )}
              </div>
              <div className="p-3 rounded-lg bg-[#091a2e] border border-[#1b314b]">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Hospital className="w-3.5 h-3.5" /> NEAREST HOSPITAL <TrustBadge kind="DEMO" />
                </div>
                <div className="font-bold text-white mt-0.5">{hospital ? hospital.f.name : 'Get location first'}</div>
                {hospital && (
                  <a
                    className="mt-1 inline-flex items-center gap-1 text-[#00d2ff] font-bold"
                    href={dir(hospital.f.lat, hospital.f.lon)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="w-3.5 h-3.5" /> {tr('emg_hospital')} · {hospital.d.toFixed(1)} km
                  </a>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </CinematicShell>
  );
}
