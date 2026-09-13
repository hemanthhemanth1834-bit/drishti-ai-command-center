// src/app/resources/page.tsx — Hospital & ICU Command
'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import CinematicShell from '@/components/cinematic/CinematicShell';
import StatusHeader from '@/components/cinematic/StatusHeader';
import HudPanel from '@/components/cinematic/HudPanel';
import AnimatedCounter, { Waveform, RadialGauge } from '@/components/cinematic/AnimatedCounter';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import TrustBadge from '@/components/TrustBadge';
import { fetchTelemetryData } from '@/utils/apiClient';
import { Building2, BedDouble, Wind } from 'lucide-react';

type Sensor = { sensor_id: string; kind: string; value: number; unit: string };

const ICU_REGISTRY = [
  { hospital: 'District General #07', icuFree: 3, ventFree: 2, oxygenKL: 4.2, ed: 'OPEN · 6 bays', status: 'ACCEPTING' },
  { hospital: 'City Care Center', icuFree: 0, ventFree: 1, oxygenKL: 1.8, ed: 'DIVERT · trauma only', status: 'DIVERT' },
  { hospital: 'Riverside Medical', icuFree: 5, ventFree: 4, oxygenKL: 6.5, ed: 'OPEN · 9 bays', status: 'ACCEPTING' },
  { hospital: 'Cantonment Hospital', icuFree: 1, ventFree: 0, oxygenKL: 2.4, ed: 'LIMITED · walk-in', status: 'LIMITED' },
];

export default function ResourcesPage() {
  const { connected } = useTelemetrySocket();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchTelemetryData('/api/v1/sensors')
      .then((j) => setSensors(j.sensors ?? []))
      .catch((e: Error) => setErr(e.message));
  }, []);

  return (
    <CinematicShell intensity={0.6} label="Hospital ICU command">
    <main className="min-h-screen text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <StatusHeader wsConnected={connected} />
      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-8 flex flex-col gap-4">
        <HudPanel micro="MEDICAL TELEMETRY · DEMO DATA" title="ICU TELEMETRY — LIVE WAVEFORMS" right={<span className="dx-sim">DEMO</span>}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[['ECG · BED 03', '#34d399'], ['SPO2 · BED 07', '#00d2ff'], ['RESP · BED 11', '#ffb020']].map(([l, c]) => (
              <div key={l} className="bg-[#091a2e] rounded-lg border border-[#1b314b] p-2">
                <div className="dx-micro">{l}</div>
                <Waveform color={c as string} />
              </div>
            ))}
          </div>
        </HudPanel>
        <section className="bg-[#051424]/85 backdrop-blur border border-[#1b314b] rounded-xl p-4">
          <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
            <BedDouble className="w-4 h-4 text-[#00d2ff]" />
            ICU VENTILATOR BED REGISTRY — MULTI-AGENCY TRIAGE
            <span className="ml-auto">
              <TrustBadge kind="DEMO" source="SIMULATED CAPACITY — replace with live feed" />
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            Drill figures for coordination practice. Never treat as real bed availability.
          </div>
          <div className="mt-3 space-y-2 text-xs">
            {ICU_REGISTRY.map((h) => (
              <div
                key={h.hospital}
                className="p-3 rounded bg-[#091a2e] border border-[#1b314b] grid grid-cols-2 md:grid-cols-6 gap-2 items-center"
              >
                <span className="font-bold text-white md:col-span-2">{h.hospital}</span>
                <span>ICU free: <b className={h.icuFree ? 'text-emerald-400' : 'text-rose-400'}>{h.icuFree}</b></span>
                <span>Vent free: <b className={h.ventFree ? 'text-emerald-400' : 'text-rose-400'}>{h.ventFree}</b></span>
                <span className="text-[11px] text-slate-300">ED: {h.ed}</span>
                <span className="flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-[#00d2ff]" /> O₂ {h.oxygenKL}kL
                  <span
                    className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold ${
                      h.status === 'ACCEPTING'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : h.status === 'LIMITED'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {h.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
        </section>

        <section className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 pb-3 border-b border-[#1b314b]">
              <Building2 className="w-4 h-4 text-[#00d2ff]" /> FIELD SENSOR BUFFER (/api/v1)
            </div>
            <div className="mt-2 space-y-1 text-[11px]">
              {err && <div className="text-rose-400">REST: {err}</div>}
              {sensors.map((s) => (
                <div
                  key={s.sensor_id}
                  className="p-1.5 rounded bg-[#081a2c] border border-[#132d4a] flex justify-between"
                >
                  <span className="text-[#00d2ff] font-bold">{s.sensor_id}</span>
                  <span>{s.kind}</span>
                  <span>{s.value} {s.unit}</span>
                </div>
              ))}
              {sensors.length === 0 && !err && (
                <div className="text-slate-500 py-3 text-center">Loading sensors…</div>
              )}
            </div>
          </div>
          <div className="bg-[#051424]/85 backdrop-blur border border-[#1b314b] rounded-xl p-4 text-xs">
            <div className="font-bold text-white pb-2 border-b border-[#1b314b]">
              AUTO-DISPATCH PAIRING
            </div>
            <div className="mt-2 bg-[#091a2e] p-2.5 rounded border border-[#1b314b]">
              <div className="text-slate-400 text-[10px]">NEXT PAIRING</div>
              <div className="text-[#00d2ff] font-bold mt-0.5">AMB-12 → District General #07</div>
              <div className="text-slate-400 text-[11px] mt-1">Hypothermia case • ICU-03 reserved • O₂ buffer OK</div>
              <div className="mt-2 flex gap-2">
                <RadialGauge value={9} max={12} label="ICU FREE" tone="#34d399" />
                <RadialGauge value={7} max={12} label="VENT FREE" tone="#00d2ff" />
                <RadialGauge value={15} max={20} label="O₂ kL" tone="#ffb020" />
              </div>
              <div className="mt-1 text-[10px] text-slate-500">CRITICAL · WARNING · STABLE triage live · <AnimatedCounter value={3} /> critical inbound</div>
              <button className="mt-2 w-full py-1.5 bg-[#00d2ff] text-black font-bold rounded">
                CONFIRM PAIRING
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
    </CinematicShell>
  );
}
