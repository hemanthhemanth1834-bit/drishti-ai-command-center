"use client";
import { useState } from "react";
import { Eye, Satellite, Plane, Crosshair, Map, ShieldAlert, Sparkles, X, ExternalLink } from "lucide-react";
import { useDialogA11y } from "@/hooks/useDialogA11y";

export type IntelExample = {
  id: string;
  category: "satellite" | "drone" | "vision" | "terrain";
  title: string;
  badge: string;
  source: string;
  license: string;
  sensor: string;
  resolution: string;
  description: string;
  imageUrl: string;
  fallbackGradient: string;
  /** Truth verdict shown in the detail modal — never claims live. */
  verdict: string;
  metrics: { label: string; value: string }[];
};

export const INTEL_EXAMPLES: IntelExample[] = [
  {
    id: "sat-flood-01",
    category: "satellite",
    title: "Kerala Inundation — Sentinel-2 After Image",
    badge: "HISTORICAL · FLOOD",
    source: "NASA Earth Observatory record 92669 — archived observation, not live",
    license: "Public domain (NASA/USGS; Sentinel data via ESA)",
    sensor: "Sentinel-2 MSI (archival capture — not a live tasking)",
    resolution: "Bands 11-8-3 · 2018-08-22",
    description: "False-color inundation over Kerala: flood water appears dark blue, vegetation bright green. Swollen rivers altered the landscape during the August 2018 floods.",
    imageUrl: "/img/photos/kerala-after.jpg",
    fallbackGradient: "radial-gradient(ellipse at center, #004d7a, #001f3f, #020b14)",
    verdict: "VERIFIED SOURCE-BACKED — ARCHIVED 2018-08-22, NOT LIVE",
    metrics: [
      { label: "Acquired", value: "2018-08-22" },
      { label: "Sensor", value: "Sentinel-2 MSI" },
      { label: "Status", value: "HISTORICAL" },
    ],
  },
  {
    id: "drone-sar-02",
    category: "drone",
    title: "Helicopter Flood Rescue — SAR Reference",
    badge: "ARCHIVAL · SAR",
    source: "U.S. Navy via Wikimedia Commons — archival photo, not a DRISHTI-X feed",
    license: "Public domain (U.S. Navy)",
    sensor: "Archival photograph — not a drone feed",
    resolution: "Harvey relief · Texas",
    description: "U.S. Navy helicopter flood rescue during Hurricane Harvey relief. Operational search-and-rescue context only — DRISHTI-X claims no live drone feed here.",
    imageUrl: "/img/photos/emergency-rescue.jpg",
    fallbackGradient: "radial-gradient(ellipse at center, #780206, #061161, #020b14)",
    verdict: "VERIFIED SOURCE-BACKED — ARCHIVAL PHOTO, NOT A DRONE FEED",
    metrics: [
      { label: "Source", value: "U.S. Navy" },
      { label: "Event", value: "Hurricane Harvey" },
      { label: "Status", value: "ARCHIVAL" },
    ],
  },
  {
    id: "vision-detect-03",
    category: "vision",
    title: "Debris Flow — Landslide Detection Reference",
    badge: "HISTORICAL · LANDSLIDE",
    source: "NASA Earth Observatory record 147973 — archived observation, not live",
    license: "Public domain (NASA)",
    sensor: "Archival satellite observation",
    resolution: "India · debris flow",
    description: "Documented deadly debris flow in India. Real slope-failure context for what detection models look for — not a current event.",
    imageUrl: "/assets/drishti-x/real-world/05_landslide_india/debris-flow.jpg",
    fallbackGradient: "radial-gradient(ellipse at center, #0052d4, #4364f7, #020b14)",
    verdict: "VERIFIED SOURCE-BACKED — ARCHIVED, NOT A CURRENT EVENT",
    metrics: [
      { label: "Record", value: "NASA EO 147973" },
      { label: "Category", value: "Landslide" },
      { label: "Status", value: "HISTORICAL" },
    ],
  },
  {
    id: "dem-elevation-04",
    category: "terrain",
    title: "Himalayan Terrain — Orbital Context",
    badge: "EARTH OBSERVATION · TERRAIN",
    source: "NASA JSC ISS064-E-037041 via Wikimedia Commons — 23 Feb 2021",
    license: "Public domain (NASA)",
    sensor: "Nikon D5 aboard the ISS (archival photograph)",
    resolution: "2021-02-23 · 264 mi altitude",
    description: "Oblique orbital photograph across India and the Himalayas. Real mountain-slope terrain context — not elevation measurements.",
    imageUrl: "/img/photos/mission-himalaya.jpg",
    fallbackGradient: "radial-gradient(ellipse at center, #134e5e, #71b280, #020b14)",
    verdict: "VERIFIED SOURCE-BACKED — ARCHIVED PHOTO, NOT A DEM",
    metrics: [
      { label: "Platform", value: "ISS" },
      { label: "Photo ID", value: "ISS064-E-037041" },
      { label: "Acquired", value: "2021-02-23" },
    ],
  },
  {
    id: "sat-cyclone-05",
    category: "satellite",
    title: "Cyclone Ilsa — Satellite Observation",
    badge: "HISTORICAL · CYCLONE",
    source: "NASA Earth Observatory record 37599 — archived observation, not live",
    license: "Public domain (NASA)",
    sensor: "Archival satellite observation",
    resolution: "Cyclone Ilsa",
    description: "Documented cyclone observation from NASA's Earth Observatory archive. Historical storm context — not a current cyclone.",
    imageUrl: "/assets/drishti-x/real-world/02_cyclone/cyclone-ilsa.jpg",
    fallbackGradient: "radial-gradient(ellipse at center, #2c3e50, #000000, #020b14)",
    verdict: "VERIFIED SOURCE-BACKED — ARCHIVED, NOT A CURRENT STORM",
    metrics: [
      { label: "Record", value: "NASA EO 37599" },
      { label: "Category", value: "Cyclone" },
      { label: "Status", value: "HISTORICAL" },
    ],
  },
  {
    id: "drone-mesh-06",
    category: "drone",
    title: "Sovereign Drone Swarm — Simulation Concept",
    badge: "SIMULATION · FLEET",
    source: "DRISHTI-X project-original diagram — concept only, no live feed",
    license: "Project-original (no license needed)",
    sensor: "No live feed — simulated fleet concept",
    resolution: "SIM FLEET · concept",
    description: "Concept render of a relay/mesh drone fleet for severed-connectivity scenarios. The fleet is simulated — no live drone feed exists.",
    imageUrl: "/img/drone.svg",
    fallbackGradient: "radial-gradient(ellipse at center, #0f2027, #203a43, #020b14)",
    verdict: "SIMULATION CONCEPT — NOT A LIVE FEED",
    metrics: [
      { label: "Feed", value: "NO LIVE FEED" },
      { label: "Fleet", value: "SIMULATION" },
      { label: "Status", value: "CONCEPT" },
    ],
  },
];

