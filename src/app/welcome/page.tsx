// WELCOME — cinematic DRISHTI-X poster/landing. Pure code + CSS art.
// Drop the official artwork at public/poster.jpg and it becomes the backdrop automatically.
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import { setApp, useApp } from '@/store/appStore';
import {
  HeartPulse, MapPin, Layers, Bell, Siren, Route as RouteIcon,
  LifeBuoy, FileWarning, Users, ClipboardList, Backpack, BookOpen,
  Cpu, Box, Plane, Building2, Tent, BarChart3, Languages,
  Accessibility, Mic, WifiOff, User, MonitorSmartphone, Play, ChevronRight,
} from 'lucide-react';

const ROW1 = [
  { icon: HeartPulse, title: 'MY SAFETY', desc: 'Check your risk. Stay informed.', href: '/safety' },
  { icon: MapPin, title: 'LIVE LOCATION', desc: 'Explore hazards. View risk layers.', href: '/location' },
  { icon: Layers, title: 'HAZARD MAPS', desc: 'Flood, Cyclone, Earthquake, Fire & more.', href: '/location' },
  { icon: Bell, title: 'ALERT CENTER', desc: 'Real-time alerts. Know what to do.', href: '/alerts' },
  { icon: Siren, title: 'EMERGENCY MODE', desc: 'One tap for help. Contacts & navigation.', href: '/emergency' },
  { icon: RouteIcon, title: 'SAFE EVACUATION', desc: 'Find the safest route. Reach shelter.', href: '/evacuate' },
];

const ROW2 = [
  { icon: LifeBuoy, title: 'NEARBY HELP', desc: 'Hospitals, Shelters, Police, Fire & more.', href: '/nearby' },
  { icon: FileWarning, title: 'CITIZEN REPORTING', desc: 'Report incidents. Be the eyes on ground.', href: '/report' },
  { icon: Users, title: 'FAMILY SAFETY', desc: 'Keep your loved ones safe.', href: '/family' },
  { icon: ClipboardList, title: 'PERSONAL PLAN', desc: 'Be prepared. Step by step.', href: '/plan' },
  { icon: Backpack, title: 'EMERGENCY KIT', desc: 'Essentials for any disaster.', href: '/kit' },
  { icon: BookOpen, title: 'DISASTER EDUCATION', desc: 'Before · During · After. Learn & stay ready.', href: '/learn' },
  { icon: Cpu, title: 'WHAT-IF COPILOT', desc: 'Simulate scenarios. See possible impact.', href: '/simulation' },
  { icon: Box, title: '3D DIGITAL TWIN', desc: 'Explore realistic 3D environments.', href: '/twin' },
  { icon: Plane, title: 'DRONE SAR', desc: 'Search · Locate · Assist. Save lives.', href: '/drones' },
];

