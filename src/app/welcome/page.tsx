// src/app/welcome/page.tsx — DRISHTI-X Master Gateway & Futuristic AI Command Portal
"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import { useTelemetrySocket } from "@/hooks/useTelemetrySocket";
import { useApp, setApp, setQualityMode, type QualityMode } from "@/store/appStore";
import { useOps, setOps } from "@/store/opsStore";
import { useIntel, pushEvent } from "@/store/intelStore";
import { soundSynth } from "@/utils/audioSynth";
import AnimatedCounter, { Sparkline, Waveform } from "@/components/cinematic/AnimatedCounter";
import GeospatialIntelGallery from "@/components/cinematic/GeospatialIntelGallery";
import {
  HeartPulse, MapPin, Layers, Bell, Siren, Route as RouteIcon,
  LifeBuoy, FileWarning, Users, ClipboardList, Backpack, BookOpen,
  Cpu, Box, Plane, Building2, Tent, BarChart3, Languages,
  Accessibility, Mic, WifiOff, User, MonitorSmartphone, Play,
  ChevronRight, Activity, Radio, ShieldAlert, Sparkles, Satellite,
  Gauge, Flame, Droplets, Compass, Eye, CheckCircle2, ArrowUpRight
} from "lucide-react";

// Dynamic imports to prevent SSR issues for Three.js 3D centerpieces
const AiCoreScene = dynamic(() => import("@/components/cinematic/AiCoreScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 flex items-center justify-center text-cyan-400 font-mono text-xs animate-pulse">
      [INITIALIZING 3D AI CORE…]
    </div>
  ),
});

const DigitalTwin = dynamic(() => import("@/components/DigitalTwin"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 flex items-center justify-center text-cyan-400 font-mono text-xs animate-pulse">
      [CALIBRATING 3D DIGITAL TWIN…]
    </div>
  ),
});

const ROW1 = [
  { icon: HeartPulse, title: "MY SAFETY", desc: "Check your risk. Stay informed.", href: "/safety" },
  { icon: MapPin, title: "LIVE LOCATION", desc: "Explore hazards. View risk layers.", href: "/location" },
  { icon: Layers, title: "HAZARD MAPS", desc: "Flood, Cyclone, Earthquake, Fire & more.", href: "/location" },
  { icon: Bell, title: "ALERT CENTER", desc: "Real-time alerts. Know what to do.", href: "/alerts" },
  { icon: Siren, title: "EMERGENCY MODE", desc: "One tap for help. Contacts & navigation.", href: "/emergency" },
  { icon: RouteIcon, title: "SAFE EVACUATION", desc: "Find the safest route. Reach shelter.", href: "/evacuate" },
];

const ROW2 = [
  { icon: LifeBuoy, title: "NEARBY HELP", desc: "Hospitals, Shelters, Police, Fire & more.", href: "/nearby" },
  { icon: FileWarning, title: "CITIZEN REPORTING", desc: "Report incidents. Be the eyes on ground.", href: "/report" },
  { icon: Users, title: "FAMILY SAFETY", desc: "Keep your loved ones safe.", href: "/family" },
  { icon: ClipboardList, title: "PERSONAL PLAN", desc: "Be prepared. Step by step.", href: "/plan" },
  { icon: Backpack, title: "EMERGENCY KIT", desc: "Essentials for any disaster.", href: "/kit" },
  { icon: BookOpen, title: "DISASTER EDUCATION", desc: "Before · During · After. Learn & stay ready.", href: "/learn" },
  { icon: Cpu, title: "WHAT-IF COPILOT", desc: "Simulate scenarios. See possible impact.", href: "/simulation" },
  { icon: Box, title: "3D DIGITAL TWIN", desc: "Explore realistic 3D environments.", href: "/twin" },
  { icon: Plane, title: "DRONE SAR", desc: "Search · Locate · Assist. Save lives.", href: "/drones" },
];

const SCENARIOS = [
  { id: "nominal", label: "NOMINAL", icon: CheckCircle2, desc: "Standard surveillance & telemetry baseline" },
  { id: "storm", label: "MONSOON SURGE", icon: Droplets, desc: "Reservoir spillway discharge >45k cusecs" },
  { id: "swarm-surge", label: "SWARM SAR", icon: Plane, desc: "Full-scale autonomous search & rescue mesh" },
  { id: "gps-denied", label: "GPS-DENIED", icon: ShieldAlert, desc: "Inertial odometry & optical flow routing" },
];

