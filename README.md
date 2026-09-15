# DRISHTI-X — AI Disaster Intelligence Command Center

> **SEE EARLY · UNDERSTAND BETTER · ACT FASTER · SAVE LIVES**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-00d2ff?style=for-the-badge&logo=vercel)](https://drishti-ai-command-center.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/hemanthhemanth1834-bit/drishti-ai-command-center)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.169-000000?style=flat-square&logo=threedotjs)](https://threejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.116-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-Educational_Hackathon-blue?style=flat-square)](./README.md#-license)

**DRISHTI-X is an AI-powered disaster intelligence and emergency-response command platform combining real-time geospatial intelligence, drone telemetry, 3D digital twins, AI visualization, citizen safety tools, and operator dashboards.**

Built as a disaster-response decision-support prototype for hackathons, portfolio review, and open-source collaboration — connecting operator workflows with citizen safety in one system.

---

## 🚀 Live Demo

**Production:** https://drishti-ai-command-center.vercel.app/

> Tip: start at `/welcome`, then enter `/command` for the operator deck.

### Explore the platform

| Route | What it shows |
|---|---|
| `/welcome` | Landing gateway, 3D hero, full module directory |
| `/command` | Master command deck — telemetry + AI decision panel |
| `/safety` | Citizen risk checker (MY SAFETY) |
| `/location` | Live hazard map with risk layers |
| `/alerts` | Real-time alert center |
| `/emergency` | One-tap SOS mode |
| `/evacuate` | Safe evacuation routing |
| `/twin` | 3D digital elevation twin + flood timeline |
| `/drones` | Drone swarm SAR tracker |
| `/ops` | Operator scenario + spillway deck |
| `/simulation` | What-If flood impact copilot |

The app contains additional supporting routes (family, nearby, report, learn, shelter, resources, recovery, demo, and more).

---

## 🎯 Problem

Disaster response breaks down when information is fragmented:

- Maps, terrain, telemetry, alerts, and field reports live in separate tools
- Situational awareness arrives late, after conditions have changed
- Operators struggle to combine hazard layers, drone positions, and citizen reports
- Citizens lack clear, localized safety guidance during floods, cyclones, and other hazards
- Evacuation, shelter, hospital, and SOS workflows are disconnected

DRISHTI-X addresses this coordination gap — not with a single model, but with a unified decision-support interface.

---

## 💡 Solution

DRISHTI-X unifies documented system components into one command + safety loop:

- Earth-observation and satellite-style imagery for context
- Drone telemetry streaming over WebSockets
- Geospatial hazard intelligence on open maps
- 3D elevation visualization with flood surge
- AI decision visualization and shared event stream
- Emergency SOS, evacuation, alerts, and nearby-help tools
- Operator scenario controls and timeline review

> This is a conceptual architecture implemented with the components in this repo — a working prototype for evaluation and further development, not a deployed production emergency system.

---

## ✨ Core Capabilities

### Command Center

| Capability | Implementation |
|---|---|
| **3D AI Neural Core** | Interactive Three.js core with rings, nodes, particles, drag-rotate |
| **3D Digital Elevation Twin** | Procedural terrain with river channel, drone, searchlight, flood surge |
| **Holographic Earth Background** | Full-screen WebGL globe with orbit traces and hazard pulses |
| **HUD Tactical Panels** | Glass panels with corner brackets, sparklines, counters, waveforms |
| **Geospatial Intelligence Gallery** | Open imagery: flood analysis, thermal SAR examples, segmentation, DEM, cyclone tracking, swarm mesh |
| **Scenario Simulator** | Nominal / Monsoon Surge / Swarm SAR / GPS-Denied |
| **Adaptive Quality Modes** | High / Balanced / Eco, auto-detected and persisted |
| **Boot Sequence** | Skippable initialization overlay, session-scoped |

### Citizen Safety

- **MY SAFETY** — personal risk score + hazard checklist (`/safety`)
- **LIVE LOCATION** — GPS hazard map with Leaflet + OpenStreetMap (`/location`)
- **ALERT CENTER** — rule-driven alerts for flood, storm, GPS-denied, battery (`/alerts`)
- **EMERGENCY MODE** — one-tap SOS with geolocation (`/emergency`)
- **SAFE EVACUATION** — shelter route guidance (`/evacuate`)
- **NEARBY HELP** — hospitals, fire stations, shelters, police via Overpass API (`/nearby`)
- **FAMILY SAFETY** — household member tracking (`/family`)
- **CITIZEN REPORTING** — ground-level incident reports (`/report`)
- **DISASTER EDUCATION** — Before / During / After guides (`/learn`)

Multilingual UI: English / Telugu / Hindi via `src/i18n/dict.ts`.

### Operator Tools

- **Master Command Deck** (`/command`) — telemetry workstation + AI panel
- **3D Digital Twin** (`/twin`) — elevation twin with flood timeline
- **Drone Swarm SAR** (`/drones`) — GPS tracker + swarm scene
- **Location Intel** (`/location`) — hazard map with risk layers
- **What-If Copilot** (`/simulation`) — flood impact simulation
- **OPS Dashboard** (`/ops`) — spillway control + scenario management
- **AI Decision Timeline** — live shared intelligence event stream (`AiDecisionTimeline.tsx`)

---

## 🧠 How DRISHTI-X Works

Conceptual data flow based on implemented components:

```text
Satellite / Earth Observation imagery
        ↓
Geospatial Intelligence (Leaflet + OSM + Overpass + tiles)
        ↓
AI / Risk / Alert Processing (riskEngine + alertRules + intelStore)
        ↓
Command Center + Digital Twin (Next.js + Three.js + HUD)
        ↓
Drone Telemetry + Field Intelligence (FastAPI WebSocket @ 2Hz + citizen reports)
        ↓
Operator Decisions (scenarios, spillway, timeline, replay)
        ↓
Citizen Safety / Evacuation / Emergency Response
```

State is shared across views via `appStore` (mode, language, quality, sound), `opsStore` (scenario, spillway, acks), and `intelStore` (AI tone, SOS, events).

---

## 🏗️ System Architecture

```text
drishti-ai-command-center/
├── src/app/          # Next.js 14 App Router — welcome, command, safety,
│                     # location, alerts, emergency, evacuate, twin,
│                     # drones, ops, simulation + supporting routes
├── src/components/   # cinematic/ (3D + HUD), 3d/, maps/, dashboard/,
│                     # alerts/, layout/
├── src/store/        # appStore, opsStore, intelStore
├── src/hooks/        # useTelemetrySocket, useLocalList
├── src/utils/        # audioSynth, alertRules, riskEngine,
│                     # geofenceDetection, overpass, apiClient
├── src/i18n/         # EN / TE / HI dictionary
├── src/data/         # demo hazards, facilities, learning content
├── backend/          # FastAPI telemetry + REST (optional)
└── public/           # icon.svg, poster.jpg, sw.js, manifest.json
```

| Directory | Purpose |
|---|---|
| `src/app` | Route pages and layouts for operator + citizen flows |
| `src/components` | Reusable UI, 3D scenes, maps, HUD, alerts |
| `src/store` | Shared client state for mode, ops, and intel events |
| `src/hooks` | WebSocket telemetry subscription and local lists |
| `src/utils` | Risk scoring, alert rules, geofencing, OSM queries, audio synth |
| `src/i18n` | Central EN/TE/HI translations |
| `backend` | Python WebSocket telemetry server and scenario API |
| `public` | Static assets, PWA service worker, favicon |

---

## 🛠️ Technology Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 14.2.5 | App Router framework |
| React | 18.3 | UI components |
| TypeScript | 5.5 | Type safety |
| Three.js | 0.169 | AI Core, Digital Twin, Globe (WebGL) |
| Leaflet | 1.9.4 | Open-source mapping |
| Tailwind CSS | 3.4 | Utility styling |
| Lucide React | 1.45 | Icons |
| Web Audio API | browser-native | Procedural sound, no audio files |

### Backend

| Technology | Purpose |
|---|---|
| FastAPI `0.116.1` | Telemetry + REST API |
| Python `3.11` | Backend runtime (per CI) |
| WebSockets | Live drone telemetry at ~2 Hz |

### Open-source / external services

| Service | Key required | Purpose |
|---|---|---|
| OpenStreetMap | No | Base map tiles |
| CartoDB | No | Dark tactical tiles |
| Overpass API | No | Nearby hospitals, shelters, POIs |
| OpenWeatherMap | Optional | Weather alerts, degrades gracefully |
| Esri World Imagery | No | Satellite tile fallback for twin |
| NASA Earth Observatory | No | Open educational imagery |
| Unsplash | No | Open visual examples in gallery |

> All core flows work with zero paid dependencies.

---

## 🌍 Disaster Use Cases

Based only on implemented capabilities:

- Flood monitoring with elevation + surge timeline
- Cyclone response context via hazard layers and alerts
- Search-and-rescue visualization with drone swarm tracker
- Hazard mapping for flood, cyclone, earthquake, fire contexts
- Drone-assisted situational awareness from telemetry stream
- Evacuation support and shelter routing
- Emergency SOS mode with geolocation
- Citizen incident reporting from the field
- Shelter / hospital / fire-station discovery via OSM
- Terrain and flood visualization for what-if review

---

## 🎮 Scenario Simulation

`/simulation`, `/ops`, and `/command` share the same scenario state:

| Scenario | What it demonstrates |
|---|---|
| **Nominal** | Baseline surveillance and telemetry |
| **Monsoon Surge** | Reservoir discharge and flood-spread response |
| **Swarm SAR** | Multi-drone search mesh coordination |
| **GPS-Denied** | Degraded-navigation operating mode |

Use it to compare telemetry, alerts, timeline events, and twin flooding across conditions. Backend scenario API: `POST /api/scenario`.

---

## 🎨 Visual & UX Design

NASA mission-control meets cinematic sci-fi and enterprise dashboard:

- Dark navy environment with glassmorphism surfaces
- Electric cyan accents with rose/amber status tones
- Tactical HUD corner brackets, grids, and sweep effects
- 3D WebGL centerpieces with animated telemetry
- `font-mono` stacks for telemetry readability

```text
Background  #020b14
Surfaces    #051424 / #081b2e (glass + blur)
Accent      #00d2ff (cyan)
Status      #fb7185 (rose) / #fbbf24 (amber)
```

### Quality modes

| Mode | Particles | Detail | Target |
|---|---|---|---|
| High | 450–750 | Full geometry, nodes, rings | 60 fps |
| Balanced | 240–380 | Reduced nodes | 60 fps |
| Eco | 70–120 | Minimal geometry | 30 fps |

Auto-selected from device signals, toggle anytime from the quality switcher. Respects reduced-motion with CSS/WebGL fallback.

---

## ⚡ Performance Engineering

- Dynamic imports split Three.js chunks from the main bundle
- `IntersectionObserver` parks WebGL loops off-screen
- Page Visibility API pauses animation when tab is hidden
- Adaptive quality (High / Balanced / Eco)
- Reduced-motion and no-WebGL fallbacks
- Lazy-loaded gallery imagery (`loading="lazy"`)
- Zero paid dependencies for core flows

---

## 🖼️ Platform Preview

Assets shipped in this repo:

- `public/poster.jpg` — hero poster artwork
- `public/icon.svg` — cybernetic eye favicon
- `public/manifest.json` + `public/sw.js` — PWA install / offline shell

![DRISHTI-X poster](public/poster.jpg)

> No fabricated screenshots are committed. Real route captures belong in `docs/screenshots/` — see `docs/screenshots/README.md` for the canonical capture list and contribution steps.

---

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm 9+

### Quick start

```bash
# 1. Clone
git clone https://github.com/hemanthhemanth1834-bit/drishti-ai-command-center.git
cd drishti-ai-command-center

# 2. Install
npm install

# 3. Configure (all optional — app runs without keys)
cp .env.local.example .env.local

# 4. Run
npm run dev
# Open http://localhost:3000
```

### Production build

```bash
npm run build
npm run start
```

### Optional backend (live WebSocket telemetry)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
# WebSocket: ws://localhost:8000/ws/telemetry
# Health:   http://localhost:8000/api/health
```

Other useful commands:

```bash
npm run lint
npm run typecheck  # tsc --noEmit
```

---

## 🔐 Environment Variables

All frontend variables are **optional** — the app degrades gracefully without them.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_WS_URL` | Optional | Telemetry WebSocket (defaults to `ws://localhost:8000/ws/telemetry`) |
| `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_API_BASE` | Optional | Backend REST base (code reads `NEXT_PUBLIC_API_BASE`, defaults to `http://localhost:8000`) |
| `NEXT_PUBLIC_OWM_KEY` | Optional | OpenWeatherMap free-tier weather alerts |
| `NEXT_PUBLIC_GOOGLE_PLACES_KEY` / `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Optional | Nearby search fallback; code reads `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |

Current example file (`.env.local.example`):

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/telemetry
NEXT_PUBLIC_GATEWAY_KEY=CHANGE_ME_must_match_backend_GATEWAY_KEY
# NEXT_PUBLIC_GOOGLE_MAPS_KEY=
```

Backend example (`backend/.env.example`):

```env
GATEWAY_KEY=CHANGE_ME_set_a_long_random_value_here
CORS_ORIGINS=http://localhost:3000
TELEMETRY_HZ=2
```

> ⚠️ **Never commit real API keys or secrets to GitHub.** `.env*.local` and backend `.env` are gitignored.

---

## 🌐 Deployment

Live URL: **https://drishti-ai-command-center.vercel.app/**

- Frontend is a Next.js app configured for Vercel (`vercel.json`)
- GitHub Actions validate pushes/PRs: frontend typecheck + build, backend compile + tests, backend Docker build (see `.github/workflows/`)
- Manual production deploy:

```bash
npm run build
vercel --prod
```

Set the same `NEXT_PUBLIC_*` values in Vercel → Project → Settings → Environment Variables, then redeploy.

---

## 📁 Project Structure

```text
├── src/app/welcome/page.tsx        # gateway landing
├── src/app/command/page.tsx        # operator deck
├── src/components/DigitalTwin.tsx  # elevation twin
├── src/components/cinematic/AiCoreScene.tsx
├── src/components/cinematic/CommandBackground.tsx
├── src/components/cinematic/GeospatialIntelGallery.tsx
├── src/components/cinematic/AiDecisionTimeline.tsx
├── src/components/cinematic/BootSequence.tsx
├── src/store/appStore.ts           # mode, language, quality, sound
├── src/store/opsStore.ts           # scenario, spillway, acks
├── src/store/intelStore.ts         # AI tone, SOS, shared events
├── src/utils/audioSynth.ts         # Web Audio procedural synth
├── src/utils/riskEngine.ts         # citizen risk scoring
├── src/utils/alertRules.ts         # alert evaluation
└── backend/app/main.py             # FastAPI entrypoint
```

---

## 🗺️ Roadmap

Planned enhancements — not yet implemented:

- [ ] Copernicus Sentinel imagery integration
- [ ] WebRTC peer-to-peer drone video feed
- [ ] PWA push notification alerts
- [ ] Multi-agency collaboration room via shared WebSocket state
- [ ] Citizen AI chatbot (local open-source LLM)
- [ ] React Native / Expo companion app
- [ ] Bharat GNSS / NavIC positioning integration

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

## ⭐ Why DRISHTI-X

- Combines geospatial intelligence, 3D visualization, and real-time telemetry in one Next.js system
- Connects operator decision workflows with citizen safety tools
- Modular architecture: routes, 3D components, stores, utils, and optional FastAPI backend
- Modern web stack with performance-conscious WebGL and graceful degradation
- Focused on disaster-response decision support and evaluability

*DRISHTI-X — For a Safer, Stronger, Resilient India 🇮🇳*