export default function GeospatialIntelGallery() {
  const [filter, setFilter] = useState<"all" | "satellite" | "drone" | "vision" | "terrain">("all");
  const [activeModal, setActiveModal] = useState<IntelExample | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const filtered = filter === "all" ? INTEL_EXAMPLES : INTEL_EXAMPLES.filter((x) => x.category === filter);

  // UI polish: focus moves into the detail dialog on open, Escape closes it.
  useDialogA11y(activeModal !== null, "dx-geoint-dialog", () => setActiveModal(null));

  return (
    <div className="w-full">
      {/* Category filter tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 text-xs font-mono">
        <span className="text-slate-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5 mr-2">
          <Eye className="w-3.5 h-3.5 text-[#00d2ff]" />
          INTEL REFERENCE:
        </span>
        {[
          { key: "all", label: "ALL", icon: Eye },
          { key: "satellite", label: "SATELLITE EO", icon: Satellite },
          { key: "drone", label: "DRONE SAR", icon: Plane },
          { key: "vision", label: "AI VISION", icon: Crosshair },
          { key: "terrain", label: "ELEVATION DEM", icon: Map },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`dx-touch px-3 py-1 rounded-md border text-[11px] font-bold tracking-wider flex items-center gap-1.5 transition-all ${
                isActive
                  ? "bg-[#00d2ff]/20 border-[#00d2ff] text-[#00d2ff] shadow-[0_0_12px_rgba(0,210,255,0.3)]"
                  : "bg-[#051424] border-[#1b314b] text-slate-400 hover:text-slate-200 hover:border-slate-500"
              }`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Grid of Intel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveModal(item)}
            className="group relative bg-[#051424]/90 border border-[#1b314b] hover:border-[#00d2ff]/80 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_0_24px_rgba(0,210,255,0.18)] flex flex-col"
          >
            {/* Tactical Corner Brackets */}
            <div className="dx-hud-corner-tl" />
            <div className="dx-hud-corner-tr" />
            <div className="dx-hud-corner-bl" />
            <div className="dx-hud-corner-br" />

            {/* Imagery Banner with Telemetry Overlay */}
            <div className="relative h-44 w-full overflow-hidden bg-[#020b14]">
              {!imgErrors[item.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  onError={() => setImgErrors((prev) => ({ ...prev, [item.id]: true }))}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-slate-500 text-xs"
                  style={{ background: item.fallbackGradient }}
                >
                  <span className="tracking-widest uppercase text-[10px] text-cyan-300/60">
                    [SYNTHETIC GEOINT LAYER]
                  </span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#051424] via-transparent to-black/40 pointer-events-none" />

              {/* Status Badge */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur border border-[#00d2ff]/50 text-[10px] text-[#00d2ff] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] animate-ping" />
                {item.badge}
              </div>

              {/* Sensor Spec Tag */}
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur border border-slate-700 text-[9px] text-slate-300">
                {item.resolution}
              </div>

              {/* Reticle Target in corner */}
              <div className="absolute bottom-2.5 right-2.5 text-[#00d2ff]/60 group-hover:text-[#00d2ff] transition-colors">
                <Crosshair className="w-4 h-4" />
              </div>
            </div>

            {/* Card Content */}
            <div className="p-3.5 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide group-hover:text-[#00d2ff] transition-colors line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Metrics pill strip */}
              <div className="mt-3 pt-2.5 border-t border-[#1b314b]/80 grid grid-cols-3 gap-1 text-[9px]">
                {item.metrics.map((m, idx) => (
                  <div key={idx} className="bg-[#030d17] p-1 rounded border border-[#1b314b]/60">
                    <div className="text-slate-500 truncate">{m.label}</div>
                    <div className="text-cyan-300 font-bold truncate mt-0.5">{m.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-2 text-[9px] text-slate-500 flex items-center justify-between">
                <span className="truncate max-w-[200px]">{item.source}</span>
                <span className="text-[#00d2ff] group-hover:underline">EXPAND →</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Inspection Modal */}
      {activeModal && (
        <div
          id="dx-geoint-dialog"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={`Geospatial intelligence detail: ${activeModal.title}`}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-[#051424] border border-[#00d2ff] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,210,255,0.3)]"
          >
            {/* Modal Header */}
            <div className="bg-[#081b2e] px-4 py-3 border-b border-[#1b314b] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Satellite className="w-4 h-4 text-[#00d2ff]" />
                <span className="text-xs font-bold text-white tracking-widest uppercase">
                  GEOINT TELEMETRY // {activeModal.badge}
                </span>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                aria-label="Close detail view"
                className="dx-touch w-7 h-7 rounded-lg bg-[#020b14] border border-[#1b314b] text-slate-400 hover:text-white flex items-center justify-center hover:border-rose-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image */}
            <div className="relative h-64 sm:h-80 w-full bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeModal.imageUrl}
                alt={activeModal.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#051424] via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-300 bg-black/70 backdrop-blur px-3 py-1.5 rounded border border-[#1b314b]">
                <span>SENSOR: <b>{activeModal.sensor}</b></span>
                <span className="text-[#00d2ff] font-bold">{activeModal.resolution}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <h3 className="text-base font-black text-white tracking-wide">{activeModal.title}</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{activeModal.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {activeModal.metrics.map((m, i) => (
                  <div key={i} className="bg-[#030d17] p-2.5 rounded-lg border border-[#1b314b]">
                    <div className="text-[10px] text-slate-400">{m.label}</div>
                    <div className="text-sm font-bold text-[#00d2ff] mt-0.5">{m.value}</div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-[#020b14] rounded-lg border border-[#1b314b] text-[11px] text-slate-400 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-slate-500">PROVENANCE: </span>
                  <span className="text-slate-300 font-semibold">{activeModal.source}</span>
                  <span className="text-slate-600 mx-1.5">|</span>
                  <span className="text-emerald-400">{activeModal.license}</span>
                </div>
                <div className="text-[10px] text-[#fbbf24] flex items-center gap-1 font-bold">
                  {activeModal.verdict}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