export default function WelcomePage() {
  const { connected } = useTelemetrySocket();
  const { lang } = useApp();
  const [bgOk, setBgOk] = useState(true);
  const langs = ['en', 'te', 'hi'] as const;
  const router = useRouter();
  const [seqStep, setSeqStep] = useState(0);

  // Cinematic opening sequence (skipped when reduced motion is preferred).
  useEffect(() => {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setSeqStep(5);
        return;
      }
    } catch {
      /* ignore */
    }
    const t = setInterval(() => setSeqStep((s) => (s >= 5 ? 5 : s + 1)), 450);
    return () => clearInterval(t);
  }, []);

  // Press ENTER anywhere to enter the site (same as INITIALIZING).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? '';
      if (e.key === 'Enter' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        router.push('/safety');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono">
      <Navbar wsConnected={connected} />

      {/* HERO — poster composition */}
      <section className="relative overflow-hidden">
        {bgOk && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/poster.jpg"
            alt=""
            aria-hidden
            onError={() => setBgOk(false)}
            className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
          />
        )}
        {/* Fallback CSS art: night glow + grid horizon */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(900px 420px at 50% 0%, rgba(0,210,255,0.16), transparent 60%), radial-gradient(700px 380px at 85% 100%, rgba(244,63,94,0.10), transparent 60%), radial-gradient(700px 380px at 8% 100%, rgba(52,211,153,0.08), transparent 60%), linear-gradient(#020b14, #020b14)',
          }}
        />
        {/* Perspective synthwave grid floor */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 overflow-hidden pointer-events-none">
          <div
            className="absolute -inset-x-1/4 bottom-[-60%] h-[220%] mx-auto"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,210,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(0,210,255,0.35) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              transform: 'perspective(320px) rotateX(62deg)',
              maskImage: 'linear-gradient(to top, black 30%, transparent 95%)',
              WebkitMaskImage: 'linear-gradient(to top, black 30%, transparent 95%)',
            }}
          />
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #8cf7ff, transparent)', boxShadow: '0 0 24px 2px rgba(0,210,255,0.7)' }}
          />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-8 text-center">
          <div className="text-[10px] sm:text-xs tracking-[0.3em] text-slate-400">
            PEOPLE&nbsp;&nbsp;|&nbsp;&nbsp;PLANET&nbsp;&nbsp;|&nbsp;&nbsp;PREPARE&nbsp;&nbsp;|&nbsp;&nbsp;RESPOND&nbsp;&nbsp;|&nbsp;&nbsp;RECOVER
          </div>
          <h1 className="mt-3 text-5xl sm:text-7xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(0,210,255,0.45)]">
            DRISHTI<span className="text-[#00d2ff]">-X</span>
          </h1>
          <div className="mt-1 text-xs sm:text-sm tracking-[0.25em] text-[#00d2ff] font-bold">
            SOVEREIGN DISASTER INTELLIGENCE COMMAND CENTER
          </div>
          <div className="mt-2 text-[11px] sm:text-xs tracking-[0.2em] text-slate-300">
            SEE EARLY&nbsp;&nbsp;•&nbsp;&nbsp;UNDERSTAND BETTER&nbsp;&nbsp;•&nbsp;&nbsp;ACT FASTER&nbsp;&nbsp;•&nbsp;&nbsp;SAVE LIVES
          </div>
          <div className="mx-auto mt-3 h-1 w-56 rounded flex overflow-hidden" aria-hidden>
            <span className="flex-1 bg-orange-500" />
            <span className="flex-1 bg-white" />
            <span className="flex-1 bg-green-600" />
          </div>
          <div className="mt-2 text-sm sm:text-base font-bold text-white tracking-wider">
            FOR A SAFER, STRONGER, RESILIENT INDIA
          </div>

          <div className="mt-5 inline-grid grid-cols-[auto_auto_auto] gap-x-4 gap-y-1 text-left text-xs sm:text-sm bg-[#030d17]/70 border border-[#1b314b] rounded-xl px-5 py-3 backdrop-blur">
            <span className="text-slate-400">BEFORE</span><span className="text-[#00d2ff]">→</span><span className="font-bold text-white">PREPARE</span>
            <span className="text-slate-400">DURING</span><span className="text-[#00d2ff]">→</span><span className="font-bold text-white">RESPOND</span>
            <span className="text-slate-400">AFTER</span><span className="text-[#00d2ff]">→</span><span className="font-bold text-white">RECOVER</span>
          </div>

          <div className="mt-6">
            <Link
              href="/safety"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#00d2ff] hover:bg-[#00b0d6] text-black font-extrabold tracking-widest text-sm shadow-[0_0_30px_rgba(0,210,255,0.5)]"
            >
              <Play className="w-4 h-4" /> INITIALIZING DRISHTI-X <ChevronRight className="w-4 h-4" />
            </Link>
            <div className="mt-2 text-[11px] text-slate-400">
              Press{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-[#1b314b] bg-[#051424] text-white font-bold">
                ENTER
              </kbd>{' '}
              to enter
            </div>
            <div className="mt-3 text-[10px] tracking-[0.3em] text-slate-400" aria-label="Detect, analyze, predict, alert, respond, recover">
              {['DETECT', 'ANALYZE', 'PREDICT', 'ALERT', 'RESPOND', 'RECOVER'].map((s, i) => (
                <span key={s}>
                  <span className={seqStep >= i ? 'text-[#00d2ff] font-bold' : ''}>{s}</span>
                  {i < 5 && <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MODULE GRID — the poster's card wall, every card live */}
      <section className="max-w-6xl mx-auto px-4 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {ROW1.map((c) => (
            <ModuleCard key={c.title} {...c} />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          {ROW2.map((c) => (
            <ModuleCard key={c.title} {...c} compact />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          <ModuleCard icon={Building2} title="HOSPITAL INTELLIGENCE" desc="ICU status · Capacity · Resource view." href="/resources" compact />
          <ModuleCard icon={Tent} title="SHELTER MANAGEMENT" desc="Find & track shelters. Real-time status." href="/shelter" compact />
          <ModuleCard icon={BarChart3} title="RECOVERY INSIGHTS" desc="Damage assessment. Rebuild smarter." href="/recovery" compact />
          <button
            onClick={() => setApp({ lang: langs[(langs.indexOf(lang) + 1) % langs.length] })}
            className="text-left p-3 rounded-xl bg-[#051424]/90 border border-[#1b314b] hover:border-[#00d2ff]/60 transition-all"
          >
            <Languages className="w-5 h-5 text-[#00d2ff]" />
            <div className="text-[11px] font-bold text-white mt-1.5">MULTI-LANGUAGE</div>
            <div className="text-[10px] text-slate-400 mt-0.5">English · తెలుగు · हिन्दी. Tap to switch (now: {lang.toUpperCase()}).</div>
          </button>
          <ModuleCard icon={Accessibility} title="ACCESSIBILITY" desc="Inclusive for everyone. Toolbar ↙ on every page." href="/safety" compact />
          <ModuleCard icon={Mic} title="VOICE ASSISTANT" desc="Talk to DRISHTI. Ask. Search. Act." href="/talk" compact />
          <ModuleCard icon={WifiOff} title="OFFLINE MODE" desc="Works even without internet. Stay prepared." href="/learn" compact />
          <button
            onClick={() => setApp({ mode: 'public' })}
            className="text-left p-3 rounded-xl bg-[#051424]/90 border border-emerald-500/40 hover:border-emerald-400 transition-all"
          >
            <User className="w-5 h-5 text-emerald-300" />
            <div className="text-[11px] font-bold text-white mt-1.5">PUBLIC MODE</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Simple. Clear. Actionable. For everyone.</div>
          </button>
          <button
            onClick={() => setApp({ mode: 'command' })}
            className="text-left p-3 rounded-xl bg-[#051424]/90 border border-[#00d2ff]/40 hover:border-[#00d2ff] transition-all"
          >
            <MonitorSmartphone className="w-5 h-5 text-[#00d2ff]" />
            <div className="text-[11px] font-bold text-white mt-1.5">COMMAND MODE</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Advanced tools. For operators.</div>
          </button>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-4 pb-10 flex flex-col sm:flex-row justify-between gap-2 text-[10px] tracking-[0.2em] text-slate-500">
        <span>TECHNOLOGY · PEOPLE · PREPARATION · A MORE RESILIENT TOMORROW</span>
        <span>NATURE WILL ALWAYS BE POWERFUL — HUMANITY CAN ALWAYS BE PREPARED</span>
      </footer>
    </main>
  );
}

function ModuleCard({
  icon: Icon,
  title,
  desc,
  href,
  compact = false,
}: {
  icon: typeof Bell;
  title: string;
  desc: string;
  href: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className="block p-3 rounded-xl bg-[#051424]/90 border border-[#1b314b] hover:border-[#00d2ff]/60 hover:shadow-[0_0_18px_rgba(0,210,255,0.25)] transition-all"
    >
      <Icon className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-[#00d2ff]`} />
      <div className={`${compact ? 'text-[11px]' : 'text-xs'} font-bold text-white mt-1.5`}>{title}</div>
      <div className={`${compact ? 'text-[10px]' : 'text-[11px]'} text-slate-400 mt-0.5 leading-snug`}>{desc}</div>
    </Link>
  );
}
