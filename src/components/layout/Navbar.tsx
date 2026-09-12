'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  Activity,
  Plane,
  Building2,
  Cpu,
  Users,
  BarChart3,
  Globe,
  MapPin,
  Box,
  ScanFace,
  Landmark,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Command Center', icon: Activity },
  { href: '/drones', label: 'Drone Swarm & SAR', icon: Plane },
  { href: '/twin', label: '3D Digital Twin', icon: Box },
  { href: '/location', label: 'Location Intel', icon: MapPin },
  { href: '/simulation', label: 'What-If Copilot', icon: Cpu },
  { href: '/resources', label: 'Hospital ICU Command', icon: Building2 },
  { href: '/shelter', label: 'Shelter Scanner', icon: Users },
  { href: '/reunion', label: 'OP-MILAN Reunion', icon: ScanFace },
  { href: '/recovery', label: 'Recovery & Audit', icon: BarChart3 },
  { href: '/portal', label: 'Citizen Portal', icon: Globe },
  { href: '/platform', label: 'Platform Specs', icon: Landmark },
];

export default function Navbar({ wsConnected }: { wsConnected: boolean }) {
  const pathname = usePathname();
  return (
    <header className="bg-[#030d17] border-b border-[#1b314b] px-4 py-2 flex items-center justify-between text-xs font-mono select-none sticky top-0 z-50">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-[#00d2ff]/10 border border-[#00d2ff]/40 flex items-center justify-center text-[#00d2ff] font-bold text-base shadow-[0_0_12px_rgba(0,210,255,0.3)]">
          DX
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-wider text-white text-sm">DRISHTI-X</span>
            <span className="bg-[#00d2ff]/20 text-[#00d2ff] px-1.5 py-0.5 rounded text-[10px] border border-[#00d2ff]/40">
              SOVEREIGN V4.2
            </span>
          </div>
          <p className="text-[10px] text-slate-400">DISASTER INTELLIGENCE COMMAND</p>
        </div>
      </div>
      {/* Navigation Links */}
      <nav className="flex items-center gap-1 bg-[#051424] p-1 rounded-lg border border-[#1b314b] overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#00d2ff] text-[#030d17] font-bold shadow-[0_0_10px_rgba(0,210,255,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-[#0d2238]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {/* Status Badges */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#051424] border border-[#1b314b]">
          <span
            className={`w-2 h-2 rounded-full ${
              wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className={wsConnected ? 'text-emerald-400' : 'text-rose-400'}>
            {wsConnected ? 'LIVE 868MHz WS' : 'OFFLINE'}
          </span>
        </div>
        <div className="px-2 py-1 rounded bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>LEVEL-3 CRITICAL</span>
        </div>
      </div>
    </header>
  );
}
