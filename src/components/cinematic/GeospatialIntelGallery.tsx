"use client";
import { useState } from "react";
import { Eye, Satellite, Plane, Crosshair, Map, ShieldAlert, Sparkles, X, ExternalLink } from "lucide-react";

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
  metrics: { label: string; value: string }[];
};

const INTEL_EXAMPLES: IntelExample[] = [
  {
    id: "sat-flood-01",
    category: "satellite",
    title: "Multispectral Delta Inundation Analysis",
    badge: "EARTH OBSERVATION",
    source: "Illustrative image (Unsplash) — not a live observation",
    license: "Unsplash License (illustrative placeholder)",
    sensor: "Illustrative spec — not a real sensor",
    resolution: "30m GSD / 185km Swath",
    description: "False-color infrared imagery differentiating submerged lowlands from standing structures. Water absorbs shortwave infrared (black/dark blue), while unaffected vegetation appears bright cyan/green.",
    imageUrl: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "radial-gradient(ellipse at center, #004d7a, #001f3f, #020b14)",
    metrics: [
      { label: "Submerged Area", value: "142.8 km²" },
      { label: "Runoff Coefficient", value: "0.84" },
      { label: "Confidence", value: "99.2%" },
    ],
  },
  {
    id: "drone-sar-02",
    category: "drone",
    title: "Autonomous Thermal FLIR Search & Rescue",
    badge: "DRONE SAR",
    source: "Illustrative image (Unsplash) — not a live observation",
    license: "Unsplash License (illustrative placeholder)",
    sensor: "Illustrative spec — not a real sensor",
    resolution: "3.2cm/px @ 80m AGL",
    description: "Forward-Looking Infrared (FLIR) aerial stream highlighting human body heat signatures amidst debris and cold flood currents. DRISHTI computer vision isolates clusters of interest.",
    imageUrl: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "radial-gradient(ellipse at center, #780206, #061161, #020b14)",
    metrics: [
      { label: "Heat Signatures", value: "14 Detected" },
      { label: "Drone Altitude", value: "85m AGL" },
      { label: "Search Grid Speed", value: "12 m/s" },
    ],
  },
  {
    id: "vision-detect-03",
    category: "vision",
    title: "Real-time Edge Computer Vision & Segment Bounding",
    badge: "COMPUTER VISION",
    source: "Illustrative image (Unsplash) — not a live observation",
    license: "Unsplash License (illustrative placeholder)",
    sensor: "Illustrative spec — not a real sensor",
    resolution: "3840x2160 @ 60 FPS (Sub-20ms Latency)",
    description: "Onboard drone YOLO/TensorRT segmentation model detecting breached embankments, stranded livestock, submerged vehicles, and active distress waving in real-time.",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "radial-gradient(ellipse at center, #0052d4, #4364f7, #020b14)",
    metrics: [
      { label: "Latency", value: "18.4 ms" },
      { label: "Inference Rate", value: "54.2 FPS" },
      { label: "Precision (mAP)", value: "0.932" },
    ],
  },
  {
    id: "dem-elevation-04",
    category: "terrain",
    title: "3D Digital Elevation Contour & Runoff Vectors",
    badge: "GEOSPATIAL DEM",
    source: "Illustrative image (Unsplash) — not a live observation",
    license: "Unsplash License (illustrative placeholder)",
    sensor: "Illustrative spec — not a real sensor",
    resolution: "12.5m Spatial Elevation",
    description: "High-resolution digital terrain model computing hydraulic flow velocity and flood wall overtopping probabilities for low-elevation arterial evacuation channels.",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "radial-gradient(ellipse at center, #134e5e, #71b280, #020b14)",
    metrics: [
      { label: "Peak Elevation", value: "542m MSL" },
      { label: "Drainage Slope", value: "4.8%" },
      { label: "Contour Interval", value: "2.0m" },
    ],
  },
  {
    id: "sat-cyclone-05",
    category: "satellite",
    title: "Orbital Geostationary Cyclone Doppler Tracking",
    badge: "METEOROLOGY",
    source: "Illustrative image (Unsplash) — not a live observation",
    license: "Unsplash License (illustrative placeholder)",
    sensor: "Illustrative spec — not a real sensor",
    resolution: "0.5km Visible / 2.0km Thermal",
    description: "Deep convection cloud-top cooling analysis and spiral wind vector computation predicting landfall trajectory and extreme precipitation intensity belts.",
    imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "radial-gradient(ellipse at center, #2c3e50, #000000, #020b14)",
    metrics: [
      { label: "Wind Velocity", value: "145 km/h" },
      { label: "Central Pressure", value: "968 hPa" },
      { label: "Track Variance", value: "±8.4 km" },
    ],
  },
  {
    id: "drone-mesh-06",
    category: "drone",
    title: "Sovereign Drone Swarm Relay & Mesh Telemetry",
    badge: "SWARM MESH",
    source: "Illustrative image (Unsplash) — not a live observation",
    license: "Unsplash License (illustrative placeholder)",
    sensor: "Illustrative spec — not a real sensor",
    resolution: "15km Line-of-Sight P2P Link",
    description: "Decentralized ad-hoc airborne communications mesh restoring civilian connectivity and GPS-denied inertial positioning across severed cellular towers.",
    imageUrl: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "radial-gradient(ellipse at center, #0f2027, #203a43, #020b14)",
    metrics: [
      { label: "Swarm Nodes", value: "8 Active" },
      { label: "Packet Loss", value: "0.04%" },
      { label: "Throughput", value: "4.2 Mbps" },
    ],
  },
];

export default function GeospatialIntelGallery() {
  const [filter, setFilter] = useState<"all" | "satellite" | "drone" | "vision" | "terrain">("all");
  const [activeModal, setActiveModal] = useState<IntelExample | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const filtered = filter === "all" ? INTEL_EXAMPLES : INTEL_EXAMPLES.filter((x) => x.category === filter);

  return (
    <div className="w-full">
      {/* Category filter tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 text-xs font-mono">
        <span className="text-slate-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5 mr-2">
          <Eye className="w-3.5 h-3.5 text-[#00d2ff]" />
          INTEL FEEDS:
        </span>
        {[
          { key: "all", label: "ALL FEEDS", icon: Eye },
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
              className={`px-3 py-1 rounded-md border text-[11px] font-bold tracking-wider flex items-center gap-1.5 transition-all ${
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
                EXAMPLE · {item.badge}
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
                <span className="truncate max-w-[200px]">{item.source} · EXAMPLE</span>
                <span className="text-[#00d2ff] group-hover:underline">EXPAND →</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Inspection Modal */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
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
                className="w-7 h-7 rounded-lg bg-[#020b14] border border-[#1b314b] text-slate-400 hover:text-white flex items-center justify-center hover:border-rose-500 transition-colors"
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
                  ILLUSTRATIVE EXAMPLE — NOT A LIVE OBSERVATION
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
