// src/app/drones/page.tsx — Drone Swarm & SAR Radar
'use client';
import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/layout/Navbar';
import { useTelemetrySocket, type TelemetryPacket } from '@/hooks/useTelemetrySocket';
import { Plane, Thermometer, Package } from 'lucide-react';

const DroneLeafletTracker = dynamic(
  () => import('@/components/maps/DroneLeafletTracker'),
  { ssr: false }
);

const PAYLOADS = [
  { drone: 'DRX-01', payload: 'FLIR Thermal Cam', status: 'AIRBORNE', cap: '640×512 • 30Hz' },
  { drone: 'DRX-04', payload: 'Med-Kit Drop (2kg)', status: 'STAGED', cap: 'Winch • 40m' },
  { drone: 'DRX-07', payload: 'LoRa Relay + SAR', status: 'AIRBORNE', cap: '868MHz • 5km' },
  { drone: 'DRX-11', payload: 'Multispectral Survey', status: 'RTB', cap: '5-band • NDVI' },
];

export default function DronesPage() {
  const { packets, live, connected } = useTelemetrySocket();

  const fleet = useMemo(() => {
    const seen = new Map<string, TelemetryPacket>();
    for (const p of packets) if (!seen.has(p.drone_id)) seen.set(p.drone_id, p);
    return Array.from(seen.values()).slice(0, 8);
  }, [packets]);

  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-7 bg-[#051424] border border-[#1b314b] rounded-xl overflow-hidden">
          <div className="bg-[#081b2e] px-4 py-2 border-b border-[#1b314b] flex items-center gap-2">
            <Plane className="w-4 h-4 text-[#00d2ff]" />
            <span className="text-xs font-bold text-white tracking-wider">
              SWARM SAR RADAR // {(live?.lat ?? 17.385).toFixed(4)}°N,{' '}
              {(live?.lon ?? 78.4867).toFixed(4)}°E
            </span>
          </div>
          <div className="h-[420px] bg-black">
            <DroneLeafletTracker lat={live?.lat ?? 17.385} lon={live?.lon ?? 78.4867} />
          </div>
          <div className="px-4 py-2 border-t border-[#1b314b] text-[11px] text-slate-400 flex items-center gap-2">
            <Thermometer className="w-3.5 h-3.5 text-orange-400" />
            FLIR overlay: 3 thermal signatures • ISRO RISAT / Sentinel-1 change cells: 12
          </div>
        </section>

        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="text-xs font-bold text-white pb-2 border-b border-[#1b314b]">
              LIVE FLEET ({fleet.length} CONTACTS)
            </div>
            <div className="mt-2 space-y-1 text-[11px] max-h-[220px] overflow-y-auto">
              {fleet.length === 0 && (
                <div className="text-slate-500 py-4 text-center">Awaiting swarm packets…</div>
              )}
              {fleet.map((d) => (
                <div
                  key={d.drone_id}
                  className="p-1.5 rounded bg-[#081a2c] border border-[#132d4a] flex items-center justify-between"
                >
                  <span className="text-[#00d2ff] font-bold">{d.drone_id}</span>
                  <span>{d.alt_m.toFixed(0)}m</span>
                  <span>{d.battery_pct.toFixed(0)}%</span>
                  <span className="text-emerald-400">{d.mode}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="text-xs font-bold text-white pb-2 border-b border-[#1b314b] flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#00d2ff]" /> PAYLOAD DEPLOYMENT MATRIX
            </div>
            <div className="mt-2 space-y-1 text-[11px]">
              {PAYLOADS.map((p) => (
                <div
                  key={p.drone}
                  className="p-2 rounded bg-[#081a2c] border border-[#132d4a] grid grid-cols-3 gap-2"
                >
                  <span className="text-[#00d2ff] font-bold">{p.drone}</span>
                  <span>{p.payload}</span>
                  <span className="text-right text-amber-300">{p.status}</span>
                  <span className="col-span-3 text-slate-500">{p.cap}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
