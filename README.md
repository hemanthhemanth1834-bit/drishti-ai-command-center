# DRISHTI-X — AI Disaster Intelligence Command Center

> **SEE EARLY · UNDERSTAND BETTER · ACT FASTER · SAVE LIVES**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-00d2ff?style=for-the-badge&logo=vercel)](https://drishti-ai-command-center.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/hemanthhemanth1834-bit/drishti-ai-command-center)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.169-000000?style=flat-square&logo=threedotjs)](https://threejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.116.1-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-Educational_Hackathon-blue?style=flat-square)](#-license)

**DRISHTI-X is a disaster-intelligence and emergency-response command prototype combining geospatial intelligence, simulated drone telemetry, 3D digital twins, deterministic risk/alert logic, AI-style decision visualization, citizen safety tools, and operator dashboards.**

Live: **https://drishti-ai-command-center.vercel.app/** · Start at `/welcome`, then enter `/command`.

> **Scope honesty:** this repository contains **no trained ML model, no live satellite feed, and no real emergency-dispatch backend**. Telemetry, hazards, and scenarios are **simulated / demo data** visualized through a real Next.js + FastAPI + WebSocket + Three.js + Leaflet implementation. See [What is real vs simulated](#what-is-real-vs-simulated-vs-planned).

---

<details>
<summary><strong>Contents</strong></summary>

- [Project overview](#-project-overview)
- [Problem statement](#-problem-statement)
- [Solution](#-solution)
- [Live demo + routes](#-live-demo)
- [Complete platform modules](#-complete-platform-modules)
- [Command center deep dive](#-command-center-deep-explanation)
- [Drone system](#-drone-system)
- [Map & geolocation](#-map--geolocation-system)
- [Risk engine](#-risk-engine)
- [Alert system](#-alert-system)
- [Emergency / SOS](#-emergency--sos-system)
- [Evacuation](#-evacuation-system)
- [Citizen safety](#-citizen-safety-system)
- [AI / intelligence layer](#-ai--intelligence-layer)
- [State management](#-state-management)
- [Hooks](#-hooks)
- [Utilities](#-utilities)
- [Internationalization](#-internationalization)
- [Audio system](#-audio-system)
- [3D rendering architecture](#-3d-rendering-architecture)
- [Quality modes](#-quality-modes)
- [Performance engineering](#-performance-engineering)
- [Backend](#-backend)
- [API documentation](#-api-documentation)
- [External services](#-external-services)
- [Environment variables](#-environment-variables)
- [Project structure](#-complete-project-structure)
- [Data flow](#-data-flow)
- [User flows](#-user-flows)
- [Scenario simulator](#-scenario-simulator)
- [Security](#-security)
- [Accessibility](#-accessibility)
- [Responsive design](#-responsive-design)
- [Installation](#-installation)
- [Troubleshooting](#-troubleshooting)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Limitations](#-limitations)
- [Roadmap](#-future-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)
- [Why DRISHTI-X](#-why-drishti-x)

</details>

---

## 🛰️ Project overview

**DRISHTI-X (“AI Disaster Intelligence Command Center”)** is a full-stack prototype for disaster-response **decision support**. The “command-center concept” means one shared operational picture: maps, terrain, telemetry, alerts, scenarios, and citizen tools reading from the same client stores and backend scenario state, instead of disconnected pages.

### Citizen vs operator

| Surface | Audience | Goal | Entry routes |
|---|---|---|---|
| **Citizen-facing** | Public, families, field reporters | Am I safe? Where do I go? Who do I call? | `/welcome`, `/safety`, `/risk`, `/location`, `/alerts`, `/nearby`, `/evacuate`, `/emergency`, `/family`, `/report`, `/plan`, `/kit`, `/learn`, `/talk`, `/portal` |
| **Operator-facing** | Commanders, drill coordinators, evaluators | What is happening? What if discharge rises? Where are drones? | `/command`, `/twin`, `/drones`, `/ops`, `/simulation`, `/resources`, `/shelter`, `/reunion`, `/recovery`, `/demo`, `/platform`, `/sources` |

`src/components/layout/Navbar.tsx` encodes this split explicitly: `PUBLIC_ITEMS` (13 links) vs `COMMAND_ITEMS` (14 links). Root `/` redirects to `/welcome`.

### Why these technologies

- **3D visualization** makes elevation, flood surge, drone position, and system posture readable at a glance. Implemented with vanilla Three.js (`three@0.169`), no react-three-fiber.
- **Geospatial intelligence** grounds every decision in location: Leaflet + OpenStreetMap tiles, Nominatim geocoding, Overpass POIs, hazard circles, SAR grid, shelter discovery.
- **Drone telemetry** gives a moving picture: FastAPI generates 2 Hz packets; `useTelemetrySocket` streams them into HUDs, maps, and 3D scenes.
- The platform supports decisions by combining the above with deterministic risk/alert scoring, scenario injection, timeline review, and evacuation/SOS helpers — **as a prototype, not a certified dispatch system**.

### What is real vs simulated vs planned

| Category | Examples in this repo |
|---|---|
| **Real implemented** | Next.js routing, Leaflet maps, OSM/Nominatim/Overpass queries, WebSocket client with reconnect, FastAPI REST+WS, rule-based risk/alerts, geofencing math, localStorage lists, trilingual dictionary, procedural Web Audio, adaptive WebGL quality, CI typecheck/build/tests |
| **Simulated / visualized** | Drone GPS/battery/signal (sinusoidal + random around Hyderabad `17.3850, 78.4867`), hazard zones (`DEMO_HAZARDS`), facilities (`DEMO_FACILITIES`), ICU registry, shelter seeds, reunion seeds, gallery Unsplash examples, “AI core” tone animation, scenario physics |
| **Planned, not built** | Copernicus Sentinel, WebRTC drone video, PWA push, multi-agency rooms, citizen LLM chatbot, React Native app, NavIC positioning |

---

## 🎯 Problem statement

Without inventing statistics, disaster response is hard because:

- **Fragmented information:** maps, terrain, telemetry, alerts, and field reports live apart.
- **Delayed awareness:** conditions change faster than manual updates propagate.
- **Map/terrain complexity:** elevation, water spread, and hazard overlap are hard to read from 2D lists.
- **Emergency communication:** citizens need simple numbers, share-links, and navigation under stress.
- **SAR coordination:** drone position, battery, link quality, and search pattern must be seen together.
- **Citizen safety:** “am I safe, what do I do, where do I go” needs localized answers.
- **Evacuation planning:** shelter distance, path hazard exposure, and transport mode interact.
- **Resource discovery:** hospitals, shelters, police, fire, pharmacies are scattered across sources.
- **Decision support:** operators need one posture (LEVEL-1/2/3), one timeline, one scenario control.

---

## 💡 Solution

DRISHTI-X’s conceptual data flow (labels match implemented pieces):

```text
Earth observation imagery (open tiles + gallery examples)
        ↓
Geospatial intelligence (Leaflet + OSM + Overpass + Nominatim)
        ↓
Risk / alert processing (riskEngine + alertRules + intelStore)
        ↓
Command center (Next.js HUD + shared stores)
        ↓
3D digital twin (procedural terrain + surge plane)
        ↓
Drone telemetry (FastAPI WebSocket @ ~2 Hz, simulated values)
        ↓
Operator intelligence (scenarios, spillway, timeline, replay)
        ↓
Citizen safety (risk, alerts, nearby, evacuation, SOS)
        ↓
Emergency response (frontend prototype helpers + map links)
```

Each layer is inspectable in code; none implies live satellite tasking or real dispatch.

---

## 🚀 Live Demo

**Production:** https://drishti-ai-command-center.vercel.app/

> Start at `/welcome` for the gateway, then `/command` for the operator deck. No API keys required.

### Core routes

| Route | Purpose |
|---|---|
| `/welcome` | Gateway, 3D hero, module directory, scenario picker |
| `/command` | Master deck: telemetry, alerts, inference ribbon, twin, tracker, timeline |
| `/safety` | Public safety dashboard: AM I SAFE / WHAT DO I DO / WHERE DO I GO |
| `/location` | Place search, reverse geocode, risk/facility layers |
| `/alerts` | Alert stream with severity + Browser Notification opt-in |
| `/emergency` | SOS mode with timer, radar, share + navigate |
| `/evacuate` | Shelters ≤30 km with exposure-ranked destinations |
| `/twin` | 3D twin + surge plane + air-drop demo |
| `/drones` | Swarm + SAR radar + Leaflet tracker (fleet ≤8, `?lat&lon&name` focus) |
| `/ops` | KPI overview, drill KPIs, system health, demo console |
| `/simulation` | What-if spillway slider (5–80k cusecs) + flood math |

---

## 🧩 Complete platform modules

> For each: purpose · user · view · components · data · store · utils · links · limits.

<details open>
<summary><strong>/welcome — Gateway</strong> <code>src/app/welcome/page.tsx</code></summary>

- **Purpose:** cinematic entry + directory to every module + scenario picker.
- **User sees:** `AiCoreScene` + `DigitalTwin` (dynamic, ssr:false), counters/sparklines/waveforms, `GeospatialIntelGallery`, `ROW1` (6 citizen cards) + `ROW2` (9 ops/citizen cards), `SCENARIOS` (nominal/storm/swarm-surge/gps-denied).
- **Components:** `Navbar`, `AnimatedCounter/Sparkline/Waveform`, `GeospatialIntelGallery`.
- **Data:** const rows/scenarios; `ops.scenario`, `intel.scenarioScore`.
- **Store/hooks:** `useTelemetrySocket`, `useApp/setQualityMode`, `useOps/setOps`, `useIntel/pushEvent`, `soundSynth`.
- **Interacts:** sets global scenario consumed by command/ops/simulation/alerts/twin.
- **Limits:** gallery images are open examples, not live tasking.

</details>

<details>
<summary><strong>/command — Master Command Deck</strong> <code>src/app/command/page.tsx</code></summary>

- **Purpose:** operator workstation: telemetry + triage + twin + timeline.
- **User sees:** tactical HUD, `StatusHeader`, `HudPanel`s, `AlertBanner`, `GeofenceBreachModal`, `AiDecisionTimeline`, `RadarSweep`, `FloodTimeline`, `GeospatialIntelGallery`, dynamic `DigitalTwinCanvas`, `DroneLeafletTracker`, `AiCoreScene`, sim ticker.
- **Data:** live `TelemetryPacket`, `ops.scenario/spillwayK`, `intel.scenarioScore`.
- **Store/hooks:** `useTelemetrySocket`, `useOps/ackAlert`, `useIntel/pushEvent`, `evaluateAlerts/incidentLevel`, `checkGeofenceBreach`, `setScenario(apiClient)`.
- **Limits:** values are simulated; triage acknowledges local state only.

</details>

<details>
<summary><strong>/safety — Citizen Safety</strong> <code>src/app/safety/page.tsx</code></summary>

- **Purpose:** “AM I SAFE? WHAT SHOULD I DO? WHERE DO I GO?”
- **User sees:** `RiskChecker`, advice phases, checklists.
- **Data:** `DEMO_HAZARDS`, `RISK_META` from `src/data/providers`; const `TYPES/ADVICE/PHASES`.
- **Store:** `useTelemetrySocket(connected)` for live badge, `useT` for language.
- **Limits:** demo hazard cells only; not an official warning.

</details>

<details>
<summary><strong>/location — Location Intel</strong> <code>src/app/location/page.tsx</code></summary>

- **Purpose:** search any place, inspect detail, overlay risk/facilities.
- **User sees:** dynamic `DroneLeafletTracker`, `CinematicShell`, `StatusHeader`, Google embed or keyless fallback.
- **Utils:** `searchPlaces/reverseGeocode/getLivePosition/haversineKm` (`geocode.ts`), `fetchGooglePlace` (`googlePlaces.ts`), `DEMO_FACILITIES/DEMO_HAZARDS`.
- **Limits:** Nominatim rate-limited; Google rich details require key; else graceful fallback.

</details>

<details>
<summary><strong>/alerts — Alert Center</strong> <code>src/app/alerts/page.tsx</code></summary>

- **Purpose:** WHAT/WHERE/WHEN/SEVERITY/ACTION stream.
- **Components:** `TrustBadge`, `CinematicShell`, `HudPanel`.
- **Data:** `DEMO_ALERTS` + live `evaluateAlerts()` from telemetry/scenario.
- **Store:** `useOps`, `useIntel/pushEvent/setLatestAlert`; Browser `Notification` opt-in.
- **Limits:** rule output, not government alerts.

</details>

<details>
<summary><strong>/emergency — Emergency Mode</strong> <code>src/app/emergency/page.tsx</code></summary>

- **Purpose:** big-target SOS with numbers, share, navigate, radar + timer.
- **Components:** `SosRadar`, `HudPanel`, `CinematicShell`.
- **Data:** `EMERGENCY_NUMBERS [112,101,108,100,1078]`, `DEMO_FACILITIES`.
- **Store:** `setSosPhase/pushEvent/resolveEvent` (mirrors phase+coords globally).
- **Limits:** frontend prototype; no automatic dispatch. See [Emergency](#-emergency--sos-system).

</details>

<details>
<summary><strong>/evacuate — Safe Evacuation</strong> <code>src/app/evacuate/page.tsx</code></summary>

- **Purpose:** shelters ≤30 km, exposure-ranked.
- **Utils:** `queryNearbyShelters` (Overpass), `pathExposure` (riskEngine), `getLivePosition/haversineKm`.
- **Modes:** fastest/safest/vehicle/walking with simulated speeds (32/24/30/5 km/h).
- **Limits:** straight-line exposure estimate; navigation handed to Google Maps links. See [Evacuation](#-evacuation-system).

</details>

<details>
<summary><strong>/twin — 3D Digital Twin</strong> <code>src/app/twin/page.tsx</code></summary>

- **Purpose:** topography + surge plane + air-drop demo.
- **Components:** dynamic `TwinViewport`, `FloodTimeline`.
- **State:** local `surgeM`, `terrain: satellite/grid`, spotlight, selection; live `alt/lat/lon/battery/signal`.
- **Limits:** procedural terrain, not surveyed DEM.

</details>

<details>
<summary><strong>/drones — Drone Swarm & SAR</strong> <code>src/app/drones/page.tsx</code></summary>

- **Purpose:** fleet radar + 3D swarm + Leaflet tracker.
- **Components:** dynamic `DroneSwarmScene`, `DroneLeafletTracker`, `RadarSweep`.
- **Data:** `packets` fleet max 8; const `PAYLOADS`; `?lat&lon&name` deep-link.
- **Limits:** simulated fleet from one backend stream + client fan-out.

</details>

<details>
<summary><strong>/ops — Operations Dashboard</strong> <code>src/app/ops/page.tsx</code></summary>

- **Purpose:** KPIs, spillway/scenario controls, health, demo console.
- **Components:** `DemoConsole`, `SystemHealth`, `Sparkline`.
- **Data:** `PEOPLE[scenario]`, `DEMO_FACILITIES`, `demoDroneProvider.fleet()`, `localStorage:drishti-reports`, live rule alerts + sim drill KPIs.
- **Limits:** drill KPIs are scenario math, not field counts.

</details>

<details>
<summary><strong>/simulation — What-If Copilot</strong> <code>src/app/simulation/page.tsx</code></summary>

- **Purpose:** spillway slider 5–80k cusecs, inundation formula, timeline.
- **Formula:** `inundation ≈ 30 + spillwayK × 1.1` (display model, not hydrology).
- **Actions:** `setScenario(apiClient)` + `setOps`; `AlertBanner` reacts at `>45k`.
- **Limits:** illustrative only.

</details>

### Additional routes (implemented)

| Route | File | What it does | Data/state |
|---|---|---|---|
| `/risk` | `app/risk/page.tsx` | GPS/manual risk + `RiskVisualizer` | `assessRisk`, shared `intel.risk/sos`, `toneForScore` |
| `/nearby` | `app/nearby/page.tsx` | Hospitals/police/fire/clinic/pharmacy | `queryNearbyHelp`, `getLivePosition`, demo fallback |
| `/report` | `app/report/page.tsx` | Incident submit → pipeline SUBMITTED→RESOLVED | `localStorage:drishti-reports`, `useLocalList/cleanText`, photo `<1.5MB` |
| `/family` | `app/family/page.tsx` | Demo profiles, I'M SAFE toggle | `localStorage:drishti-family`, manual sharing, no tracking |
| `/learn` | `app/learn/page.tsx` | BEFORE/DURING/AFTER + do/don’t, EN/TE/HI | `LEARN_TOPICS` (`data/learn.ts`) |
| `/plan`, `/kit` | `app/plan/page.tsx`, `app/kit/page.tsx` | 10-item checklists with progress | `Checklist`, `drishti-plan` / `drishti-kit` |
| `/shelter` | `app/shelter/page.tsx` | Kiosk check-in, 3 hardcoded nodes, caps | `SEED EV-1042/1043/1077` |
| `/resources` | `app/resources/page.tsx` | Hospital/ICU registry (4 demo) | const `ICU_REGISTRY`, `/api/v1/sensors` |
| `/recovery` | `app/recovery/page.tsx` | Audit ledger + Merkle-like `mockHash` chain | `SEED RL-001/002`, const sensors |
| `/reunion` | `app/reunion/page.tsx` | OP-MILAN match queue, name/camp/age heuristic | `SEED_FOUND:3/MISSING:2`, facial-model pending |
| `/talk` | `app/talk/page.tsx` | Voice assistant (Web Speech) + risk/facilities | `assessRisk/nearestFacilities`, `HOME 17.385,78.4867` |
| `/demo` | `app/demo/page.tsx` | 8-step story presenter, arrow-key stepping | `DEMO_PHASES`, `ops.demo.phase`, `DemoConsole/MissionReplay` |
| `/platform` | `app/platform/page.tsx` | 8 pillars, 5 hardware, agencies list | const `PILLARS/HARDWARE/AGENCIES` |
| `/portal` | `app/portal/page.tsx` | Low-bandwidth advisory (server comp.) | const corridors/trucks demo |
| `/sources` | `app/sources/page.tsx` | Free-now vs future plug-ins (server) | `LIVE_FREE:10`, `FUTURE:8` |

---

## 🎛️ Command Center deep explanation

### 3D AI Neural Core (`AiCoreScene.tsx`, 393 lines)

- **Stack:** vanilla `three@0.169` (`IcosahedronGeometry`, `TorusGeometry`, `Points`, `ShaderMaterial`, `FogExp2`, `PerspectiveCamera`), dynamic import `ssr:false`.
- **Objects:** emissive icosahedron core + wireframe lattice + additive pulse sphere + fresnel glow shell; 3 orbital torus rings; `N` octahedron nodes + `LineSegments`; particle shell; 2 expanding scan waves; `GridHelper` floor.
- **Animation:** `requestAnimationFrame` + `Clock(dt≤0.05)`; breathing pulse, ring speeds, orbiting nodes, drifting dust, wave expand/fade; `Color.lerp` tone transitions (`ok #00d2ff`, `warn #ffb020`, `critical #ff5470`).
- **Interaction:** click-drag rotation with velocity, mouse parallax, `radarPing` on press.
- **Purpose:** visualizes shared posture (`intelStore` tone), **not** model inference.

### Digital Elevation Twin (`DigitalTwin.tsx`, 326 lines)

- **Terrain:** `PlaneGeometry(8,8,res,res)` with hill `sin·cos`, river `-exp` carve, ridge `sin`; solid + wireframe contour + grid floor.
- **Water:** separate plane; `water.y → -0.45 + surgeM × 0.15`; emissive pulse with surge.
- **Drone:** `Group` chassis/dome/arms/nacelles/blades + open cone searchlight + beacon; rotors `15 (low) / 32 (high)` alternating; bob/roll/pitch drift; pointer parallax.
- **Purpose:** readable elevation + flood extent + air asset context.

### Holographic Earth (`CommandBackground.tsx`, 477 lines)

- Full-screen schematic globe (explicitly **not** a geographic projection) + data arcs + hazard pulses + dust + grid haze; `FogExp2`, cyan/rose/amber tones; props `intensity 0..1`, `tone`, `focusKind (sos|risk|null)` so SOS/risk refocus the scene.

### Tactical HUD

- `HudPanel`, `StatusHeader`, `CinematicShell`, `AnimatedCounter/Sparkline/Waveform/RadialGauge`, `RadarSweep`.
- Glassmorphism (`#051424/#081b2e` + blur), corner brackets, mono telemetry, live counters from `useTelemetrySocket`, posture badges from `incidentLevel` + `intelStore`.

---

## 🛸 Drone system

> **Simulated values, real plumbing.**

**Backend generation** (`backend/app/services/telemetry_engine.py`):

```python
base_lat, base_lon = 17.3850, 78.4867  # Hyderabad ref
lat = base + 0.02*sin(tick/12) + rand(±0.001)
lon = base + 0.02*cos(tick/15) + rand(±0.001)
alt_m = 120 + 10*sin(tick/8) + alt_noise
speed_ms = max(0, 18 + 4*sin(tick/10) + rand(±1))
battery_pct = max(0, 100 - tick*batt_drain)
signal_pct, temp_c, mode, drone_id = scenario-dependent
```

| Scenario | alt_noise | batt_drain/tick | signal | mode |
|---|---|---|---|---|
| nominal | ±15 | 0.02 | 75–99 | AUTO-MESH |
| storm | ±120 | 0.08 | 35–65 | AUTO-MESH |
| swarm-surge | ±30 | 0.05 | 70–98 | AUTO-MESH |
| gps-denied | ±50 | 0.04 | 5–25 | DEAD-RECKONING |

Packet: `id, tick, ts, scenario, drone_id (DRX-01..12), lat, lon, alt_m, speed_ms, battery_pct, signal_pct, temp_c, mode`. Default rate `TELEMETRY_HZ=2` (`backend/app/config.py`, overridable via env).

**Flow:**

```text
telemetry_engine.make_packet(tick, scenario)
        ↓
FastAPI WS /ws/telemetry (2 Hz) + REST snapshots
        ↓
useTelemetrySocket (reconnect + backoff, packets ≤50, live latest)
        ↓
intelStore / opsStore / local component state
        ↓
DroneLeafletTracker + DroneSwarmScene + command HUDs
```

Frontend (`src/hooks/useTelemetrySocket.ts`, 68 lines): `new WebSocket(url ?? getWsUrl())`, `onopen→connected`, `onclose→setTimeout(connect, min(1000·2^retry,10000))`, `onerror→close`, `onmessage→JSON.parse` (malformed ignored), newest-first cap 50. Fleet views fan the single stream into ≤8 markers.

**SAR concept:** search grid (`RadarMap` dashed polyline 5×5 step 0.02), target marker, swarm scene, battery/signal-gated alerts — coordination visualization, not autonomous flight control.

---

## 🗺️ Map & geolocation system

- **Libraries:** `leaflet@1.9.4` (+ `@types/leaflet`), CSS in `app/layout.tsx`; no react-leaflet/Mapbox/Cesium. `src/components/RadarMap.tsx` dynamic-imports Leaflet client-side.
- **Base layers:** OSM standard tiles + CartoDB dark variant (tactical); Esri World Imagery as satellite fallback for twin context.
- **Geocoding:** `src/utils/geocode.ts` — Nominatim `search?format=jsonv2` / `reverse`, `haversineKm (R=6371)`, `bearingDeg`, `compass16`, `toDMS`, `getLivePosition` (one-shot high-accuracy geolocation with permission/timeout messages).
- **POIs:** `src/utils/overpass.ts` — `queryNearbyHelp` (hospital/clinic/pharmacy/doctors/police/fire/ambulance, 6 km) + `queryNearbyShelters` (shelter/assembly_point, 30 km) via `GET https://overpass-api.de/api/interpreter`, 15 s abort, throws on failure so callers show demo fallback, caps 20.
- **Overlays:** `L.circle` hazard rings (pulse class if high/critical) + tooltips; SAR grid polylines; target markers; facility markers.
- **Google (optional):** keyless `maps.google.com/maps?q&output=embed` fallback; with `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, `embed/v1/place` + `fetchGooglePlace` (Place Search + FieldMask details: rating/hours/phone/website/photo/reviews) and `maps/dir` navigation links. Missing key throws `GOOGLE_KEY_MISSING`, UI degrades.

```text
Location (GPS/search)
        ↓
Map (Leaflet + tiles)
        ↓
Hazard information (demo cells + live alerts)
        ↓
Nearby resources (Overpass or demo)
        ↓
Safety / evacuation decisions
```

---

## 🧮 Risk engine

`src/utils/riskEngine.ts` (103 lines) — **deterministic rules, not ML.**

- **Inputs:** `(lat, lon)`; reads `DEMO_HAZARDS` (11 Krishna-basin + Hyderabad cells with `type/label/lat/lon/radiusKm/level/factors/confidence/source`).
- **Calculation:** `haversineKm` to each zone → keep `dist ≤ radius+15km` → sort by severity rank then distance → top `inside` else nearest → else `low`.
- **Output `RiskReport`:** `level (low/moderate/high/critical)`, `nearby[]`, `factors[]`, `confidence` (from zone, else 95), `assessedAt`, `action` (per-level guidance; critical: “Evacuate now via your safe route. Call 112…”).
- **Helpers:** `nearestFacilities(lat,lon,kind?,n=3)` sorted slice; `pathExposure(a,b)` samples straight line `clamp(ceil(km/2),8,60)` against zone radii → `{maxLevel, crossed, pathKm}`.
- **Consumed by:** `/safety`, `/risk` (+ `RiskVisualizer`), `/location`, `/evacuate` (destination ranking), `/talk`.
- **Limits:** demo coverage only; straight-line exposure ignores roads/water; confidence is authored, not calibrated.

---

## 🔔 Alert system

`src/utils/alertRules.ts` (105 lines) — pure, testable, no React.

| Condition | Severity | ID |
|---|---|---|
| `spillwayK > 45` (Prakasam critical discharge) | critical | `barrage-discharge` |
| `geofenceBreach` (outside Hyderabad polygon) | critical | `geofence-breach` |
| `scenario === 'storm'` | critical | `storm-cell` |
| `scenario === 'gps-denied'` | warning | `gps-denied` |
| `batteryPct < 20` | warning | `low-battery` |
| `signalPct < 30` | warning | `weak-link` |

Sorted critical → warning → info. `incidentLevel()` rolls up to `LEVEL-3 CRITICAL / LEVEL-2 ELEVATED / LEVEL-1 STABLE`.

**Lifecycle:**

```text
live telemetry + ops.scenario/spillwayK + geofence check
        ↓
evaluateAlerts(input) on render
        ↓
AlertBanner / alerts page / ops KPIs / StatusHeader badge
        ↓
opsStore.acked[] (acknowledge) + intelStore latestAlert/events
        ↓
optional Browser Notification (user opt-in)
```

Geofence (`geofenceDetection.ts`, 32 lines): ray-casting `isInsideGeofence`, default rectangle `17.3757,78.4669 ±0.05°`; breach = outside.

---

## 🆘 Emergency / SOS system

`src/app/emergency/page.tsx` (305 lines) + `intelStore.setSosPhase/pushEvent/resolveEvent` + `SosRadar`.

- **Flow:** `locate()` → `getLivePosition()` rounded to ~100 m → `sos: idle → locking → active` → elapsed `MM:SS` timer + radar pulse + red HUD → `tel:` links (`112/101/108/100/1078`), `navigator.share` fallback copy, Google Maps `dir` links to nearest facilities.
- **Broadcasting:** local only — mirrors `{phase, coords}` into `intelStore` so command/globe/AI-core/ticker react; **no network dispatch to responders**.
- **Safety notes:** rounding limits precision; requires geolocation permission + network for maps; always call local emergency numbers; prototype styling uses large touch targets for stress use.

---

## 🚗 Evacuation system

`src/app/evacuate/page.tsx` (223 lines) — **no routing engine; straight-line + map handoff.**

1. `locate()` → GPS fix → `queryNearbyShelters(lat,lon,30km)` (Overpass) + in-range `DEMO_FACILITIES` shelters → filter `distKm ≤ 30` → sort → top 10.
2. `pathExposure()` per destination → rank safest (lowest `maxLevel`, tie-break distance).
3. Mode cards adjust ETA via simulated speeds (fastest 32, safest 24, vehicle 30, walking 5 km/h) with explicit “simulated risk” notes.
4. “Navigate” opens Google Maps `dir/?api=1&origin&destination&travelmode`; shelter status from OSM tags or demo `status`.
5. **Limits:** ignores roads, closures, water, capacity; unreachable directory shows demo fallback with notice.

---

## 🛡️ Citizen safety system

| Feature | Flow | Implementation | Limits |
|---|---|---|---|
| MY SAFETY | Check risk + checklist | `RiskChecker`, `assessRisk` | demo cells |
| LIVE LOCATION | GPS + layers | Leaflet + geocode + hazards | permission-gated |
| ALERT CENTER | Stream + ack + notify | `evaluateAlerts`, `acked[]` | rules only |
| EMERGENCY MODE | SOS + share + navigate | `setSosPhase`, SosRadar | no dispatch |
| SAFE EVACUATION | Shelters ≤30 km + exposure | Overpass + `pathExposure` | straight-line |
| NEARBY HELP | Filter hospitals/police/fire | `queryNearbyHelp` + fallback | OSM completeness varies |
| FAMILY SAFETY | Profiles + I'M SAFE | `localStorage:drishti-family` | manual, no tracking |
| CITIZEN REPORTING | Form + photo + pipeline | `localStorage:drishti-reports`, `cleanText` | local only |
| DISASTER EDUCATION | BEFORE/DURING/AFTER | `data/learn.ts`, EN/TE/HI | static content |

---

## 🧠 AI / intelligence layer

> **No trained ML model exists in this repo.** “AI” here = deterministic scoring + shared posture + visualization.

| Intelligence component | Actual implementation | Purpose |
|---|---|---|
| Risk scoring | `riskEngine.assessRisk` (haversine + rank) | Citizen risk level + actions |
| Alert rules | `alertRules.evaluateAlerts` (6 thresholds) | Hazard alerts + LEVEL-1/2/3 |
| Scenario score | `intelStore.scenarioScore = min(100, 30+spillwayK·1.1 + storm?18:0)` | Ops posture 0–100 |
| Tone mapping | `toneForScore (>70 critical, >40 warn)`, `threatForScore` | Drive core/globe/badges |
| Event stream | `intelStore` (dedupe, sort, cap 30) + `AiDecisionTimeline` | Reviewable decision log |
| Reunion match | `nameOverlap/scoreCandidate` heuristic | Queue ranking; facial-model pending |
| 3D “AI core” | Three.js animation colored by tone | Visualize posture, not inference |
| Telemetry | Simulated packets + WS plumbing | Animate dashboards/maps/3D |
| External data | OSM/Overpass/Nominatim/tiles | Ground with open data |

Effective posture: `effectiveScore = SOS-active ? 100 : max(scenarioScore, riskScore)`; `aiTone = SOS ? critical : max(drillTone, riskTone)`; `focus = SOS coords ?? risk place`.

---

## 🗄️ State management

| Store | File | State | Actions | Consumers |
|---|---|---|---|---|
| `appStore` | `src/store/appStore.ts` (107) | `mode`, `lang`, `a11y{large,contrast,reduce}`, `qualityMode`, `soundEnabled` | `setApp/setA11y/setQualityMode/setSoundEnabled`, `useApp` | Navbar, A11yBar, 3D scenes, i18n |
| `opsStore` | `src/store/opsStore.ts` (176) | `scenario`, `spillwayK`, `acked[]`, `demo{id,phase}` | `setOps/ackAlert/startDemo/demoStep/demoGoto/stopDemo`, `useOps` | command/ops/simulation/demo/alerts |
| `intelStore` | `src/store/intelStore.ts` (266) | `scenarioScore`, `risk`, `sos`, `latestAlert`, `events[≤30]` | `setRiskResult/clearRisk/setSosPhase/setLatestAlert/pushEvent/resolveEvent`, `useIntel` | timeline, core, globe, alerts, risk |

`appStore` persists to `localStorage:drishti-app-v2` (lazy hydration, private-mode safe); `opsStore` in-memory (demo reset to `nominal/45`); `intelStore` pure score functions + external-store subscriptions (`useIntel` reads both ops+intel).

```text
UI event
  ↓
Store action (app/ops/intel)
  ↓
Subscribed components re-render
  ↓
Utils / APIs (risk, alerts, WS, Overpass)
  ↓
External services / backend
  ↓
UI update (HUD, map, 3D, timeline)
```

---

## 🪝 Hooks

| Hook | File | In → Out | Lifecycle | Used by |
|---|---|---|---|---|
| `useTelemetrySocket` | `hooks/useTelemetrySocket.ts` (68) | `url?` → `{packets[≤50], live, connected}` | connect on mount/url change; exponential backoff `min(1s·2^retry,10s)`; cleanup closes + clears timer | every live page |
| `useLocalList` | `hooks/useLocalList.ts` (44) | `(key, seed)` → `{items, add, update, remove, ready}` | load once, persist on change (200-item / 200 kB caps) | family, report, plan/kit checklists |
| `useT` | `i18n/dict.ts` | `key` → translated string (fallback EN→key) | reads `useApp().lang` | safety, emergency, learn, nav |
| `useElapsed` | `app/emergency/page.tsx` | `running` → `MM:SS` | 1 s interval, reset on stop | SOS timer |

---

## 🧰 Utilities

| Utility | Purpose | In → Out | Used by | Notes |
|---|---|---|---|---|
| `alertRules` | Hazard alerts | `AlertInput` → `Alert[]` sorted | command/alerts/ops/simulation | `DISCHARGE_LIMIT_K=45`; pure |
| `riskEngine` | Risk + exposure | `(lat,lon)` → `RiskReport`; path → `PathExposure` | safety/risk/location/evacuate/talk | rule-based; demo zones |
| `geofenceDetection` | Polygon check | `point` → breach bool | command/alerts | ray-casting; Hyd. rect |
| `overpass` | OSM POIs | `(lat,lon,r)` → `OsmPlace[]` | nearby/evacuate | 15 s abort; throws → demo |
| `apiClient` | Backend I/O | endpoint/scenario → JSON | hooks/command/ops/health | Bearer key; defaults localhost |
| `geocode` | Search/position/math | query/coords → `Place`/`GpsFix`/km | location/nearby/evacuate/emergency | Nominatim; high-accuracy GPS |
| `googlePlaces` | Rich place details | `(name,lat,lon)` → details | location | requires Maps key; FieldMask |
| `audioSynth` | Procedural sounds | event → oscillators | welcome/command toggles | Web Audio; no files; opt-in |

---

## 🌐 Internationalization

- `src/i18n/dict.ts` (88 lines): `DICT: Record<key, {en, te, hi}>` covering nav (25+ keys), modes, risk levels, emergency strings, common (`LIVE/DEMO/SIMULATION`).
- `t(lang,key)` falls back `DICT[key][lang] ?? en ?? key`; `useT()` binds current `useApp().lang`.
- Language switch persists via `appStore`; `/learn` and citizen flows are trilingual; Leaflet/OSM labels remain source-language.

---

## 🔊 Audio system

`src/utils/audioSynth.ts` (157 lines) — zero-dependency Web Audio:

- Lazy singleton `AudioContext` (+ `webkit` fallback), resumes if suspended.
- Gated by `localStorage['drishti-sound']=='1'` (default off) + `SoundToggle` UI.
- Events: `click` (sine 1040→420 Hz, 0.04 s), `radarPing` (1320 Hz, 0.22 s), `warningAlarm` (triangle 620+840 Hz), `scenarioChange` (C5/E5/G5 arpeggio), `telemetryChirp` (1760→2200 Hz, 0.03 s).
- No audio assets; autoplay-safe (created on user gesture); silent in SSR.

---

## 🧊 3D rendering architecture

- **No R3F:** direct `three` imperative scenes in `AiCoreScene`, `DigitalTwin`/`TwinViewport`/`DroneSwarmScene`, `CommandBackground`.
- **Pattern per scene:** `init (renderer/camera/lights/meshes)` → `rAF + Clock` loop → `IntersectionObserver` + `visibilitychange` park → `resize` handler → `dispose` (geometries/materials/renderer).
- **Cameras/lights:** `PerspectiveCamera(50–55°)`, ambient + directional + cyan point/fill, `FogExp2(#020b14)`.
- **Interaction:** drag-velocity rotation (core), pointer parallax (twin/background), click pings.
- **Resource guards:** `antialias:!weak`, `pixelRatio min(dpr, weak?1:1.75)`, particle/node counts by quality, `prefers-reduced-motion` → CSS fallback, dynamic `ssr:false` splits Three chunks.

---

## 🎚️ Quality modes

`appStore.qualityMode: high | medium | low` (+ legacy README names High/Balanced/Eco mapping to high/medium/low).

- **Detection** (`detectOptimalQuality`): `low` if reduced-motion OR mobile UA OR `cores≤2` OR `memory<4GB`; `medium` if `cores≤4` OR `memory<8GB`; else `high`.
- **Verified deltas:** AI core nodes `4/8/12`, particles `70/240/450`; twin grid `24/48`, rotors `15/32`; background pixel-ratio/antialias reduction.
- **Targets:** 60 fps high/medium, ~30 fps low (design goals, not benchmarked).
- **Switch:** quality switcher → `setQualityMode` → persisted in `drishti-app-v2`; scenes read `useApp().qualityMode` live.

---

## ⚡ Performance engineering

| Technique | Where | Why |
|---|---|---|
| Dynamic `import(..., {ssr:false})` | 3D scenes, Leaflet tracker | Keep Three/Leaflet out of initial bundle |
| `IntersectionObserver` | 3D canvases | Park rAF off-screen |
| Page Visibility API | All loops | Stop work when tab hidden |
| Adaptive quality | `appStore` + scenes | Match device capability |
| Reduced-motion / no-WebGL fallback | Scenes + CSS | Usable without GPU/animation |
| Lazy gallery images | `loading="lazy"` | Defer below-fold cost |
| Capped buffers | packets ≤50, events ≤30, lists ≤200 | Bound memory |
| Zero paid deps for core | maps/data/sound | Run keyless |

---

## 🖥️ Backend

`backend/` — **FastAPI `0.116.1` + `uvicorn[standard]` + Pydantic 2, Python 3.11** (per `Dockerfile`/CI).

```text
Frontend
  ↓
REST / WebSocket (Bearer key, except open health/sensors)
  ↓
FastAPI (CORS open + localhost default, TELEMETRY_HZ=2)
  ↓
telemetry_engine / connection_manager / routers
  ↓
JSON packets → frontend stores
```

| Method + path | Auth | Behavior |
|---|---|---|
| `GET /api/health` | open | `{ok, service:drishti-telemetry, scenario}` |
| `GET /api/telemetry` | Bearer | `make_packet(tick=0, current_scenario)` |
| `POST /api/scenario` | Bearer | Validate `nominal\|storm\|swarm-surge\|gps-denied`, mutate global, else 400 |
| `WS /ws/telemetry` | none | `accept` loop `send_json(make_packet(tick++))`, `sleep(1/HZ)` |
| `GET /api/v1/health` | open | `{ok, service, api:v1}` |
| `GET /api/v1/telemetry` | Bearer | `make_packet(tick=0)` |
| `GET /api/v1/drones` | Bearer | `{drones: [packets ×3]}` |
| `GET /api/v1/sensors` | open | Static thermal + AQI readings |
| `POST /api/v1/scenario` | Bearer | Echo `{ok, scenario}` (no global mutation/validation) |
| `WS /ws/telemetry-v1` | none | Broadcast via `ConnectionManager` |

- **Startup:** `uvicorn app.main:app --host 0.0.0.0 --port 8000`; Docker `python:3.11-slim`, `EXPOSE 8000`, `${PORT:-8000}`; compose runs backend + frontend dev with shared dev key.
- **Auth:** `HTTPBearer` vs `GATEWAY_KEY` (`drishti-mesh-dev-key-2025` default); frontend sends `Authorization: Bearer` via `apiClient`.

---

## 🔌 API documentation

| API / Service | Purpose | Key | Used by |
|---|---|---|---|
| `WS /ws/telemetry` | Live packets @2 Hz | No (local trust) | `useTelemetrySocket` |
| `GET /api/telemetry`, `/api/v1/telemetry`, `/api/v1/drones` | Snapshots | Bearer `GATEWAY_KEY` | `fetchTelemetryData`, resources |
| `POST /api/scenario`, `/api/v1/scenario` | Scenario injection | Bearer | command/simulation |
| `GET /api/health`, `/api/v1/health`, `/api/v1/sensors` | Health + demo sensors | No | `SystemHealth`, resources |
| Nominatim search/reverse | Geocode | No | `geocode.ts`, location |
| Overpass interpreter | POIs/shelters | No | `overpass.ts` |
| OSM / CartoDB tiles | Base maps | No | `RadarMap` |
| Esri World Imagery | Satellite fallback | No | twin context |
| Google Maps embed / Places / Dir | Rich place + navigation | Optional `GOOGLE_MAPS_KEY` | location/evacuate/emergency |
| OpenWeatherMap | Weather alerts (documented) | Optional `OWM_KEY` | Degrades gracefully; no hard dependency |
| NASA EO / Unsplash | Gallery examples | No | `GeospatialIntelGallery` |
| Web Speech / Notify / Geolocation | Voice, notify, GPS | Permission-gated | talk/alerts/safety |

Only the above are referenced in code; no other vendor APIs are required.

---

## 🌍 External services

| Service | Why / where | Key? | If unavailable |
|---|---|---|---|
| OpenStreetMap | Base tiles (`RadarMap`) | No | Map blank; overlays remain |
| CartoDB | Dark tactical variant | No | Falls back to OSM |
| Overpass | Hospitals/shelters/POIs | No | Demo facilities shown + notice |
| Nominatim | Search/reverse | No (rate-limited) | Manual coords; error message |
| Esri World Imagery | Satellite fallback | No | Grid/standard tiles |
| NASA EO | Educational flood imagery | No | Gallery gradients |
| Unsplash | Gallery examples | No | Fallback gradients |
| Google Maps/Places | Embeds, rich details, `dir` links | Optional billing key | Keyless embed; `GOOGLE_KEY_MISSING` → fallback text |
| OpenWeatherMap | Documented weather alerts | Optional | Feature degrades; core works |
| Browser Geolocation/Speech/Notify/SW | GPS, voice, notify, offline | Permission | Guided errors; demo coords |

---

## 🔐 Environment variables

> Source of truth is code + `*.example`. Never commit real secrets.

| Variable | Required? | Purpose | Default |
|---|---|---|---|
| `NEXT_PUBLIC_WS_URL` | Optional | Frontend WS URL | `ws://localhost:8000/ws/telemetry` |
| `NEXT_PUBLIC_API_BASE` | Optional | Frontend REST base (code name; historic docs said `API_URL`) | `http://localhost:8000` |
| `NEXT_PUBLIC_GATEWAY_KEY` | Optional locally, required to match backend | Bearer for REST | `drishti-mesh-dev-key-2025` |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Optional | Rich Places + embeds (historic docs said `GOOGLE_PLACES_KEY`) | empty → keyless fallback |
| `NEXT_PUBLIC_OWM_KEY` | Optional | Documented weather key | empty → degrades |
| `GATEWAY_KEY` (backend) | Required to match frontend in shared deploys | Backend bearer | `drishti-mesh-dev-key-2025` |
| `CORS_ORIGINS` | Optional | Allowed origins (code appends `*`) | `http://localhost:3000` |
| `TELEMETRY_HZ` | Optional | Packets/sec | `2` |

```env
# .env.local.example (frontend)
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/telemetry
NEXT_PUBLIC_GATEWAY_KEY=CHANGE_ME_must_match_backend_GATEWAY_KEY
# NEXT_PUBLIC_GOOGLE_MAPS_KEY=
```

```env
# backend/.env.example
GATEWAY_KEY=CHANGE_ME_set_a_long_random_value_here
CORS_ORIGINS=http://localhost:3000
TELEMETRY_HZ=2
```

> ⚠️ **Never commit real keys.** `.env*.local` and backend `.env` are gitignored. `NEXT_PUBLIC_*` ships to the browser — public by design, so use only publishable keys there.

---

## 🗂️ Complete project structure

```text
drishti-ai-command-center/
├── src/app/                  # 28 page.tsx routes; / redirects to /welcome
│   ├── welcome/ command/ safety/ location/ alerts/ emergency/ evacuate/
│   ├── twin/ drones/ ops/ simulation/ risk/ nearby/ report/ family/
│   ├── learn/ plan/ kit/ shelter/ resources/ recovery/ reunion/ talk/
│   ├── demo/ platform/ portal/ sources/ + layout.tsx, globals.css, error/loading
├── src/components/
│   ├── cinematic/            # AiCoreScene, CommandBackground, BootSequence,
│   │                         # GeospatialIntelGallery, AiDecisionTimeline,
│   │                         # HudPanel, RadarSweep, SosRadar, DemoMode, ...
│   ├── 3d/ three/ maps/      # TwinViewport, DroneSwarmScene, DroneLeafletTracker
│   ├── dashboard/ alerts/ layout/ # HeaderBar, LiveTelemetryTable, AlertBanner,
│   │                              # GeofenceBreachModal, Navbar
│   ├── RadarMap.tsx          # Leaflet map primitive
│   ├── A11yBar.tsx MobileQuickBar.tsx EmergencyFab.tsx OfflineBanner.tsx
│   └── RiskChecker.tsx ArchitectureDiagram.tsx DemoConsole.tsx MissionReplay.tsx
├── src/store/                # appStore, opsStore, intelStore
├── src/hooks/                # useTelemetrySocket, useLocalList
├── src/utils/                # apiClient, alertRules, riskEngine, geofenceDetection,
│                             # overpass, geocode, googlePlaces, audioSynth
├── src/i18n/dict.ts          # EN/TE/HI dictionary + useT
├── src/data/                 # providers.ts (demo hazards/facilities/alerts),
│                             # learn.ts
├── backend/
│   ├── app/main.py           # FastAPI entry, CORS, scenario global, routers
│   ├── app/config.py         # GATEWAY_KEY, CORS, TELEMETRY_HZ
│   ├── app/telemetry.py      # re-export engine
│   ├── app/services/         # telemetry_engine, connection_manager
│   ├── app/models/ routers/  # packets, sensors, api_v1, ws_telemetry
│   ├── requirements.txt Dockerfile tests/test_api.py .env.example
├── public/                   # poster.jpg, icon.svg, manifest.json, sw.js
├── docs/screenshots/README.md# real-capture contribution guide (no PNGs committed)
├── docker-compose.yml vercel.json next.config.js
└── .github/workflows/        # deploy.yml, pr-check.yml
```

Key files: `app/welcome|command/page.tsx` (composition), `DigitalTwin.tsx` + `cinematic/AiCoreScene.tsx` (3D), `intelStore.ts` (posture), `telemetry_engine.py` (simulation), `RadarMap.tsx` (maps).

---

## 🔀 Data flow

### Application flow

```text
User
 ↓
Next.js route (src/app/*/page.tsx)
 ↓
React component (components/*)
 ↓
Store / hook (app/ops/intel + useTelemetrySocket/useLocalList)
 ↓
Utility / API (risk, alerts, geocode, overpass, apiClient)
 ↓
External service / backend
 ↓
UI update (HUD, map, 3D, timeline)
```

### Telemetry flow

```text
telemetry_engine (simulated source)
 ↓
FastAPI WS /ws/telemetry @2Hz
 ↓
useTelemetrySocket (reconnect, cap 50)
 ↓
Stores (live packet + scenario)
 ↓
Dashboard + DroneLeafletTracker + 3D swarm
```

### Safety flow

```text
Location (GPS/search)
 ↓
Hazard data (DEMO_HAZARDS + live alerts)
 ↓
riskEngine.assessRisk
 ↓
alertRules.evaluateAlerts
 ↓
Safety UI (risk, alerts, nearby)
 ↓
Evacuation / Emergency tools
```

---

## 🧭 User flows

### Citizen (implemented; data simulated where noted)

Open `/welcome` → `/safety` check → enable location → `/location` hazards → `/nearby` help → `/alerts` subscribe → `/evacuate` shelter ≤30 km → `/emergency` SOS if needed → `/report` field update → `/family` mark safe → `/learn` guidance.

### Operator (implemented; drill-oriented)

Open `/command` → inspect telemetry/map → `/twin` surge → `/drones` swarm → `/simulation` raise spillway → review `LEVEL` + timeline → `/ops` ack + health → `/demo` replay story.

---

## 🎮 Scenario simulator

Shared `opsStore.scenario` + backend `_current_scenario` (via `setScenario`); `intelStore.scenarioScore` and 3D/telemetry/alerts react.

| Scenario | Purpose | What changes (verified) |
|---|---|---|
| Nominal | Baseline | alt ±15, drain 0.02, sig 75–99, AUTO-MESH |
| Monsoon Surge (`storm`) | Flood discharge drill | alt ±120, drain 0.08, sig 35–65, critical storm alert, surge plane rises |
| Swarm SAR (`swarm-surge`) | Multi-drone search | alt ±30, drain 0.05, sig 70–98, fleet emphasis |
| GPS-Denied | Degraded nav | alt ±50, drain 0.04, sig 5–25, DEAD-RECKONING + warning |

`DEMO_SCRIPTS` maps 7 demo phases to scenario+spillway presets; `spillwayK>45` fires barrage critical.

---

## 🔒 Security

- `NEXT_PUBLIC_*` are browser-public; never put private keys there.
- REST guarded by `GATEWAY_KEY` Bearer; WS endpoints unauthenticated (local-trust prototype) — do not expose WS without a proxy/auth in production.
- Backend `CORS` appends `*` in code — tighten `CORS_ORIGINS` for any shared deploy.
- Location rounded to ~100 m before display/share in emergency/evacuate; still sensitive — share deliberately.
- Incident/family data lives in `localStorage` only (per-browser, unencrypted).
- Prototype is **not** production-hardened: no rate limits, audit log, RBAC, or encrypted dispatch.

---

## ♿ Accessibility

Implemented (`A11yBar`, `layout`, emergency design):

- Skip-to-content link, `sr-only` helpers, semantic `main`/`h1`.
- Toggles set `html.a11y-large / a11y-contrast / a11y-still` (persisted via `appStore`); respects OS reduced-motion on load.
- `readAloud()` via `speechSynthesis` (first 1200 chars of `main`).
- Emergency big targets, high-contrast cyan/rose/amber on navy.
- Gaps: canvas scenes lack text equivalents; status is color+text (keep text); no full WCAG audit; Leaflet keyboard map limited; voice requires browser support.

---

## 📱 Responsive design

- Tailwind `sm/md` grids (`grid-cols-1 sm:grid-cols-2`), `p-4 max-w-3xl` citizen pages, `pb-14 md:pb-0` for mobile bar clearance.
- `MobileQuickBar` + `EmergencyFab` on small screens; `Navbar` splits public/command lists with compact overflow.
- 3D auto-`low` on mobile UA / low cores/memory; `pixelRatio≤1`, reduced geometry.
- HUD panels stack vertically; tables scroll; maps remain touch-draggable.
- Verified pattern, not device-lab certified — test on target phones before field claims.

---

## 🖼️ Platform preview

Shipped assets only — no fabricated screenshots:

![DRISHTI-X poster](public/poster.jpg)

- `public/poster.jpg` — hero poster (also OG/Twitter image via `layout.tsx`).
- `public/icon.svg` — cybernetic-eye favicon.
- `docs/screenshots/` — contribution guide only; add real `welcome/command/twin/drones/simulation/...` captures (1280×800, <500 kB) and reference them here once committed.

---

## 📦 Installation

### Prerequisites

- Node.js 18+ (CI uses 20), npm 9+
- Python 3.11 for backend (optional but recommended for live telemetry)
- Modern browser with WebGL + Geolocation permission for full experience

```bash
# 1. Clone
git clone https://github.com/hemanthhemanth1834-bit/drishti-ai-command-center.git
cd drishti-ai-command-center

# 2. Install frontend
npm install

# 3. Configure (all optional — runs keyless)
cp .env.local.example .env.local
# edit .env.local to match backend GATEWAY_KEY if running backend

# 4. Dev
npm run dev
# http://localhost:3000
```

```bash
# Production build
npm run build
npm run start

# Checks
npm run lint
npm run typecheck
```

```bash
# Optional backend (live WS)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
# WS ws://localhost:8000/ws/telemetry
# Health http://localhost:8000/api/health
```

Docker alternative:

```bash
docker build -t drishti-backend ./backend
# or
docker compose up --build
```

---

## 🛠️ Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `npm install` fails | Node <18 / cache | Use Node 20, `npm cache clean --force`, delete `node_modules` + `package-lock` reinstall |
| `npm run build` fails | Type/ESLint | Run `npm run typecheck`, `npm run lint`; fix reported file |
| Blank 3D / fallback shown | No WebGL / reduced-motion | Try Chrome/Edge, enable hardware accel, disable reduced-motion to test |
| `connected: false` forever | Backend down / wrong WS URL | Start backend, verify `NEXT_PUBLIC_WS_URL`, check `/api/health` |
| `401` on telemetry/scenario | Key mismatch | Match `NEXT_PUBLIC_GATEWAY_KEY` ↔ backend `GATEWAY_KEY` |
| Geolocation error | Permission denied / insecure context | Allow location, use localhost/HTTPS |
| Overpass empty/timeout | Rate limit / offline | Retry; demo fallback is expected |
| Google details missing | No Maps key | Set `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, redeploy; else keyless embed |
| Mobile jank | High quality on weak GPU | Switch to Eco/low; close tabs |
| Backend port busy | 8000 taken | Change `--port` + `NEXT_PUBLIC_*` URLs |

---

## 🌐 Deployment

- **Frontend live:** https://drishti-ai-command-center.vercel.app/ via Vercel + `vercel.json` (frontend service root `.`, backend entry `app.main:app`, `/api/backend/*` rewrite).
- **CI:** `.github/workflows/pr-check.yml` (typecheck+lint+compile) and `deploy.yml` (frontend build + backend pytest/compile + Docker build) on push/PR.
- **Manual:** `npm run build` then `vercel --prod`; set `NEXT_PUBLIC_*` in Vercel → Settings → Environment Variables.
- **Backend:** not served from the Vercel static URL alone — host FastAPI separately (Docker/VM), set CORS to your domain, point frontend envs at `https://<api>` / `wss://<api>/ws/telemetry`. WS needs sticky sessions/proxy support.

---

## 🧪 Testing

### Current testing status

- **Backend: 8 tests in `backend/tests/test_api.py`** (`TestClient(app)`, `GATEWAY_KEY=test-key-123`): open health checks, 401-without-key guards, authed telemetry shape (fields + lat/lon/battery ranges), drones list, scenario round-trip (`storm→200`, invalid→400, reset nominal), WS frame contains `drone_id+tick`, open sensors, v1 scenario guard.
- Run: `cd backend && pip install -r requirements.txt && python -m pytest -q`.
- **Frontend: no automated test suite** in this repo. Verification is `tsc --noEmit` + `next lint` + `next build` (CI-enforced).
- No invented coverage: add Vitest/Playwright + backend load tests before production claims.

---

## ⚠️ Limitations

- Prototype/demo: telemetry, hazards, facilities, ICU, shelters seeds, and gallery are simulated or open examples.
- No trained ML, no accuracy metrics, no live satellite tasking, no dispatch integration.
- Straight-line evacuation exposure; navigation delegated to Google Maps links.
- OSM/Nominatim/Overpass subject to availability and rate limits.
- Requires geolocation permission + WebGL-capable browser for full fidelity.
- LocalStorage-only persistence; multi-device/agency sync is roadmap, not present.
- Security/CORS/auth are dev-grade.

Stating limits is intentional — it makes evaluation and extension easier.

---

## 🗺️ Future roadmap

Planned only — not implemented:

- [ ] Copernicus Sentinel imagery integration
- [ ] WebRTC peer-to-peer drone video
- [ ] PWA push notification alerts
- [ ] Multi-agency collaboration room (shared WS state)
- [ ] Citizen AI chatbot (local open-source LLM)
- [ ] React Native / Expo companion app
- [ ] Bharat GNSS / NavIC positioning

---

## 🤝 Contributing

```bash
# 1. Fork, then
git clone https://github.com/<you>/drishti-ai-command-center.git
cd drishti-ai-command-center
git checkout -b feat/<short-name>

# 2. Change + verify
npm install
npm run typecheck
npm run lint
npm run build
cd backend && python -m pytest -q

# 3. Push + PR against main with screenshots for UI changes
```

Keep PRs scoped; document simulated vs real in descriptions; add real captures to `docs/screenshots/` when touching routes.

---

## 📄 License

This project is open-source for educational and hackathon purposes.

---

## 👨‍💻 Author

**Muchakarla Hemanth Kumar**
AI Engineer · Full-Stack Developer

📧 hemanthhemanth1834@gmail.com
🔗 [GitHub](https://github.com/hemanthhemanth1834-bit)

---

## ⭐ Why DRISHTI-X

Deterministic intelligence logic + geospatial systems + 3D visualization + WebSocket telemetry + citizen safety + operator workflows + modern Next.js/FastAPI architecture — in one inspectable prototype with honest simulated-vs-real boundaries and a clear path to Sentinel, WebRTC, push, multi-agency, chatbot, mobile, and NavIC next.

*DRISHTI-X — For a Safer, Stronger, Resilient India 🇮🇳*
