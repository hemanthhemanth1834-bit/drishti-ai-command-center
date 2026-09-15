# DRISHTI-X — AI Disaster Intelligence Command Center

> **SEE EARLY · UNDERSTAND BETTER · ACT FASTER · SAVE LIVES**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-drishti--ai--command--center.vercel.app-00d2ff?style=for-the-badge)](https://drishti-ai-command-center.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-hemanthhemanth1834--bit-181717?style=for-the-badge&logo=github)](https://github.com/hemanthhemanth1834-bit/drishti-ai-command-center)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_3D-000000?style=for-the-badge&logo=threedotjs)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

---

## 🛰️ What is DRISHTI-X?

**DRISHTI-X** is a sovereign, next-generation AI-powered disaster intelligence command platform engineered for mission-critical operations. It combines:

- 🌍 **Real-time multi-spectral satellite Earth observation** (NASA / Copernicus / ISRO)
- 🛩️ **Autonomous drone mesh SAR networking** with live GPS telemetry
- 🏔️ **3D procedural digital elevation twin** with dynamic flood surge simulation
- 🧠 **AI inference engine** with interactive 3D neural core visualization
- 🗺️ **Geospatial hazard intelligence** on open-source maps (Leaflet + OpenStreetMap)
- 🆘 **Citizen life-safety tools**: Risk checker, evacuation routing, emergency SOS, family reunification
- 📡 **Real-time WebSocket telemetry** from FastAPI backend drone mesh

**Target Users:** NDRF commanders, district disaster managers, emergency operators, and citizens needing life-safety guidance during floods, cyclones, earthquakes, and fire events.

---

## ✨ Features

### 🎯 Command Center
| Feature | Description |
|---|---|
| **3D AI Neural Core** | Interactive Three.js sphere with orbital rings, neural nodes, particle clouds, drag-rotate, tone-reactive glow |
| **3D Digital Elevation Twin** | Procedural terrain DEM with river canyon, animated quadcopter drone rotors, volumetric searchlight, dynamic flood water surge |
| **Holographic Earth Background** | Full-screen WebGL rotating globe with orbital satellite traces, hazard pulses, and atmospheric rim glow |
| **HUD Tactical Panels** | Glassmorphism panels with corner brackets, telemetry sparklines, animated counters, waveform visualizers |
| **Geospatial Intel Gallery** | Real-world open-source imagery: NASA satellite flood analysis, FLIR thermal drone SAR, computer vision segmentation, DEM elevation, cyclone tracking, swarm mesh |
| **Scenario Simulator** | Switch between Nominal, Monsoon Surge, Swarm SAR, GPS-Denied mission scenarios |
| **Quality Mode** | High / Balanced / Eco auto-detected from device hardware (CPU, memory, UA), persisted locally |
| **Boot Sequence** | Futuristic initialization overlay with progress steps, skippable, session-scoped |

### 🚀 Citizen Safety
- **MY SAFETY** — Personal risk score + hazard checklist
- **LIVE LOCATION** — GPS-based hazard map with Leaflet + OpenStreetMap
- **ALERT CENTER** — Rule-driven real-time alerts (flood, storm, GPS-denied, battery)
- **EMERGENCY MODE** — One-tap SOS with geolocation broadcasting
- **SAFE EVACUATION** — Fastest shelter route computation
- **NEARBY HELP** — Hospitals, fire stations, shelters, police via Overpass API
- **FAMILY SAFETY** — Household member tracking
- **CITIZEN REPORTING** — Submit ground-level incident reports
- **DISASTER EDUCATION** — Before · During · After guides

### 🛸 Operator Tools
- **Master Command Deck** (`/command`) — Full telemetry workstation + AI decision panel
- **3D Digital Twin** (`/twin`) — Interactive elevation twin with flood timeline
- **Drone Swarm SAR** (`/drones`) — Live GPS tracker + swarm scene
- **Location Intel** (`/location`) — Hazard map with risk layers
- **What-If Copilot** (`/simulation`) — Flood impact simulation
- **OPS Dashboard** (`/ops`) — Spillway control + scenario management
- **AI Decision Timeline** — Live shared intelligence event stream

---

## 🏗️ Architecture

```
drishti-ai-command-center/
├── src/
│   ├── app/                    # Next.js 14 App Router (26 routes)
│   │   ├── welcome/            # 🏠 Landing — 3D hero + full module directory
│   │   ├── command/            # 🎛️ Master operator command deck
│   │   ├── safety/             # 🛡️ Citizen risk checker
│   │   ├── location/           # 📍 Live hazard map
│   │   ├── alerts/             # 🔔 Real-time alert center
│   │   ├── emergency/          # 🆘 One-tap SOS command
│   │   ├── evacuate/           # 🚗 Safe evacuation routing
│   │   ├── twin/               # 📦 3D digital elevation twin
│   │   ├── drones/             # ✈️ Drone SAR + swarm tracker
│   │   ├── ops/                # ⚙️ Operator scenario deck
│   │   └── ...18 more routes   #
│   ├── components/
│   │   ├── cinematic/          # 3D & VFX — AiCoreScene, CommandBackground, BootSequence
│   │   │   └── GeospatialIntelGallery.tsx  # Real-world imagery showcase
│   │   ├── 3d/                 # DigitalTwinCanvas, TwinViewport
│   │   ├── maps/               # Leaflet radar map + drone tracker
│   │   ├── dashboard/          # HeaderBar, LiveTelemetryTable
│   │   ├── alerts/             # AlertBanner, GeofenceBreachModal
│   │   └── layout/             # Navbar
│   ├── store/                  # Zustand-style external stores
│   │   ├── appStore.ts         # Mode, lang, qualityMode, soundEnabled
│   │   ├── opsStore.ts         # Scenario, spillway, acked alerts
│   │   └── intelStore.ts       # Shared AI tone, SOS state, events
│   ├── hooks/
│   │   └── useTelemetrySocket.ts  # WebSocket drone telemetry
│   ├── utils/
│   │   ├── audioSynth.ts       # Procedural Web Audio API synthesizer
│   │   ├── alertRules.ts       # Rule-driven alert evaluation
│   │   ├── riskEngine.ts       # Citizen risk score computation
│   │   ├── geofenceDetection.ts
│   │   ├── overpass.ts         # OpenStreetMap Overpass API
│   │   └── apiClient.ts        # REST + WS backend abstraction
│   └── i18n/dict.ts            # EN / TE / HI translations
├── backend/                    # FastAPI Python backend (optional)
├── public/
│   ├── icon.svg                # Cybernetic eye favicon (SVG)
│   ├── poster.jpg              # Hero poster artwork
│   └── sw.js                   # Service worker (offline PWA)
└── ...
```

---

## 🔬 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 14.2.5 | React App Router SSR framework |
| **React** | 18.3 | UI Component library |
| **TypeScript** | 5.5 | Full type safety |
| **Three.js** | 0.169 | WebGL 3D scenes (AI Core, Digital Twin, Globe) |
| **Leaflet** | 1.9.4 | Open-source geospatial mapping |
| **Tailwind CSS** | 3.4 | Utility-first styling |
| **Lucide React** | 1.45 | Icon library |
| **Web Audio API** | Browser | Procedural sound synthesizer (no audio files) |

### Backend (Optional)
| Technology | Purpose |
|---|---|
| **FastAPI** (Python) | WebSocket telemetry server + REST API |
| **WebSockets** | Live drone telemetry streaming at 2Hz |

### Free / Open-Source Services
| Service | API Key Required | Purpose |
|---|---|---|
| **OpenStreetMap** | ❌ None | Base map tiles |
| **CartoDB** | ❌ None | Dark tactical tile variant |
| **Overpass API** | ❌ None | Nearby hospitals, shelters, POIs |
| **OpenWeatherMap** | ✅ Optional | Weather alerts (degrades gracefully) |
| **Esri World Imagery** | ❌ None | Satellite tile fallback for 3D twin |
| **NASA Earth Observatory** | ❌ None | Open educational imagery |
| **Unsplash** | ❌ None | Open visual examples in gallery |

---

## 🚀 Installation & Running Locally

### Prerequisites
- Node.js 18+
- npm 9+

### Quick Start
```bash
# 1. Clone
git clone https://github.com/hemanthhemanth1834-bit/drishti-ai-command-center.git
cd drishti-ai-command-center

# 2. Install
npm install

# 3. Configure (all optional — app works without any key)
cp .env.local.example .env.local
# Edit .env.local and add any optional API keys

# 4. Run development server
npm run dev
# Open: http://localhost:3000
```

### Build for Production
```bash
npm run build
npm run start
```

### Optional: Start Backend (for live WebSocket telemetry)
```bash
cd backend
pip install -r requirements.txt
python main.py
# WebSocket: ws://localhost:8000/ws/telemetry
```

---

## ⚙️ Environment Variables

All variables are **optional** — the app degrades gracefully without them:

```env
# .env.local.example

# Optional: OpenWeatherMap (free tier — weather alerts)
NEXT_PUBLIC_OWM_KEY=your_optional_key

# Optional: Google Places (nearby search fallback)
NEXT_PUBLIC_GOOGLE_PLACES_KEY=your_optional_key

# Optional: FastAPI backend URL (defaults to localhost:8000)
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/telemetry
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> ⚠️ **NEVER commit real API keys to GitHub.** All keys in `.env.local` are gitignored.

---

## 🎨 Visual System

The UI follows a **NASA mission control + cinematic sci-fi + enterprise SaaS** aesthetic:

- **Background:** Deep dark navy `#020b14`
- **Surfaces:** Graphite `#051424` / `#081b2e` with glassmorphism backdrop blur
- **Accent:** Electric cyan `#00d2ff`, rose `#fb7185`, amber `#fbbf24`
- **Effects:** Volumetric glow, holographic grids, tactical corner brackets, scanning wave rings
- **Typography:** `font-mono` system font stack for telemetry readability

### Quality Modes
| Mode | Particles | 3D Detail | Frame Rate Target |
|---|---|---|---|
| **High** (auto: desktop 8+ cores) | 450–750 | Full icosahedron + nodes + rings | 60fps |
| **Balanced** (auto: 4-8 cores) | 240–380 | Reduced nodes | 60fps |
| **Eco** (auto: mobile / 2-4 cores) | 70–120 | Minimal geometry | 30fps |

Toggle anytime from the **QUALITY** switcher in the top tactical strip or HUD.

---

## 📊 Performance

- **Zero paid dependencies** — fully functional without any API keys
- **Dynamic imports** for heavy 3D modules (Three.js chunks split from main bundle)
- **IntersectionObserver** parks WebGL render loops when off-screen
- **Page visibility** API stops animation when tab is hidden
- **Adaptive quality** auto-selects optimal mode for the device
- **CSS fallback** renders when WebGL or reduced-motion is active
- **Lazy-loaded images** with `loading="lazy"` in gallery

---

## 🌐 Deployment

The project auto-deploys to **Vercel** on every push to `main`.

### Manual Deploy
```bash
npm run build
vercel --prod
```

**Live URL:** https://drishti-ai-command-center.vercel.app/

---

## 🛣️ Future Roadmap

- [ ] Real-time Copernicus Sentinel satellite imagery integration
- [ ] WebRTC peer-to-peer drone video feed
- [ ] PWA push notification alerts
- [ ] Multi-agency collaboration room (shared command state via WebSocket)
- [ ] AI chatbot for citizen guidance (local open-source LLM)
- [ ] Mobile-native companion app (React Native / Expo)
- [ ] Bharat GNSS / NavIC GPS integration for India-sovereign positioning

---

## 👨‍💻 Author

**Muchakarla Hemanth Kumar**  
AI Engineer · Full-Stack Developer  
📧 hemanthhemanth1834@gmail.com  
🔗 [GitHub](https://github.com/hemanthhemanth1834-bit)

---

## 📄 License

This project is open-source for educational and hackathon purposes.

---

*DRISHTI-X — For a Safer, Stronger, Resilient India* 🇮🇳
