'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp, setApp } from '@/store/appStore';
import { useOps } from '@/store/opsStore';
import { useT } from '@/i18n/dict';
import { evaluateAlerts, incidentLevel, type IncidentTone } from '@/utils/alertRules';
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
  HeartPulse,
  Crosshair,
  Bell,
  LifeBuoy,
  Route as RouteIcon,
  Siren,
  FileWarning,
  ClipboardList,
  Backpack,
  BookOpen,
  Mic,
  Languages,
  House,
  Gauge,
  Database,
  Clapperboard,
} from 'lucide-react';

const COMMAND_ITEMS = [
  { href: '/nesafe', labelKey: 'nav_nesafe', icon: ShieldAlert },
  { href: '/intelligence', labelKey: 'nav_intelligence', icon: Crosshair },
  { href: '/command', labelKey: 'nav_command', icon: Activity },
  { href: '/ops', labelKey: 'nav_ops', icon: Gauge },
  { href: '/demo', labelKey: 'nav_demo', icon: Clapperboard },
  { href: '/sources', labelKey: 'nav_sources', icon: Database },
  { href: '/drones', labelKey: 'nav_drones', icon: Plane },
  { href: '/twin', labelKey: 'nav_twin', icon: Box },
  { href: '/location', labelKey: 'nav_location', icon: MapPin },
  { href: '/simulation', labelKey: 'nav_sim', icon: Cpu },
  { href: '/resources', labelKey: 'nav_resources', icon: Building2 },
  { href: '/shelter', labelKey: 'nav_shelter', icon: Users },
  { href: '/reunion', labelKey: 'nav_reunion', icon: ScanFace },
  { href: '/recovery', labelKey: 'nav_recovery', icon: BarChart3 },
  { href: '/portal', labelKey: 'nav_portal', icon: Globe },
  { href: '/platform', labelKey: 'nav_platform', icon: Landmark },
];

const PUBLIC_ITEMS = [
  { href: '/nesafe', labelKey: 'nav_nesafe', icon: ShieldAlert },
  { href: '/intelligence', labelKey: 'nav_intelligence', icon: Crosshair },
  { href: '/welcome', labelKey: 'nav_welcome', icon: House },
  { href: '/safety', labelKey: 'nav_safety', icon: HeartPulse },
  { href: '/risk', labelKey: 'nav_risk', icon: Crosshair },
  { href: '/alerts', labelKey: 'nav_alerts', icon: Bell },
  { href: '/nearby', labelKey: 'nav_nearby', icon: LifeBuoy },
  { href: '/evacuate', labelKey: 'nav_evacuate', icon: RouteIcon },
  { href: '/emergency', labelKey: 'nav_emergency', icon: Siren },
  { href: '/report', labelKey: 'nav_report', icon: FileWarning },
  { href: '/family', labelKey: 'nav_family', icon: Users },
  { href: '/plan', labelKey: 'nav_plan', icon: ClipboardList },
  { href: '/kit', labelKey: 'nav_kit', icon: Backpack },
  { href: '/learn', labelKey: 'nav_learn', icon: BookOpen },
  { href: '/talk', labelKey: 'nav_talk', icon: Mic },
];

const TONE_STYLES: Record<IncidentTone, { box: string; text: string; icon: string }> = {
  critical: { box: 'bg-rose-500/20 border-rose-500/50', text: 'text-rose-300', icon: 'text-rose-400' },
  elevated: { box: 'bg-amber-500/20 border-amber-500/50', text: 'text-amber-300', icon: 'text-amber-400' },
  stable: { box: 'bg-emerald-500/20 border-emerald-500/50', text: 'text-emerald-300', icon: 'text-emerald-400' },
};

