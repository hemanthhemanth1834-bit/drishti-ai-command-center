// src/app/platform/page.tsx — DRISHTI-X platform inventory & system specs
'use client';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import DemoConsole from '@/components/DemoConsole';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import {
  Activity, Box, Plane, Cpu, Building2, Users, ScanFace, BarChart3,
  Radio, KeyRound, ShieldCheck, QrCode, Satellite, Landmark,
} from 'lucide-react';

const PILLARS = [
  { href: '/command', icon: Activity, id: '01', name: 'Master Command Center', desc: 'Tactical HUD, Sector-04 telemetry, alert triage, Hydra-Net inference + dispatch authorization.' },
  { href: '/twin', icon: Box, id: '02', name: '3D Digital Twin & Topography', desc: 'WebGL elevation twin, +3.8m surge plane, entity picking, spotlight cones, air-drop actuators.' },
  { href: '/drones', icon: Plane, id: '03', name: 'Drone Swarm & Satellite SAR', desc: 'Optical/thermal FLIR recon, RISAT-1A / Sentinel-1 change cells, RTH fail-safe, waypoints.' },
  { href: '/simulation', icon: Cpu, id: '04', name: 'What-If Dam Breach Copilot', desc: 'Saint-Venant hydraulics, spillway controls, 72-h surge curve, DeepSeek-R1 local advisory.' },
  { href: '/resources', icon: Building2, id: '05', name: 'Hospital ICU & Resource Command', desc: 'ICU ventilator allocation, oxygen buffers, boat pairing, automated dispatch routing.' },
  { href: '/shelter', icon: Users, id: '06', name: 'Shelter Evacuee Scanner', desc: 'Kiosk mode, NFC wristbands, offline Aadhaar QR, triage tags for vulnerable groups.' },
  { href: '/reunion', icon: ScanFace, id: '07', name: 'OP-MILAN Match Queue', desc: 'Family reunification workflow across relief camps (facial-model integration pending).' },
  { href: '/recovery', icon: BarChart3, id: '08', name: 'Recovery & Audit (PDNA)', desc: 'Scour acoustics, pore-water boreholes, Merkle-chained relief grant ledger.' },
];

const HARDWARE = [
  { icon: Satellite, title: 'Zero-Paid-API GIS', desc: 'OpenStreetMap + CartoDB Dark Matter + native vectors. No Google/Mapbox tokens.' },
  { icon: Radio, title: '868 MHz LoRaWAN Mesh', desc: 'Peer-to-peer air-gapped packets over 64 sensor nodes. Zero 4G/5G dependency.' },
  { icon: KeyRound, title: 'Epoch Key Rotation', desc: 'Synchronized AES-256-GCM rotations with wake-pulses + Merkle verification proofs.' },
  { icon: ShieldCheck, title: 'PIP Geofence + RTH', desc: 'Sub-ms ray-casting with 20s fail-safe forcing emergency Return-To-Home.' },
  { icon: QrCode, title: 'Checkpoint Scanner', desc: 'Printable transit passes with encrypted QR, verifiable with zero reception.' },
];

const AGENCIES = [
  ['NDMA', 'National Disaster Management Authority', 'Inter-agency crisis protocols'],
  ['NDRF', 'National Disaster Response Force', 'Boat + battalion dispatch pairing'],
  ['IMD', 'India Meteorological Department', 'Doppler radar + weather telemetry'],
  ['ISRO / BHUVAN', 'Cartosat-3 & RISAT-1A', 'Optical + SAR change detection'],
  ['UIDAI §29', 'Aadhaar biometric standard', 'Ephemeral 60s processing, zero cloud storage'],
];

export default function PlatformPage() {
  const { packets, live, connected } = useTelemetrySocket();
  const frames = packets.slice(0, 6);

  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />
      <div className="p-4 max-w-6xl mx-auto flex flex-col gap-4">
        <DemoConsole />
        <div className="text-[10px] tracking-[0.2em] text-slate-400 text-center" aria-label="Disaster lifecycle">
          NORMAL → WATCH → WARNING → CRITICAL → EVACUATION → RESCUE → RECOVERY
        </div>
        <section>
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-[#00d2ff]" /> 8 OPERATIONAL PILLARS
          </div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <Link
                  key={p.id}
                  href={p.href}
                  className="p-3 rounded-xl bg-[#051424] border border-[#1b314b] hover:border-[#00d2ff]/60 transition-all block"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#00d2ff]" />
                    <span className="text-[10px] text-slate-500">{p.id}</span>
                  </div>
                  <div className="text-xs font-bold text-white mt-1">{p.name}</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">{p.desc}</div>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="text-xs font-bold text-white">FIELD HARDWARE & AIR-GAP ARCHITECTURE</div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {HARDWARE.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.title} className="p-3 rounded-xl bg-[#051424] border border-[#1b314b]">
                  <Icon className="w-4 h-4 text-[#00d2ff]" />
                  <div className="text-xs font-bold text-white mt-1">{h.title}</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">{h.desc}</div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <section className="lg:col-span-6 bg-[#051424] border border-[#1b314b] rounded-xl p-4">
            <div className="text-xs font-bold text-white pb-3 border-b border-[#1b314b]">
              INTER-AGENCY INTEGRATION MATRIX
            </div>
            <div className="mt-2 space-y-1 text-[11px]">
              {AGENCIES.map(([code, name, role]) => (
                <div key={code} className="p-2 rounded bg-[#081a2c] border border-[#132d4a]">
                  <div className="flex justify-between">
                    <span className="text-[#00d2ff] font-bold">{code}</span>
                    <span className="text-slate-400 text-right">{role}</span>
                  </div>
                  <div className="text-slate-300 mt-0.5">{name}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="lg:col-span-6 bg-[#051424] border border-[#1b314b] rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b314b]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-emerald-400" /> LIVE MESH PACKET SNIFFER
              </span>
              <span className="text-[10px] text-slate-400">
                {live ? `${live.drone_id} • tick ${live.tick}` : 'awaiting WS…'}
              </span>
            </div>
            <div className="mt-2 space-y-1 text-[10px] overflow-y-auto max-h-[300px]">
              {frames.length === 0 && (
                <div className="text-slate-500 py-4 text-center">Listening on 868MHz WS…</div>
              )}
              {frames.map((p) => (
                <pre
                  key={`${p.id}-${p.tick}`}
                  className="p-2 rounded bg-[#020b14] border border-[#132d4a] text-emerald-300/90 overflow-x-auto"
                >
                  {JSON.stringify(p, null, 1)}
                </pre>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
