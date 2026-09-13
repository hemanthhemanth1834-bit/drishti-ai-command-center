<div align="center">

# DRISHTI-X

### A Cinematic 3D Disaster Intelligence & Emergency Response Command Center

A unified disaster-intelligence operating system connecting citizens, geospatial risk intelligence, emergency response, drone SAR, hospitals, shelters, 3D digital twins, flood simulation, and recovery — presented as one connected command experience, not a collection of dashboard cards.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-black)
![Leaflet](https://img.shields.io/badge/Leaflet-OSM-green)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688)
![PWA](https://img.shields.io/badge/PWA-offline-purple)
![A11y](https://img.shields.io/badge/Accessibility-WCAG-orange)
![i18n](https://img.shields.io/badge/EN-%E0%B0%A4%E0%B1%86%E0%B0%B2%E0%B1%81%E0%B0%97%E0%B1%81-hotpink)
![Free](https://img.shields.io/badge/Paid_dependencies-none-brightgreen)

**[🚀 LIVE DEMO](https://drishti-ai-command-center.vercel.app/welcome) · [🛰️ COMMAND CENTER](https://drishti-ai-command-center.vercel.app/command) · [🛡️ CITIZEN SAFETY](https://drishti-ai-command-center.vercel.app/safety) · [🎬 DEMO MODE](https://drishti-ai-command-center.vercel.app/demo) · [💻 GITHUB](https://github.com/hemanthhemanth1834-bit/drishti-ai-command-center)**

</div>

---

## 🚀 Release Status

| Area | Status |
|---|---|
| Routes | ✅ 28/28 verified (27 pages + root redirect) |
| TypeScript | ✅ PASS (`tsc --noEmit` clean) |
| ESLint | ✅ PASS (`next/core-web-vitals`, zero warnings) |
| Backend Tests | ✅ 9/9 PASS (pytest contract suite) |
| Production Build | ✅ PASS (all routes prerendered) |
| Cinematic 3D layer | ✅ Vanilla Three.js, zero new dependencies |
| Security Audit | ✅ CLEAN (no secrets in repo, CHANGE_ME examples) |
| PWA / Offline | ✅ Service worker + offline banner |
| Accessibility | ✅ Toolbar, skip link, reduced-motion, read-aloud |
| Multilingual | ✅ EN / TE / HI dictionary + full Learn translation |

---

## 🖼️ Hero Visual

![DRISHTI-X — for a safer, stronger, resilient India](public/poster.jpg)

*Official project artwork (`public/poster.jpg`) — also the live welcome hero. Replace it with any 16:9 JPG to re-skin; no code change needed.*

---

## 🎬 Hackathon Presentation Flow (90 seconds)

One connected narrative. Open these in order — the shared ops store keeps every screen synchronized:

`SYSTEM BOOT → COMMAND CENTER → FLOOD EVENT → DRONE DEPLOYMENT → TARGET DETECTION → AI RECOMMENDATION → DIGITAL TWIN → RESPONSE → RECOVERY`

| # | Beat | Do this | Audience sees |
|---|---|---|---|
| 1 | BOOT | Open [/command](https://drishti-ai-command-center.vercel.app/command) fresh (clear sessionStorage to replay) | Cinematic init: NETWORK → SATELLITE → DRONE SWARM → AI CORE → DIGITAL TWIN → READY |
| 2 | COMMAND | Land on the deck | Holographic Earth, status header (SYSTEM / NETWORK / SAT / DRONE / AI / DATA / CLOCK), animated KPI ticker |
| 3 | FLOOD EVENT | Move the T-0h → T+24h forecast slider | Water expansion, affected-zone chips, risk tone shift, twin surge rising |
| 4 | DRONE DEPLOYMENT | Open [/drones](https://drishti-ai-command-center.vercel.app/drones) | 3D swarm in echelon formation, SAR grid, radar sweep, telemetry rings |
| 5 | TARGET DETECTION | Wait ~7 seconds | ANALYZING → **TARGET DETECTED** with confidence, distance, ETA, thermal, coordinates (labeled SIMULATION) |
| 6 | AI RECOMMENDATION | Back on `/command`, AI panel | ANALYZING → INFERENCE COMPLETE · dispatch order, reason, ETA, risk, resources |
| 7 | DIGITAL TWIN | Open [/twin](https://drishti-ai-command-center.vercel.app/twin) | Procedural city: river shimmer, emergency corridor, moving response vehicles, pulsing hazards — click any marker |
| 8 | RESPONSE | Open [/demo](https://drishti-ai-command-center.vercel.app/demo) → START flood | DemoBar drives scenario + spillway through 7 phases on every route |
| 9 | RECOVERY | Open [/recovery](https://drishti-ai-command-center.vercel.app/recovery) | Animated incident timeline + hash-chained relief ledger |

> ⚠️ **DEMO/SIMULATION DATA IS NOT LIVE EMERGENCY DATA.** Every drill number on screen carries a LIVE / DEMO / SIMULATION / LOCAL / OFFLINE badge with its source.

---

## 🖥️ Showcase Gallery

Real captures live in [`docs/screenshots/`](docs/screenshots/) — every image is captured from the running app (capture guide inside; no mockups are committed). Filenames below are the canonical set; missing files render as checklist items until captured.

| Command Center | 3D Digital Twin |
|---|---|
| `command.png` — holographic Earth, status header, AI panel | `twin.png` — procedural city, surge plane, picked entity |

| Drone SAR | Flood Simulation |
|---|---|
| `drones.png` — swarm formation, TARGET DETECTED, radar | `simulation.png` — T+ timeline, BEFORE/SIM/AFTER, impact grid |

| Hydra-Net AI | Hospital ICU Command |
|---|---|
| `command.png` (AI panel crop) — inference ribbon, recommendation | `resources.png` — ECG waveforms, triage gauges, dispatch pairing |

| Shelter Scanner | Citizen Portal |
|---|---|
| `shelter.png` — holographic capacity nodes, check-in | `report.png` — priority intake, animated report pipeline |

**Capture checklist (1280×800, each under ~500 KB):** `welcome` · `command` · `twin` · `drones` · `simulation` · `resources` · `shelter` · `report` · `recovery` · `ops` · `location` · `safety` · `demo` (scenario running). See [`docs/screenshots/README.md`](docs/screenshots/README.md) for the one-line headless-capture commands.

**Demo flow (text diagram — no fabricated GIF):**

```
NORMAL → WATCH → WARNING → CRITICAL → EVACUATION → RESCUE → RECOVERY
  │        │         │          │            │           │         │
  ▼        ▼         ▼          ▼            ▼           ▼         ▼
 calm   rain cell  risk↑   discharge   buses out   FLIR+boats  audit
```

---

## 🎯 The Problem

Disaster information is fragmented across weather bulletins, paper maps, WhatsApp rumors, hospital phone lines, shelter lists, rescue teams and sensor silos. Citizens get noise; operators get dashboards that don't talk to each other.

## ⚡ The DRISHTI-X Solution

One unified intelligence layer:

```
DETECT → ANALYZE → ALERT → EVACUATE → RESPOND → RESCUE → RECOVER
```

Live telemetry where it exists, clearly-labeled simulation where it doesn't, and provider interfaces so official feeds plug in later without touching a single page.

---

## 👥 Two Experiences. One Platform.

### 🛡️ Citizen Mode

Answers **AM I SAFE? · WHAT HAPPENED? · WHAT SHOULD I DO? · WHERE SHOULD I GO? · HOW DO I GET HELP?**

Routes: `/welcome` `/safety` `/risk` `/alerts` `/nearby` `/evacuate` `/emergency` `/report` `/family` `/plan` `/kit` `/learn` `/talk` — big buttons, plain language, no operator telemetry.

### 🛰️ Command Mode

Answers **WHAT IS HAPPENING? · WHERE? · HOW SEVERE? · WHO IS AFFECTED? · WHAT SHOULD RESPONDERS DO NEXT?**

Routes: `/command` `/ops` `/demo` `/drones` `/twin` `/location` `/simulation` `/resources` `/shelter` `/reunion` `/recovery` `/portal` `/platform` `/sources` — telemetry, 3D, SAR, ICU, simulation, KPIs.

---

## 🌐 Cinematic 3D Command Environment

Zero new dependencies — vanilla Three.js + Canvas 2D + CSS, procedural geometry only, no purchased models, footage, or fonts.

| Layer | What it is | File |
|---|---|---|
| Holographic Earth | Rotating globe, atmosphere rim shell, lat/long grid, data arcs, hazard pulses, orbital traces, drone orbiters, adaptive particles | `src/components/cinematic/CommandBackground.tsx` |
| Status header | SYSTEM / NETWORK / SAT / DRONE LINK / AI / DATA / IST clock with live pulses | `src/components/cinematic/StatusHeader.tsx` |
| HUD system | Glass panels, corner ticks, hover/focus/active, warn/critical tones | `src/components/cinematic/HudPanel.tsx` |
| Data viz | Count-ups, radial gauges, sparklines, waveforms (park offscreen) | `src/components/cinematic/AnimatedCounter.tsx` |
| Radar | Sweep gradient, contact trails, signal bars, coords, pulses | `src/components/cinematic/RadarSweep.tsx` |
| Boot sequence | Skippable init, session-scoped, reduced-motion aware | `src/components/cinematic/BootSequence.tsx` |
| Sound | Muted-by-default Web Audio blips, toggle persisted | `src/components/cinematic/SoundToggle.tsx` |

Performance is budgeted, not hoped for: adaptive particle counts, pixel-ratio caps, offscreen/tab-hidden render parking, GPU-friendly particles, reduced effects on mobile, full WebGL fallback to a 2D command experience, and `prefers-reduced-motion` support throughout.

---

## 🛰️ Drone Swarm & SAR (`/drones`)

Cinematic swarm twin (`src/components/three/DroneSwarmScene.tsx`): procedural airframes with nav lights + strobes, telemetry rings, signal discs, FLIR cones, motion trails, eased formation flight with banking, SAR search grid, plus the staged detection beat — SCAN → ANALYZING → **TARGET DETECTED** (ID, coordinates, confidence, distance, ETA, thermal signature), always labeled SIMULATION. The Leaflet SAR map (2 km radius, FLIR overlay note, payload matrix, live fleet list) is preserved underneath.

## 🏙️ 3D Digital Twin (`/twin`)

`TwinViewport.tsx` renders a procedural response city: terrain, animated river with travelling shimmer, lit bridge, glowing roads, breathing amber emergency corridor, extruded buildings with window strips, holographic zone wall, moving response vehicles with headlights, pulsing hazard markers, telemetry-driven drone with spotlight cone and ground shadow, flood-surge plane, click-to-pick entities, satellite/grid terrain modes, and a T-0h→T+24h flood forecast driver.

## 🌊 Flood Simulation (`/simulation`)

`FloodTimeline.tsx` turns the hydraulic surrogate into a cinematic control: T-0h / T+1h / T+3h / T+6h / T+12h / T+24h with eased water expansion, sequential affected-zone chips, risk-toned framing, and BEFORE → SIMULATION → AFTER impact framing (population, roads, buildings, hospitals, shelters, evac zones). Spillway slider, scenario injector, banner preview, and local AI advisor remain fully functional.

## 🧠 Hydra-Net Decision Support (`/command`)

The AI panel behaves like a serious decision-support engine: ANALYZING → INFERENCE COMPLETE ribbon (re-runs per scenario change), 98.4% confidence, recommended intervention, reasoning summary, affected population, resource requirement, response ETA, risk state, and dispatch approval — with SIMULATION labeling on all model output.

## 🏥 Hospital ICU Command (`/resources`)

Medical-operations treatment: live ECG/SpO2/resp waveforms (demo), ICU/ventilator/O₂ radial gauges, CRITICAL/WARNING/STABLE triage states, DEMO-labeled registry, field-sensor buffer, and ambulance→ICU auto-dispatch pairing.

## 🏕️ Shelter Intelligence (`/shelter`)

Holographic shelter nodes with animated capacity rings (capacity / occupied / available / ETA / risk / status), kiosk check-in scanner, occupancy bar, DEMO-labeled registry with navigation links, and family reunification cross-match.

## 🧾 Recovery & Audit (`/recovery`)

Animated EVENT → TIME → ACTION → RESPONDER → RESULT → STATUS incident timeline, Merkle-chained relief disbursement ledger with running total, structural sensor diagnostics, and PDNA snapshot.

## 📣 Citizen Portal (`/report`, `/portal`)

Simulated citizen intake across flood / trapped-person / blocked-road / fire / medical / missing-person types with LOW → CRITICAL priority framing and an animated status pipeline (SUBMITTED → RESOLVED), plus the low-bandwidth public advisory lifeline (`/portal`) with corridors and relief schedules.

---

## 🧩 Core Capabilities

| Capability | Status |
|---|---|
| Citizen Safety dashboard | ✅ `/safety` |
| Risk Intelligence + WHY factors | ✅ `/safety` `/risk` |
| Multi-Hazard Alerts + notifications | ✅ `/alerts` |
| Safe Evacuation (≤30 km, exposure-ranked) | ✅ `/evacuate` |
| Location Intelligence (GPS, OSM, layers) | ✅ `/location` |
| Drone SAR (grid, radius, SIM telemetry) | ✅ `/drones` |
| 3D Digital Twin (satellite, VFX, picking) | ✅ `/twin` |
| Hospital Intelligence (SIM capacity) | ✅ `/resources` |
| Shelter Intelligence (DEMO status) | ✅ `/shelter` `/nearby` |
| What-If Simulation + impact model | ✅ `/simulation` |
| Demo Scenario + Mission Replay | ✅ `/demo` `/platform` |
| System Health (real probes) | ✅ `/ops` |
| Recovery & Audit ledger | ✅ `/recovery` |
| Citizen Reporting pipeline | ✅ `/report` |
| Family Safety | ✅ `/family` |
| Emergency Plan + Kit | ✅ `/plan` `/kit` |
| Disaster Education (trilingual) | ✅ `/learn` |
| Voice Assistant (Web Speech) | ✅ `/talk` |
| Offline / PWA | ✅ Service worker + banner |
| Accessibility toolbar | ✅ Text, contrast, motion, read-aloud |
| EN / TE / HI | ✅ Dictionary + full Learn pass |

---

## 🌊 Disaster Scenario (Vijayawada Flood Response · SIMULATION)

```
NORMAL → HEAVY RAIN → RIVER RISING → WATCH → WARNING → CRITICAL
→ EVACUATION → DRONE SAR → HOSPITAL RESPONSE → RESCUE → RECOVERY
```

One shared ops store drives scenario + spillway through 7 engine phases, so **Risk, Alerts, Maps, Hazard Zones, 3D Twin, Drones, Shelters, Hospitals, Citizen + Command dashboards, Ops KPIs and Replay stay synchronized**. Run it from `/demo`, `/platform` or `/ops`; the DemoBar persists on every route with auto-play.

---

## 🏗️ System Architecture

```
CITIZEN / OPERATOR
        ↓
NEXT.JS 14 APPLICATION (App Router, 27 pages)
        ↓
CINEMATIC LAYER (CommandBackground · HudPanel · StatusHeader · Radar · Swarm · FloodTimeline)
        ↓
DOMAIN SERVICES (riskEngine · alertRules · opsStore · geocode · overpass)
        ↓
RISK / ALERT / EVACUATION / TELEMETRY logic
        ↓
PROVIDER INTERFACES (Hazard · Weather · Alert · Shelter · Hospital · Evacuation · Incident · Drone)
        ↓
DEMO / LOCAL PROVIDERS (labeled cells · localStorage · sim telemetry · drill scripts)
        ↓
FUTURE OFFICIAL DATA SOURCES (plug in without touching pages)
```

See `/platform` in the app for the interactive version of this map.

---

## 🛠️ Technology Stack

**Frontend:** Next.js 14.2.5 · React 18 · TypeScript 5 · Tailwind CSS 3 · Three.js (vanilla, no wrapper libs) · Leaflet + OpenStreetMap · lucide-react
**Backend:** FastAPI · Python 3.11 · Uvicorn · WebSockets · Pydantic · pytest + httpx
**Data/Maps (free, no keys):** Nominatim · Overpass API · Browser Geolocation · Google Maps keyless embed (rich place data only with optional key)
**Platform:** PWA + Service Worker · localStorage (prefs, reports, checklists) · Web Speech API · Web Notifications API
**What we deliberately do NOT use:** no paid maps, no paid AI, no paid 3D models, no stock footage, no premium fonts, no commercial animation libraries, no paid DB/auth, no IndexedDB (localStorage covers current needs), no secrets in code.

---

## 🔐 Data Trust Model

| Badge | Meaning |
|---|---|
| 🟢 LIVE | Real measured/streamed data (WS telemetry, OSM responses, probe results) |
| 🟡 DEMO | Illustrative data for drills (hazard cells, shelters, alerts, ICU numbers) |
| 🔵 SIMULATION | Model output (surge math, exposure ranking, ETAs, drill metrics) |
| 🟣 LOCAL | On-device only (prefs, reports, family, checklists) |
| ⚪ OFFLINE | Cached content shown without connectivity — never presented as live |

Every important panel shows **SOURCE · STATUS · LAST UPDATED**. Demo providers live behind interfaces in `src/data/providers.ts`.

---

## ♿ Designed for Real-World Conditions

- EN / TE / HI dictionary + fully translated Learn library (8 topics × Before/During/After + Emergency + Do/Don't)
- Keyboard navigation, `:focus-visible` rings, skip-to-content link, screen-reader labels; critical info never carried by color alone
- `prefers-reduced-motion` respected globally (camera, parallax, particles, rotations, transitions park) + in-app Reduce-motion toggle; emergency info stays readable with animations off
- Large-text + high-contrast modes, read-aloud toolbar
- PWA offline shell: emergency/learn/safety pages cached; OFFLINE MODE + LAST SYNCHRONIZED banner; reconnect-friendly
- Mobile prioritizes alert → risk → location → AI recommendation → map → response status, with reduced 3D complexity

---

## 🔌 Future Official Integrations (ROADMAP — not live)

IMD weather · NDMA/CAP alerts · Government disaster feeds · River/IoT sensors · Hospital HMIS · Shelter registries · Bhuvan satellite tiles · MAVLink drone link — each maps 1:1 onto an existing provider interface. **None of these are connected today, and the app never claims otherwise.**

---

## 🧪 Engineering Verification

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ clean (also in CI) |
| `npx next lint --dir src` | ✅ zero warnings (`next/core-web-vitals`) |
| `cd backend` → `python -m pytest tests/ -q` | ✅ 9/9 (health, auth, packet shape, scenario, sensors, WS) |
| Production build | ✅ all routes prerendered |
| Routes | ✅ 28/28 local + 28/28 production |
| Security | ✅ no secrets in repo, CHANGE_ME examples |

> Local `npm run build` requires the dev server stopped (shared `.next/`); every `vercel --prod` is the standing build proof.

---

## 🗺️ Routes

**WELCOME** `/` → `/welcome` (poster, ENTER-to-enter) · **COMMAND** `/command` deck · `/ops` KPIs+health · `/demo` presenter
**CITIZEN** `/safety` `/risk` `/emergency` `/alerts` `/nearby` `/evacuate` `/report` `/family` `/plan` `/kit` `/learn` `/talk`
**INTELLIGENCE** `/location` `/drones` `/twin` `/simulation` · **OPERATIONS** `/resources` `/shelter` `/reunion` `/recovery` · **PLATFORM** `/portal` `/platform` `/sources`

---

## ⚙️ Local Development Setup

<details>
<summary><b>First-time setup (backend + frontend + env)</b></summary>

```powershell
cd drishti-ai-command-center\backend
copy .env.example .env
```
Creates `.env` (`GATEWAY_KEY`, `CORS_ORIGINS`, `TELEMETRY_HZ`). Git-ignored — generate your own value (examples use `CHANGE_ME`).

```powershell
pip install -r requirements.txt
```
FastAPI, Uvicorn, Pydantic, pytest, httpx.

```powershell
cd drishti-ai-command-center
copy .env.local.example .env.local
```
Creates `.env.local` (`NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_GATEWAY_KEY` = same value as backend). Optional `NEXT_PUBLIC_GOOGLE_MAPS_KEY` for rich place data; empty = free keyless map.

```powershell
npm install
```
Next.js, React, Leaflet, Three.js, Tailwind, lucide-react. `package-lock.json` pins versions.

</details>

<details>
<summary><b>Daily run (two terminals) + Docker + deploy</b></summary>

Terminal 1: `cd drishti-ai-command-center\backend` → `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` (prove: `http://localhost:8000/api/health`; stream: `ws://localhost:8000/ws/telemetry`).
Terminal 2: `cd drishti-ai-command-center` → `npm run dev` → `http://localhost:3000` + **Ctrl+F5**.

Docker: `docker compose up --build` (API :8000, web :3000).
Ship: `railway up -y -d` (from `backend/`) · `vercel --prod --yes` (repo root; set `NEXT_PUBLIC_*` env first — baked at build time).
Commit: `git add -A` → `git commit -m "feat: ..."` → `git push origin main` (CI type-checks/builds).

</details>

<details>
<summary><b>📁 Project Structure</b></summary>

```text
drishti-ai-command-center/
├── .github/workflows/   # deploy.yml + pr-check.yml
├── backend/             # FastAPI (app/main.py, config, models, services, routers/api_v1+ws, tests/)
├── src/
│   ├── app/             # /, /welcome, /command, /ops, /demo, /sources + 10 tactical + 12 citizen routes
│   ├── components/
│   │   ├── cinematic/   # CommandBackground, StatusHeader, HudPanel, AnimatedCounter,
│   │   │                # RadarSweep, BootSequence, SoundToggle, CinematicShell
│   │   ├── three/       # DroneSwarmScene, FloodTimeline
│   │   ├── 3d/          # TwinViewport (procedural city), DigitalTwinCanvas
│   │   ├── maps/        # DroneLeafletTracker + RadarMap overlays
│   │   ├── alerts/      # AlertBanner, GeofenceBreachModal
│   │   └── …            # RiskChecker, DemoBar/Console/Replay, SystemHealth,
│   │                    # ArchitectureDiagram, TrustBadge, EmergencyFab, A11yBar, Navbar…
│   ├── data/            # providers.ts (8 interfaces + demo sets) + learn.ts (trilingual)
│   ├── store/           # opsStore (scenario/spillway/demo) + appStore (mode/lang/a11y)
│   ├── hooks/           # useTelemetrySocket (reconnecting WS) + useLocalList
│   ├── i18n/dict.ts     # EN/TE/HI dictionary
│   └── utils/           # apiClient, geofence, geocode+Nominatim/GPS, overpass, riskEngine,
│                        # alertRules, googlePlaces (keyed)
├── public/              # poster.jpg + manifest.json + sw.js + icon.svg
├── docs/screenshots/    # capture guide + real captures only (none fabricated)
├── tailwind.config.js + postcss.config.js + vercel.json + docker-compose.yml
```

</details>

---

## 🔒 Security

- Secrets live in git-ignored `.env` files + hosting dashboards only; examples use `CHANGE_ME`
- Repository audited for keys/tokens/passwords — clean; gateway auth guards REST, WS is local-HUD open
- Personal data (reports, family, checklists) in browser localStorage; shared coordinates rounded to ~100 m; inputs length-capped

## ⚠️ Limitations (honest)

- Demo/simulation content is clearly labeled and must never be mistaken for official warnings
- Learn TE/HI is functional, not professionally reviewed
- Overpass/Geolocation depend on third-party reachability; both degrade gracefully
- Local production build needs the dev server stopped; cloud build is the proof

## 📄 Project Information

DRISHTI-X — A Cinematic 3D Disaster Intelligence & Emergency Response Command Center.
No license file is committed yet — add one (e.g. MIT/Apache-2.0) before public release.
Maintainer: [@hemanthhemanth1834-bit](https://github.com/hemanthhemanth1834-bit)