export default function Navbar({
  wsConnected,
  incident,
}: {
  wsConnected: boolean;
  /** Full telemetry-aware posture (homepage/simulation pass this). */
  incident?: { label: string; tone: IncidentTone };
}) {
  const pathname = usePathname();
  const { mode, lang } = useApp();
  const ops = useOps();
  const tr = useT();
  const items = mode === 'public' ? PUBLIC_ITEMS : COMMAND_ITEMS;
  // Fallback posture from shared ops state (scenario + spillway rules need no telemetry).
  const posture =
    incident ??
    incidentLevel(
      evaluateAlerts({ scenario: ops.scenario, spillwayK: ops.spillwayK, geofenceBreach: false })
    );
  const tone = TONE_STYLES[posture.tone];

  return (
    <header className="sticky top-0 z-50 select-none">
      <div className="bg-[#030d17] border-b border-[#1b314b] px-4 py-2 flex items-center justify-between text-xs font-mono gap-2">
        {/* Brand Identity */}
        <Link href={mode === 'public' ? '/safety' : '/command'} className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-[#00d2ff]/10 border border-[#00d2ff]/40 flex items-center justify-center text-[#00d2ff] font-bold text-base shadow-[0_0_12px_rgba(0,210,255,0.3)]">
            DX
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-white text-sm">DRISHTI-X</span>
              <span className="bg-[#00d2ff]/20 text-[#00d2ff] px-1.5 py-0.5 rounded text-[10px] border border-[#00d2ff]/40">
                SOVEREIGN V4.2
              </span>
            </div>
            <p className="text-[10px] text-slate-400">DISASTER INTELLIGENCE COMMAND</p>
          </div>
        </Link>
        {/* Navigation Links */}
        <nav
          className="dx-nav flex items-center gap-1 bg-[#051424] p-1 rounded-lg border border-[#1b314b] overflow-x-auto"
          aria-label="Primary"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`dx-nav-link flex items-center gap-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                  isActive
                    ? 'dx-nav-active bg-[#00d2ff] text-[#030d17] font-bold shadow-[0_0_10px_rgba(0,210,255,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-[#0d2238]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tr(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
        {/* Status Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-[#051424] border border-[#1b314b]">
            <span
              className={`w-2 h-2 rounded-full ${
                wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className={wsConnected ? 'text-emerald-400' : 'text-rose-400'}>
              {wsConnected ? 'LIVE 868MHz WS' : 'OFFLINE'}
            </span>
          </div>
          <div
            className={`px-2 py-1 rounded border font-bold flex items-center gap-1 whitespace-nowrap ${tone.box} ${tone.text}`}
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${tone.icon}`} />
            <span>{posture.label}</span>
          </div>
        </div>
      </div>
      {/* Mode / language / emergency strip */}
      <div className="bg-[#020b14] border-b border-[#1b314b] px-4 py-1 flex items-center gap-2 text-[11px] font-mono">
        <button
          onClick={() => setApp({ mode: mode === 'public' ? 'command' : 'public' })}
          className={`px-2.5 py-1 rounded font-bold border transition-all ${
            mode === 'public'
              ? 'bg-emerald-400 text-black border-emerald-400'
              : 'bg-[#00d2ff] text-black border-[#00d2ff]'
          }`}
          aria-label="Switch interface mode"
        >
          {mode === 'public' ? tr('mode_public') : tr('mode_command')}
        </button>
        <label className="flex items-center gap-1 text-slate-400">
          <Languages className="w-3.5 h-3.5" />
          <select
            value={lang}
            onChange={(e) => setApp({ lang: e.target.value as 'en' | 'te' | 'hi' | 'as' | 'bn' | 'ne' | 'mni' | 'mizo' | 'kh' })}
            className="bg-[#051424] border border-[#1b314b] rounded px-1.5 py-1 text-slate-200"
            aria-label="Language"
          >
            <option value="en">English</option>
            <option value="te">తెలుగు</option>
            <option value="hi">हिन्दी</option>
            <option value="as">অসমীয়া</option>
            <option value="bn">বাংলা</option>
            <option value="ne">नेपाली</option>
            <option value="mni">Manipuri</option>
            <option value="mizo">Mizo</option>
            <option value="kh">Khasi</option>
          </select>
        </label>
        <Link
          href="/emergency"
          className={`ml-auto px-3 py-1 rounded font-bold flex items-center gap-1.5 border whitespace-nowrap ${
            pathname === '/emergency'
              ? 'bg-rose-500 text-white border-rose-500'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
          }`}
        >
          <Siren className="w-3.5 h-3.5" /> {tr('nav_emergency')}
        </Link>
      </div>
    </header>
  );
}