export default function WelcomePage() {
  const { connected } = useTelemetrySocket();
  const { lang, qualityMode } = useApp();
  const ops = useOps();
  const intel = useIntel();
  const router = useRouter();

  const [bgOk, setBgOk] = useState(true);
  const [activeScenario, setActiveScenario] = useState(ops.scenario || "nominal");
  const [seqStep, setSeqStep] = useState(0);

  // Cinematic opening sequence
  useEffect(() => {
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setSeqStep(5);
        return;
      }
    } catch {
      /* ignore */
    }
    const t = setInterval(() => setSeqStep((s) => (s >= 5 ? 5 : s + 1)), 400);
    return () => clearInterval(t);
  }, []);

  // Enter shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      if (e.key === "Enter" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        router.push("/command");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  function handleScenarioChange(scenId: string) {
    setActiveScenario(scenId);
    setOps({ scenario: scenId });
    pushEvent({
      id: `welcome-scen-${scenId}-${Date.now()}`,
      type: "SYSTEM",
      severity: scenId === "storm" ? "warning" : "info",
      title: `Tactical Mode → ${scenId.toUpperCase()}`,
      source: "welcome-portal",
    });
    soundSynth.scenarioChange();
  }

  // Simulated responsive metrics based on scenario
  const metrics = useMemo(() => {
    switch (activeScenario) {
      case "storm":
        return { risk: 84, drones: 36, people: 24860, discharge: "48.2k cusecs", status: "ELEVATED ALERT", tone: "critical" as const };
      case "swarm-surge":
        return { risk: 62, drones: 42, people: 5200, discharge: "22.5k cusecs", status: "SEARCH ACTIVE", tone: "warn" as const };
      case "gps-denied":
        return { risk: 75, drones: 18, people: 1400, discharge: "18.0k cusecs", status: "INERTIAL LOCK", tone: "warn" as const };
      default:
        return { risk: 18, drones: 26, people: 120, discharge: "4.5k cusecs", status: "SYSTEM NOMINAL", tone: "ok" as const };
    }
  }, [activeScenario]);

  return (
    <main className="min-h-screen bg-[#020b14] text-slate-200 font-mono relative overflow-x-hidden">
      <Navbar wsConnected={connected} />

      {/* TACTICAL HUD TOP STRIP */}
      <div className="bg-[#030d17]/90 border-b border-[#1b314b] px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-[#00d2ff] animate-ping" />
            DRISHTI-X OPERATIONAL GRID
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="hidden sm:inline">SAT-LINK: <b className="text-cyan-400">ISRO INSAT-3DR / SENTINEL-2</b></span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="hidden md:inline">GEOINT LATENCY: <b className="text-emerald-400">14ms</b></span>
        </div>

        {/* Quality Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#020b14] px-2 py-0.5 rounded border border-[#1b314b]">
          <Gauge className="w-3 h-3 text-[#00d2ff]" />
          <span className="text-[10px] text-slate-400 mr-1">QUALITY:</span>
          {(["high", "medium", "low"] as QualityMode[]).map((q) => (
            <button
              key={q}
              onClick={() => {
                setQualityMode(q);
                soundSynth.click();
              }}
              className={`px-1.5 py-0.2 text-[9px] uppercase font-bold rounded transition-all ${
                qualityMode === q
                  ? "bg-[#00d2ff] text-black shadow-[0_0_8px_rgba(0,210,255,0.6)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {q === "medium" ? "BAL" : q.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* HERO SECTION: NASA MISSION CONTROL + 3D AI CENTERPIECE */}
      <section className="relative px-4 pt-8 pb-12 overflow-hidden border-b border-[#1b314b]/80">
        {/* Background Atmosphere & Grid Floor */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(1100px 500px at 50% -10%, rgba(0,210,255,0.18), transparent 65%), radial-gradient(800px 400px at 85% 100%, rgba(244,63,94,0.08), transparent 60%), radial-gradient(800px 400px at 15% 100%, rgba(52,211,153,0.08), transparent 60%), linear-gradient(#020b14, #020b14)",
          }}
        />

        {/* Perspective Synthwave Grid */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-44 overflow-hidden pointer-events-none">
          <div
            className="absolute -inset-x-1/4 bottom-[-60%] h-[240%] mx-auto"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,210,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(0,210,255,0.25) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              transform: "perspective(360px) rotateX(64deg)",
              maskImage: "linear-gradient(to top, black 40%, transparent 95%)",
              WebkitMaskImage: "linear-gradient(to top, black 40%, transparent 95%)",
            }}
          />
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, #00d2ff, transparent)",
              boxShadow: "0 0 24px 2px rgba(0,210,255,0.8)",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Command Mission Brief & CTAs */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#051424] border border-[#00d2ff]/40 text-[#00d2ff] text-[11px] font-bold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              NEXT-GENERATION AI COMMAND & CONTROL PLATFORM
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none">
              DRISHTI<span className="text-[#00d2ff]">-X</span>
              <span className="block text-xl sm:text-2xl font-bold tracking-widest text-slate-300 mt-2">
                AUTONOMOUS DISASTER INTELLIGENCE
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time multi-spectral satellite surveillance, sovereign airborne drone mesh networking, 
              3D digital elevation flood modeling, and life-saving citizen evacuation guidance engineered for 
              mission-critical operations.
            </p>

            {/* Indian Flag Tricolor Resilient Ribbon */}
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-32 rounded flex overflow-hidden shadow-[0_0_10px_rgba(255,255,255,0.2)]" aria-hidden>
                <span className="flex-1 bg-orange-500" />
                <span className="flex-1 bg-white" />
                <span className="flex-1 bg-green-600" />
              </div>
              <span className="text-[10px] tracking-[0.2em] font-bold text-slate-400">
                SOVEREIGN RESILIENT INDIA PROTOCOL
              </span>
            </div>

            {/* Tactical Scenario Quick-Tester */}
            <div className="bg-[#051424]/90 p-3.5 rounded-xl border border-[#1b314b] space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#00d2ff]" />
                  SIMULATE MISSION SCENARIO:
                </span>
                <span className="text-cyan-400 font-bold text-[10px]">{metrics.status}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SCENARIOS.map((scen) => {
                  const Icon = scen.icon;
                  const isActive = activeScenario === scen.id;
                  return (
                    <button
                      key={scen.id}
                      onClick={() => handleScenarioChange(scen.id)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        isActive
                          ? "bg-[#00d2ff]/20 border-[#00d2ff] text-white shadow-[0_0_14px_rgba(0,210,255,0.3)]"
                          : "bg-[#020b14] border-[#1b314b] text-slate-400 hover:text-slate-200 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        <Icon className={`w-3 h-3 ${isActive ? "text-[#00d2ff]" : "text-slate-400"}`} />
                        {scen.label}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-1 line-clamp-1">{scen.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary & Secondary Action CTAs */}
            <div className="flex items-center gap-3 flex-wrap pt-2">
              <Link
                href="/command"
                onClick={() => soundSynth.click()}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#00d2ff] hover:bg-[#00b0d6] text-black font-black text-xs tracking-wider shadow-[0_0_24px_rgba(0,210,255,0.5)] transition-all transform hover:-translate-y-0.5"
              >
                <Activity className="w-4 h-4" />
                LAUNCH MASTER COMMAND DECK
                <ChevronRight className="w-4 h-4" />
              </Link>

              <Link
                href="/safety"
                onClick={() => soundSynth.click()}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#051424] hover:bg-[#072038] border border-[#00d2ff]/60 hover:border-[#00d2ff] text-[#00d2ff] font-bold text-xs tracking-wider transition-all"
              >
                <HeartPulse className="w-4 h-4 text-rose-400" />
                CHECK CITIZEN RISK
              </Link>

              <Link
                href="/twin"
                onClick={() => soundSynth.click()}
                className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl bg-[#051424] border border-[#1b314b] hover:border-slate-400 text-slate-300 font-bold text-xs tracking-wider transition-all"
              >
                <Box className="w-4 h-4 text-cyan-400" />
                3D TWIN
              </Link>
            </div>

            {/* Micro keyboard tip */}
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>Press <kbd className="px-1.5 py-0.5 rounded border border-[#1b314b] bg-[#051424] text-white font-bold">ENTER</kbd> anytime to enter Master Command</span>
              <span>•</span>
              <span className="text-emerald-400">P2P Sovereign Mesh Active</span>
            </div>
          </div>

          {/* Right Column: 3D AI Core Centerpiece & Floating HUD Telemetry */}
          <div className="lg:col-span-5 relative flex flex-col items-center">
            {/* Tactical Framed Container */}
            <div className="relative w-full bg-[#051424]/85 border border-[#1b314b] rounded-2xl p-4 backdrop-blur shadow-[0_0_35px_rgba(0,210,255,0.15)]">
              <div className="dx-hud-corner-tl" />
              <div className="dx-hud-corner-tr" />
              <div className="dx-hud-corner-bl" />
              <div className="dx-hud-corner-br" />

              {/* HUD Header */}
              <div className="flex items-center justify-between border-b border-[#1b314b] pb-2 text-[10px]">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] animate-ping" />
                  DRISHTI NEURAL AI CORE v2.5
                </span>
                <span className="text-[#00d2ff] tracking-widest font-bold">INTERACTIVE 3D // DRAG TO ROTATE</span>
              </div>

              {/* 3D Scene */}
              <div className="relative h-64 sm:h-72 w-full my-2">
                <AiCoreScene height={270} tone={metrics.tone} />
              </div>

              {/* Live HUD Telemetry Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1b314b] text-[10px]">
                <div className="bg-[#020b14] p-2 rounded border border-[#1b314b]">
                  <div className="text-slate-500">INUNDATION RISK</div>
                  <div className="text-lg font-bold text-rose-400 flex items-baseline gap-1 mt-0.5">
                    <AnimatedCounter value={metrics.risk} />
                    <span className="text-[10px] text-slate-500">/100</span>
                  </div>
                </div>

                <div className="bg-[#020b14] p-2 rounded border border-[#1b314b]">
                  <div className="text-slate-500">ACTIVE DRONES</div>
                  <div className="text-lg font-bold text-cyan-300 flex items-baseline gap-1 mt-0.5">
                    <AnimatedCounter value={metrics.drones} />
                    <span className="text-[10px] text-slate-500">units</span>
                  </div>
                </div>

                <div className="bg-[#020b14] p-2 rounded border border-[#1b314b]">
                  <div className="text-slate-500">RESERVOIR SURGE</div>
                  <div className="text-xs font-bold text-amber-300 mt-2 truncate">
                    {metrics.discharge}
                  </div>
                </div>
              </div>

              {/* Tactical Waveform Visualizer */}
              <div className="mt-2 pt-2 border-t border-[#1b314b]/60 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3 text-[#00d2ff]" />
                  TELEMETRY WAVEFORM
                </span>
                <Waveform color={metrics.tone === "critical" ? "#fb7185" : metrics.tone === "warn" ? "#fbbf24" : "#00d2ff"} />
                <span className="text-emerald-400 font-mono">100% INFERENCE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: 3D DIGITAL TWIN & REAL-WORLD GEOSPATIAL INTELLIGENCE SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#1b314b] pb-4">
          <div>
            <div className="text-[10px] text-[#00d2ff] tracking-[0.25em] font-bold">
              EARTH OBSERVATION & REMOTE SENSING
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              REAL-WORLD GEOSPATIAL INTELLIGENCE & SENSOR FEEDS
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/twin"
              className="px-3 py-1.5 rounded-lg bg-[#051424] hover:bg-[#072038] border border-[#00d2ff]/60 text-cyan-300 text-xs font-bold flex items-center gap-1.5"
            >
              <Box className="w-3.5 h-3.5" /> FULL 3D TWIN VIEW →
            </Link>
            <Link
              href="/location"
              className="px-3 py-1.5 rounded-lg bg-[#051424] hover:bg-[#072038] border border-[#1b314b] text-slate-300 text-xs font-bold flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-400" /> LIVE RADAR MAP →
            </Link>
          </div>
        </div>

        {/* 3D Digital Twin Contours & Interactive Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-[#051424] border border-[#1b314b] rounded-2xl p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#1b314b] pb-2 text-[10px]">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-[#00d2ff]" />
                  SPATIAL 3D ELEVATION TWIN
                </span>
                <span className="text-cyan-400 font-bold">PROCEDURAL DEM // ROTATING ROTORS</span>
              </div>
              <div className="h-64 mt-3 rounded-xl overflow-hidden border border-[#1b314b] bg-black">
                <DigitalTwin alt={120} surgeM={metrics.risk > 50 ? 2.5 : 0} height={256} />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#1b314b] text-[11px] text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">TERRAIN MESH:</span>
                <span className="text-white font-bold">Sinusoidal DEM Hills & River Cut</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">FLOOD WATER INUNDATION:</span>
                <span className="text-[#00d2ff] font-bold">{metrics.risk > 50 ? "+2.5m Hydrostatic Surge" : "Nominal River Level"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">SEARCHLIGHT CONE:</span>
                <span className="text-emerald-400 font-bold">Active Volumetric Sweep</span>
              </div>
            </div>
          </div>

          {/* Real-World Visual Feeds Gallery */}
          <div className="lg:col-span-7">
            <GeospatialIntelGallery />
          </div>
        </div>
      </section>

      {/* SECTION 3: COMPLETE MODULE DIRECTORY (ALL EXISTING CAPABILITIES PRESERVED) */}
      <section className="max-w-7xl mx-auto px-4 py-8 border-t border-[#1b314b]/80 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[10px] text-[#00d2ff] tracking-[0.25em] font-bold">
              UNIFIED COMMAND ARCHITECTURE
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              ALL COMMAND MODULES & CITIZEN SAFETY TOOLS
            </h3>
          </div>
          <span className="text-xs text-slate-500">24 OPERATIONAL SUBSYSTEMS ONLINE</span>
        </div>

        {/* Primary Row 1 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {ROW1.map((c) => (
            <ModuleCard key={c.title} {...c} />
          ))}
        </div>

        {/* Primary Row 2 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          {ROW2.map((c) => (
            <ModuleCard key={c.title} {...c} compact />
          ))}
        </div>

        {/* Infrastructure & Utilities Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          <ModuleCard icon={Building2} title="HOSPITAL INTELLIGENCE" desc="ICU status · Capacity · Resource view." href="/resources" compact />
          <ModuleCard icon={Tent} title="SHELTER MANAGEMENT" desc="Find & track shelters. Real-time status." href="/shelter" compact />
          <ModuleCard icon={BarChart3} title="RECOVERY INSIGHTS" desc="Damage assessment. Rebuild smarter." href="/recovery" compact />

          <button
            onClick={() => {
              const langs = ["en", "te", "hi"] as const;
              type L3 = (typeof langs)[number];
              const cur: L3 = (langs as readonly string[]).includes(lang) ? (lang as L3) : "en";
              setApp({ lang: langs[(langs.indexOf(cur) + 1) % langs.length] });
              soundSynth.click();
            }}
            className="text-left p-3 rounded-xl bg-[#051424]/90 border border-[#1b314b] hover:border-[#00d2ff]/60 transition-all hover:shadow-[0_0_15px_rgba(0,210,255,0.2)]"
          >
            <Languages className="w-5 h-5 text-[#00d2ff]" />
            <div className="text-[11px] font-bold text-white mt-1.5">MULTI-LANGUAGE</div>
            <div className="text-[10px] text-slate-400 mt-0.5">EN · TE · HI. Current: {lang.toUpperCase()}</div>
          </button>

          <ModuleCard icon={Accessibility} title="ACCESSIBILITY" desc="Inclusive for everyone. Toolbar ↙ on every page." href="/safety" compact />
          <ModuleCard icon={Mic} title="VOICE ASSISTANT" desc="Talk to DRISHTI. Ask. Search. Act." href="/talk" compact />
          <ModuleCard icon={WifiOff} title="OFFLINE MODE" desc="Works even without internet. Stay prepared." href="/learn" compact />

          <button
            onClick={() => {
              setApp({ mode: "public" });
              soundSynth.click();
            }}
            className="text-left p-3 rounded-xl bg-[#051424]/90 border border-emerald-500/40 hover:border-emerald-400 transition-all hover:shadow-[0_0_15px_rgba(52,211,153,0.2)]"
          >
            <User className="w-5 h-5 text-emerald-300" />
            <div className="text-[11px] font-bold text-white mt-1.5">PUBLIC MODE</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Clear. Actionable. For citizens.</div>
          </button>

          <button
            onClick={() => {
              setApp({ mode: "command" });
              soundSynth.click();
            }}
            className="text-left p-3 rounded-xl bg-[#051424]/90 border border-[#00d2ff]/40 hover:border-[#00d2ff] transition-all hover:shadow-[0_0_15px_rgba(0,210,255,0.2)]"
          >
            <MonitorSmartphone className="w-5 h-5 text-[#00d2ff]" />
            <div className="text-[11px] font-bold text-white mt-1.5">COMMAND MODE</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Advanced tools for operators.</div>
          </button>
        </div>
      </section>

      {/* MISSION CONTROL FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 py-8 border-t border-[#1b314b] flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] tracking-[0.15em] text-slate-500">
        <div>
          DRISHTI-X // ZERO-FAILURE SOVEREIGN DISASTER INTELLIGENCE PLATFORM
        </div>
        <div>
          NATURE WILL ALWAYS BE POWERFUL — HUMANITY CAN ALWAYS BE PREPARED
        </div>
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
      onClick={() => soundSynth.click()}
      className="group block p-3 rounded-xl bg-[#051424]/90 border border-[#1b314b] hover:border-[#00d2ff]/70 hover:shadow-[0_0_18px_rgba(0,210,255,0.2)] transition-all"
    >
      <Icon className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-[#00d2ff] group-hover:scale-110 transition-transform`} />
      <div className={`${compact ? "text-[11px]" : "text-xs"} font-bold text-white mt-1.5 group-hover:text-[#00d2ff] transition-colors`}>{title}</div>
      <div className={`${compact ? "text-[10px]" : "text-[11px]"} text-slate-400 mt-0.5 leading-snug line-clamp-2`}>{desc}</div>
    </Link>
  );
}
