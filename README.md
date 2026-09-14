<div align="center">

# 🛰️ DRISHTI-X

### **Cinematic 3D Disaster Intelligence & Emergency Response Command Center**

**Detect • Analyze • Alert • Evacuate • Respond • Rescue • Recover**

A unified disaster-intelligence platform that connects **citizen safety, risk intelligence, emergency response, drone SAR, hospitals, shelters, geospatial intelligence, 3D digital twins, flood simulation, AI decision support, and recovery operations** into one connected command experience.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?logo=three.js)](https://threejs.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-OpenStreetMap-green?logo=leaflet)](https://leafletjs.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PWA](https://img.shields.io/badge/PWA-Offline-purple)](https://web.dev/progressive-web-apps/)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG-orange)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Multilingual](https://img.shields.io/badge/i18n-EN%20%7C%20TE%20%7C%20HI-hotpink)](#-accessibility--localization)
[![No Paid Dependencies](https://img.shields.io/badge/Paid%20Dependencies-None-brightgreen)](#-technology-stack)

<br/>

### 🌐 Live Experience

**[🚀 LIVE DEMO](https://drishti-ai-command-center.vercel.app/welcome)**
**[🛰️ COMMAND CENTER](https://drishti-ai-command-center.vercel.app/command)**
**[🛡️ CITIZEN SAFETY](https://drishti-ai-command-center.vercel.app/safety)**
**[🎬 DEMO MODE](https://drishti-ai-command-center.vercel.app/demo)**
**[💻 SOURCE CODE](https://github.com/hemanthhemanth1834-bit/drishti-ai-command-center)**

<br/>

**Current Release: V3.2 — Cinematic Presentation Mode**

</div>

---

# 🌍 What is DRISHTI-X?

DRISHTI-X is a **cinematic 3D disaster intelligence and emergency-response command center** designed to demonstrate how fragmented disaster information can be transformed into one connected operational workflow.

Instead of presenting isolated dashboards, DRISHTI-X connects:

```text
SENSORS
   ↓
DETECTION
   ↓
RISK ANALYSIS
   ↓
ALERT GENERATION
   ↓
GEOINT
   ↓
AI DECISION SUPPORT
   ↓
DRONE SAR
   ↓
HOSPITAL / SHELTER RESPONSE
   ↓
EVACUATION
   ↓
RESCUE
   ↓
RECOVERY & AUDIT
```

The platform contains two complementary experiences:

### 🛡️ Citizen Experience

Designed around:

> **Am I safe? What happened? What should I do? Where should I go? How do I get help?**

### 🛰️ Command Experience

Designed around:

> **What is happening? Where? How severe is it? Who is affected? What should responders do next?**

---

# 🎯 The Problem

Disaster response information is frequently fragmented across:

* Weather information
* Maps
* Sensor systems
* Emergency teams
* Hospitals
* Shelter registries
* Rescue operations
* Citizen reports
* Communication channels

This creates two major problems:

### For citizens

Information can become difficult to understand during a crisis.

### For operators

Important information can exist in disconnected systems that do not share a common operational state.

---

# ⚡ The DRISHTI-X Approach

DRISHTI-X introduces a unified intelligence layer:

```text
┌────────────────────────────────────────────┐
│              DRISHTI-X                    │
├────────────────────────────────────────────┤
│                                            │
│  DETECT → ANALYZE → ALERT → RESPOND       │
│                       ↓                    │
│             EVACUATE → RESCUE             │
│                       ↓                    │
│                    RECOVER                 │
│                                            │
└────────────────────────────────────────────┘
```

The system deliberately distinguishes:

* 🟢 LIVE data
* 🟡 DEMO data
* 🔵 SIMULATION output
* 🟣 LOCAL device data
* ⚪ OFFLINE cached data

This prevents simulated demonstrations from being mistaken for official emergency information.

---

# 🚀 Current Release — V3.2

DRISHTI-X has evolved through several major architectural milestones.

| Version  | Focus                | Major Achievement                                                      |
| -------- | -------------------- | ---------------------------------------------------------------------- |
| **V2**   | Cinematic Foundation | 3D AI Core, SOS Radar, Risk Visualizer, cinematic HUD                  |
| **V2.5** | Visual & UX Polish   | Lighting, transitions, boot sequence, status ticker, responsive design |
| **V3**   | Intelligence Layer   | Shared real-time intelligence state across the application             |
| **V3.1** | Explainability       | AI Decision Timeline based on shared intelligence events               |
| **V3.2** | Presentation         | Guided cinematic presentation mode using the real application engine   |

### Current production commit

```text
48e07f8
feat: V3.2 cinematic presentation mode —
guided demo story on shared intel state
```

---

# 🧠 V3 — Shared Intelligence Architecture

The most important architectural change in V3 is the introduction of a centralized intelligence state.

```text
                 ┌─────────────────────┐
                 │    INTELLIGENCE     │
                 │       STORE         │
                 └──────────┬──────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
       RISK STATE         SOS STATE       ALERT STATE
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │  DERIVED SYSTEM     │
                 │      STATE          │
                 ├─────────────────────┤
                 │ Effective Score     │
                 │ AI Tone             │
                 │ Threat Level        │
                 │ Focus               │
                 └──────────┬──────────┘
                            │
          ┌─────────────────┼──────────────────┐
          ▼                 ▼                  ▼
       AI CORE           GLOBE             TIMELINE
          │                 │                  │
          └─────────────────┼──────────────────┘
                            ▼
                    COMMAND CENTER
```

The V3 intelligence layer stores and derives:

* Risk snapshot
* Risk score
* Risk level
* Confidence
* Location
* Coordinates
* SOS phase
* SOS coordinates
* SOS timestamp
* Latest alert
* Intelligence events
* AI tone
* Threat level
* Focus state
* Effective score

The event stream is capped at **30 session-scoped events**.

---

# 📊 V3.1 — AI Decision Timeline

V3.1 introduces a visible operational timeline.

Instead of simply saying:

```text
AI ONLINE
```

DRISHTI-X can expose the sequence of system events:

```text
SENSOR DATA RECEIVED
        ↓
RISK ANALYSIS COMPLETED
        ↓
THREAT ALERT PROCESSED
        ↓
EMERGENCY RESPONSE ACTIVATED
        ↓
SYSTEM STATE UPDATED
        ↓
NETWORK STATE UPDATED
```

### Event types

| Event     | Meaning                      |
| --------- | ---------------------------- |
| `SENSOR`  | Sensor intelligence received |
| `RISK`    | Risk analysis completed      |
| `ALERT`   | Threat alert processed       |
| `SOS`     | Emergency response activated |
| `SYSTEM`  | System state changed         |
| `NETWORK` | Network state changed        |

Each event can expose relevant:

* Timestamp
* Severity
* Source
* Location
* Coordinates
* Status
* Additional event details

The timeline is designed to make AI activity **observable and explainable**.

---

# 🎬 V3.2 — Cinematic Presentation Mode

V3.2 introduces a dedicated presentation layer.

The objective is to allow a judge, recruiter, stakeholder, or audience member to understand the complete DRISHTI-X workflow in approximately **30 seconds**.

```text
INIT
 ↓
DETECTION
 ↓
GEOINT
 ↓
RISK
 ↓
ALERT
 ↓
RESPONSE
 ↓
SOS
 ↓
RECOVERY
 ↓
MISSION COMPLETE
```

### Presentation controls

* ▶ Play
* ⏸ Pause
* ⏮ Previous
* ⏭ Next
* ↻ Restart
* ✕ Exit
* Progress indicators
* Scene progress bar
* Keyboard shortcut: `P`

---

# 🎥 V3.2 Presentation Sequence

| Scene            | Approx. Duration | Purpose                          |
| ---------------- | ---------------: | -------------------------------- |
| Initialization   |             2.5s | Establish system state           |
| Detection        |             3.5s | Introduce incident               |
| Geoint           |             3.5s | Establish location/context       |
| Risk             |             4.5s | Show intelligence analysis       |
| Alert            |             3.5s | Convert analysis into alert      |
| Response         |             3.5s | Demonstrate coordination         |
| SOS              |             5.5s | Demonstrate emergency escalation |
| Recovery         |             3.5s | Show stabilization               |
| Mission Complete |                — | Conclude the story               |

---

# 🧬 Real Engine, Not a Separate Fake Demo

A key V3.2 architectural principle is:

> **Demo Mode orchestrates the existing engine instead of creating a separate fake application.**

Conceptually:

```text
                 DEMO CONTROLLER
                        │
                        ▼
                EXISTING ENGINE
                        │
                        ▼
                INTELLIGENCE STORE
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
      AI CORE          GLOBE          TIMELINE
        │               │                │
        └───────────────┼────────────────┘
                        ▼
                 COMMAND CENTER
```

This means the presentation demonstrates the same system architecture used by the application.

---

# 🚨 SOS Safety Model

The V3.2 presentation includes a simulated SOS sequence.

```text
IDLE
 ↓
LOCKING
 ↓
ACTIVE
 ↓
RECOVERY
```

Demo Mode does **not**:

* Place emergency calls
* Dispatch emergency services
* Contact real responders
* Send real emergency notifications
* Claim simulated coordinates are live rescue coordinates

The presentation is clearly labeled as simulation/demo content.

---

# 🛰️ Cinematic 3D Command Environment

DRISHTI-X uses procedural 3D visualization to create an immersive command-center experience.

### 🌐 Holographic Earth

Includes:

* Rotating globe
* Atmospheric shell
* Latitude/longitude grid
* Data arcs
* Hazard pulses
* Orbital traces
* Drone orbiters
* Adaptive particles

### 🧠 AI Core

Includes:

* 3D energy core
* Orbital rings
* Data nodes
* Neural connections
* Particle shell
* Lattice structure
* Energy pulses
* Dynamic lighting
* Threat-reactive visual tone

### 🖥️ HUD System

Includes:

* Glass panels
* Corner ticks
* Status indicators
* Severity states
* Hover/focus states
* Cinematic transitions

### 📡 Radar

Includes:

* Radar sweep
* Contact pulses
* Signal indicators
* Coordinate display
* Contact trails

---

# 🛰️ Drone Swarm & Search-and-Rescue

Route:

```text
/drones
```

The drone environment provides a cinematic SAR simulation containing:

* Procedural drone models
* Formation flight
* Navigation lights
* Telemetry rings
* Signal discs
* FLIR cones
* Motion trails
* SAR search grid
* Radar
* Target detection sequence

Detection sequence:

```text
SCAN
 ↓
ANALYZING
 ↓
TARGET DETECTED
```

The detection output can display:

* Target ID
* Coordinates
* Confidence
* Distance
* ETA
* Thermal signature

All drill outputs are explicitly marked **SIMULATION**.

---

# 🏙️ 3D Digital Twin

Route:

```text
/twin
```

The digital twin represents a procedural disaster-response environment.

Features include:

* Terrain
* Animated river
* River shimmer
* Roads
* Bridges
* Emergency corridors
* Procedural buildings
* Window strips
* Hazard markers
* Response vehicles
* Drone telemetry
* Spotlight cone
* Flood-surge plane
* Interactive entity selection
* Satellite/grid modes
* Flood forecast driver

---

# 🌊 Flood Simulation

Route:

```text
/simulation
```

The simulation provides a cinematic flood-progression experience:

```text
T-0h
 ↓
T+1h
 ↓
T+3h
 ↓
T+6h
 ↓
T+12h
 ↓
T+24h
```

The interface can visualize:

* Water expansion
* Affected zones
* Population impact
* Roads
* Buildings
* Hospitals
* Shelters
* Evacuation zones

Impact framing:

```text
BEFORE
   ↓
SIMULATION
   ↓
AFTER
```

---

# 🧠 Hydra-Net AI Decision Support

Route:

```text
/command
```

The AI decision-support panel demonstrates:

```text
ANALYZING
     ↓
INFERENCE COMPLETE
     ↓
RECOMMENDATION
     ↓
RESPONSE
```

The panel can present:

* Confidence
* Recommended intervention
* Reasoning
* Affected population
* Resource requirement
* Response ETA
* Risk state
* Dispatch recommendation

All simulated model outputs are labeled accordingly.

---

# 🏥 Hospital Intelligence

Route:

```text
/resources
```

Features include:

* ICU availability
* Ventilator availability
* Oxygen capacity
* ECG visualization
* SpO₂ waveform
* Respiratory waveform
* Triage states
* Field-sensor buffer
* Ambulance → ICU pairing

States:

```text
CRITICAL
WARNING
STABLE
```

Demonstration medical values are clearly labeled as demo data.

---

# 🏕️ Shelter Intelligence

Route:

```text
/shelter
```

Provides:

* Shelter capacity
* Occupancy
* Available spaces
* ETA
* Risk
* Status
* Capacity rings
* Check-in scanner
* Family reunification cross-match

---

# 🧾 Recovery & Audit

Route:

```text
/recovery
```

Recovery operations include:

```text
EVENT
 ↓
TIME
 ↓
ACTION
 ↓
RESPONDER
 ↓
RESULT
 ↓
STATUS
```

The module also demonstrates:

* Relief ledger
* Running totals
* Structural diagnostics
* Post-disaster assessment
* Audit-oriented visualization

---

# 📣 Citizen Reporting

Routes:

```text
/report
/portal
```

Supported simulated incident categories include:

* Flood
* Trapped person
* Blocked road
* Fire
* Medical emergency
* Missing person

Priority:

```text
LOW
 ↓
MEDIUM
 ↓
HIGH
 ↓
CRITICAL
```

Reporting workflow:

```text
SUBMITTED
 ↓
PROCESSING
 ↓
RESOLVED
```

---

# 🛡️ Citizen Safety Platform

Citizen routes include:

```text
/welcome
/safety
/risk
/alerts
/nearby
/evacuate
/emergency
/report
/family
/plan
/kit
/learn
/talk
```

The citizen experience prioritizes:

1. Alert
2. Risk
3. Location
4. AI recommendation
5. Map
6. Response status

The interface is intentionally simpler than the operator command center.

---

# 🛰️ Command Platform

Operator-oriented routes include:

```text
/command
/ops
/demo
/drones
/twin
/location
/simulation
/resources
/shelter
/reunion
/recovery
/portal
/platform
/sources
```

These routes expose:

* Operational telemetry
* 3D visualization
* AI decision support
* SAR
* Digital twin
* Flood simulation
* Hospital intelligence
* Shelter intelligence
* Recovery
* System health
* Platform architecture

---

# 📊 Core Capabilities

| Capability            | Route         | Status |
| --------------------- | ------------- | ------ |
| Citizen Safety        | `/safety`     | ✅      |
| Risk Intelligence     | `/risk`       | ✅      |
| Multi-Hazard Alerts   | `/alerts`     | ✅      |
| Emergency Response    | `/emergency`  | ✅      |
| Evacuation            | `/evacuate`   | ✅      |
| Location Intelligence | `/location`   | ✅      |
| Drone SAR             | `/drones`     | ✅      |
| 3D Digital Twin       | `/twin`       | ✅      |
| Flood Simulation      | `/simulation` | ✅      |
| Hospital Intelligence | `/resources`  | ✅      |
| Shelter Intelligence  | `/shelter`    | ✅      |
| AI Decision Support   | `/command`    | ✅      |
| Demo Presentation     | `/demo`       | ✅      |
| System Health         | `/ops`        | ✅      |
| Recovery & Audit      | `/recovery`   | ✅      |
| Citizen Reporting     | `/report`     | ✅      |
| Family Safety         | `/family`     | ✅      |
| Emergency Planning    | `/plan`       | ✅      |
| Emergency Kit         | `/kit`        | ✅      |
| Disaster Education    | `/learn`      | ✅      |
| Voice Assistant       | `/talk`       | ✅      |
| PWA / Offline         | —             | ✅      |
| Accessibility         | —             | ✅      |
| Multilingual          | EN / TE / HI  | ✅      |

---

# 🌊 Demonstration Scenario

### Vijayawada Flood Response — SIMULATION

The primary demonstration narrative follows:

```text
NORMAL
   ↓
HEAVY RAIN
   ↓
RIVER RISING
   ↓
WATCH
   ↓
WARNING
   ↓
CRITICAL
   ↓
EVACUATION
   ↓
DRONE SAR
   ↓
HOSPITAL RESPONSE
   ↓
RESCUE
   ↓
RECOVERY
```

The scenario is designed as a demonstration environment and must not be interpreted as an official emergency warning.

---

# 🔐 Data Trust Model

DRISHTI-X deliberately communicates the source and reliability category of displayed information.

| Badge             | Meaning                                             |
| ----------------- | --------------------------------------------------- |
| 🟢 **LIVE**       | Real measured/streamed or externally retrieved data |
| 🟡 **DEMO**       | Illustrative operational data                       |
| 🔵 **SIMULATION** | Modelled or simulated output                        |
| 🟣 **LOCAL**      | Data stored/processed on the device                 |
| ⚪ **OFFLINE**     | Cached content available without connectivity       |

Important operational panels are designed around:

```text
SOURCE
STATUS
LAST UPDATED
```

This trust model is a core part of the product design.

---

# ♿ Accessibility & Real-World Resilience

DRISHTI-X is designed to remain usable under different user needs and device conditions.

### Accessibility

* Keyboard navigation
* `:focus-visible` support
* Skip-to-content navigation
* Screen-reader labels
* Reduced-motion support
* High-contrast mode
* Large-text mode
* Read-aloud functionality
* Critical information not communicated by color alone

### Reduced Motion

The cinematic system responds to:

```text
prefers-reduced-motion
```

and includes an in-app reduce-motion control.

### Mobile

Mobile prioritizes:

```text
ALERT
 ↓
RISK
 ↓
LOCATION
 ↓
AI RECOMMENDATION
 ↓
MAP
 ↓
RESPONSE STATUS
```

3D complexity and visual effects are reduced where appropriate.

### Offline

The application provides:

* PWA shell
* Service worker
* Offline banner
* Cached safety/education content
* Last-synchronized status

---

# 🛠️ Technology Stack

### Frontend

* Next.js 14
* React 18
* TypeScript 5
* Tailwind CSS
* Three.js
* Leaflet
* OpenStreetMap
* Lucide React

### Backend

* FastAPI
* Python 3.11
* Uvicorn
* WebSockets
* Pydantic
* Pytest
* HTTPX

### Data / Maps

* Browser Geolocation
* Nominatim
* Overpass API
* OpenStreetMap
* Optional Google Maps integration

### Platform

* Progressive Web App
* Service Worker
* localStorage
* Web Speech API
* Web Notifications API
* Vercel

### Deliberately Avoided

DRISHTI-X does not depend on:

* Paid maps
* Paid AI APIs
* Paid 3D models
* Stock footage
* Premium fonts
* Commercial animation frameworks
* Paid database/authentication services

The original project documentation explicitly follows this free-resource architecture.

---

# 🏗️ System Architecture

```text
                  USER / OPERATOR
                         │
                         ▼
                ┌─────────────────┐
                │    NEXT.JS      │
                │  APPLICATION     │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ CINEMATIC LAYER │
                │ 3D / HUD / MAPS │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ INTELLIGENCE    │
                │     STORE       │
                └────────┬────────┘
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
           RISK        ALERTS       SOS
             │           │           │
             └───────────┼───────────┘
                         ▼
                ┌─────────────────┐
                │ DOMAIN SERVICES │
                ├─────────────────┤
                │ Risk Engine     │
                │ Alert Rules     │
                │ Geospatial      │
                │ Telemetry       │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ PROVIDER LAYER  │
                └────────┬────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
        DEMO / LOCAL          FUTURE OFFICIAL
        PROVIDERS             DATA SOURCES
```

The architecture keeps provider interfaces separate from the UI so future official data integrations can be introduced without rewriting the presentation layer.

---

# 📁 Project Structure

```text
drishti-ai-command-center/
│
├── .github/
│   └── workflows/
│
├── backend/
│   ├── app/
│   ├── routers/
│   ├── services/
│   ├── models/
│   └── tests/
│
├── src/
│   ├── app/
│   │   ├── command/
│   │   ├── safety/
│   │   ├── risk/
│   │   ├── alerts/
│   │   ├── emergency/
│   │   ├── drones/
│   │   ├── twin/
│   │   ├── simulation/
│   │   └── ...
│   │
│   ├── components/
│   │   ├── cinematic/
│   │   │   ├── AiCoreScene.tsx
│   │   │   ├── AiDecisionTimeline.tsx
│   │   │   ├── DemoMode.tsx
│   │   │   ├── CommandBackground.tsx
│   │   │   ├── StatusHeader.tsx
│   │   │   ├── HudPanel.tsx
│   │   │   ├── SosRadar.tsx
│   │   │   └── RiskVisualizer.tsx
│   │   │
│   │   ├── three/
│   │   ├── maps/
│   │   └── alerts/
│   │
│   ├── data/
│   │   └── providers.ts
│   │
│   ├── store/
│   │   ├── opsStore.ts
│   │   ├── appStore.ts
│   │   └── intelStore.ts
│   │
│   ├── hooks/
│   ├── i18n/
│   └── utils/
│
├── public/
│   ├── poster.jpg
│   ├── manifest.json
│   ├── sw.js
│   └── icon.svg
│
├── docs/
│   └── screenshots/
│
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
└── docker-compose.yml
```

---

# 🧪 Engineering Verification

The project includes engineering checks covering:

```text
TypeScript
     ↓
ESLint
     ↓
Backend tests
     ↓
Production build
     ↓
Route verification
     ↓
Security review
     ↓
Production deployment
```

Current documented checks include:

| Check             | Result                 |
| ----------------- | ---------------------- |
| TypeScript        | ✅ Clean                |
| ESLint            | ✅ Zero warnings        |
| Backend tests     | ✅ 9/9                  |
| Production build  | ✅ Pass                 |
| Production routes | ✅ Verified             |
| Security audit    | ✅ No secrets committed |

These verification results are carried forward from the project's existing engineering documentation.

---

# 🔒 Security & Privacy

DRISHTI-X follows a defensive-by-default approach.

### Secrets

Secrets belong in:

```text
.env
.env.local
Hosting environment variables
```

and are not committed to the repository.

### Local Data

Certain citizen-oriented data is stored locally using browser storage.

### Location Privacy

Shared coordinates can be rounded before transmission/display, reducing unnecessary precision.

### Input Safety

Inputs are length-capped where appropriate.

---

# 🔌 Future Official Integrations

The following are **roadmap integrations, not currently connected official feeds**:

* IMD weather
* NDMA/CAP alerts
* Government disaster feeds
* River/IoT sensors
* Hospital HMIS
* Government shelter registries
* Bhuvan satellite tiles
* MAVLink drone telemetry

The platform is structured so these can map into provider interfaces without changing the core UI architecture.

**DRISHTI-X does not claim these integrations are currently live.**

---

# 🖼️ Project Showcase

Recommended screenshots for the repository:

```text
docs/screenshots/
│
├── welcome.png
├── command.png
├── twin.png
├── drones.png
├── simulation.png
├── resources.png
├── shelter.png
├── report.png
├── recovery.png
├── ops.png
├── location.png
├── safety.png
└── demo.png
```

### Recommended Capture Standard

```text
Resolution: 1280 × 800
Format: PNG
Target size: <500 KB/image
Source: Actual running application
```

**No fabricated screenshots or mockup images should be committed as real application captures.**

Your existing README already establishes this screenshot policy.

---

# 🎬 Recommended Hackathon Demo

For the full cinematic demonstration:

```text
1. Open /command
2. Press P
3. Start Presentation Mode
4. Let the ~30-second story play
5. Show the AI Decision Timeline
6. Explain the shared intelligence layer
7. Open /drones
8. Show target detection
9. Open /twin
10. Show the digital twin
11. Open /simulation
12. Demonstrate flood progression
13. Finish with recovery / audit
```

### The story

```text
PROBLEM
   ↓
DETECTION
   ↓
INTELLIGENCE
   ↓
DECISION
   ↓
ALERT
   ↓
RESPONSE
   ↓
RESCUE
   ↓
RECOVERY
```

---

# 🌐 Live Project

### Main Experience

**https://drishti-ai-command-center.vercel.app/**

### Command Center

**https://drishti-ai-command-center.vercel.app/command**

### Citizen Safety

**https://drishti-ai-command-center.vercel.app/safety**

### Demo Mode

**https://drishti-ai-command-center.vercel.app/demo**

### Source Code

**https://github.com/hemanthhemanth1834-bit/drishti-ai-command-center**

---

# 📌 Current Production Status

```text
DRISHTI-X V3.2
────────────────────────────────────

GitHub main             ✅ 48e07f8
V3 Intelligence        ✅ Complete
V3.1 Decision Timeline ✅ Complete
V3.2 Demo Mode         ✅ Complete
Cinematic 3D           ✅ Complete
Citizen Platform       ✅ Complete
Command Platform       ✅ Complete
PWA / Offline          ✅ Complete
Accessibility          ✅ Complete
Multilingual          ✅ EN / TE / HI
Production Deployment  ✅ READY
Live Verification      ✅ VERIFIED

V3.3                    🔒 FROZEN
```

---

# ⚠️ Honest Limitations

DRISHTI-X is a demonstration and engineering prototype, not an official emergency-management system.

Important limitations:

* Demo and simulation content must not be interpreted as official warnings.
* Some medical, shelter, hazard and operational values are illustrative.
* Third-party geospatial services depend on network availability.
* Future government data integrations are not currently connected.
* Multilingual educational content may require professional review.
* Production deployment currently uses a verified manual deployment workflow.

## The original project also explicitly identifies demo/simulation content and future official integrations as limitations/roadmap items.

# 🏆 Why DRISHTI-X?

DRISHTI-X combines:

```text
                 AI
                 +
              GEOINT
                 +
               3D
                 +
             SIMULATION
                 +
             DRONE SAR
                 +
             EMERGENCY
                 +
              HEALTH
                 +
              SHELTERS
                 +
              CITIZENS
                 +
              RECOVERY
```

into one connected experience.

The goal is not simply to build another dashboard.

The goal is to demonstrate how a disaster-response platform can transform:

> **Fragmented information → Shared intelligence → Explainable decisions → Coordinated response**

---

# 👨‍💻 Project

**DRISHTI-X**
*Cinematic 3D Disaster Intelligence & Emergency Response Command Center*

Built with:

**Next.js • React • TypeScript • Three.js • Leaflet • FastAPI • Python • WebSockets • PWA**

### Maintainer

**MUCHAKARLA HEMANTH KUMAR**

### GitHub

https://github.com/hemanthhemanth1834-bit

---

<div align="center">

## 🛰️ DRISHTI-X

### **From Detection to Decision. From Decision to Response.**

**Built for a safer, stronger, more resilient future.**

⭐ If you find the project useful, consider starring the repository.

</div>
