# DRISHTI-X — Prototype → Production Integration Guide (Open Design → Next.js TS)

`index.html` (51 KB visual reference) is **reference-only**. Never paste it wholesale
into React and never copy it to `public/`. Extract concepts, connect to real data,
deploy the modular app.

This repo's HEAD already contains TypeScript adaptations 3–10x larger than the
Open Design JS references. Treat the pasted JS as **logic reference** and port
deltas into the existing `.ts/.tsx` files — never create parallel `.js` files.

## 1. What was inspected first

- `src/app/*` routes (50+), `src/app/command/page.tsx` Master Command Center — kept.
- `src/platform/api.ts` + `src/lib/services.ts` service boundary, auth guards — kept.
- `src/components/map/DisasterMap.tsx` Leaflet init — kept, layers/markers extended.
- `package.json` — leaflet already present; 3D globe uses R3F 8 (lazy via `next/dynamic`).
- `src/app/globals.css` — Open Design tokens ported as additive `--od-*` aliases;
  canonical `--dx-*` values untouched.

## 2. Keep vs replace

| Existing | Action | Why |
|---|---|---|
| Routes, backend logic, auth, data models | KEEP, adapt services to them | Real functionality wins over mock |
| Old dashboard clutter | REPLACE with MetricStrip + IncidentIntelligence + ActionQueue | Clarity-first hierarchy |
| Old map | KEEP Leaflet instance, EXTEND layers/markers/controls | Risk/Evac/Responder + satellite toggle + Evac Route B (DEMO) |
| Old alerts list | REPLACE with AlertCard + AlertCenter | Severity + action + acknowledge |
| Old AI chatbot | REPLACE with SituationBrief + EvidenceChain | Explainable Observed→Analysis→Recommendation |
| Mock numbers in JSX | MOVE to `src/data/operational.ts` behind services | UI never owns datasets |

## 3. Module map (Open Design workspace → this repo)

- `index.html` → reference only; never deployed.
- `src/styles/tokens.css` → `src/app/globals.css` `--od-*` aliases (canonical `--dx-*` untouched).
- `src/data/mockData.js` → `src/data/operational.ts` (`DEMO_*`, typed, DEMO-labeled).
- `src/services/services.js` → `src/lib/services.ts` over `src/platform/api.ts`.
- `src/services/liveServices.js` → `src/lib/liveServices.ts` (FeedState honesty model).
- `src/components/map/DisasterMap.js` → `src/components/map/DisasterMap.tsx`.
- `src/components/intelligence/SituationBrief.js` → `src/components/intelligence/SituationBrief.tsx`.
- `src/components/3d/DisasterGlobe.js` → `src/components/3d/DisasterGlobe.tsx` (R3F canonical; canvas noted as alternative).
- `src/components/live/LiveImagery.js` → `src/components/live/LiveImagery.tsx` (+ `STATUS_LABEL`, `noFeedText`).
- Pages: Landing, CommandCenter, LiveMap, Incidents, AIIntelligence, Resources, Drones, Alerts, Reports, Settings — one folder each under `src/app/*`, same story order.

## 4. Data architecture

UI components → services (`src/lib/services.ts`) → real API (`src/platform/api.ts`) → backend
↘ `src/data/operational.ts` (typed DEMO fallback, consistent relations)

Types: `DemoIncident{id,type,severity,place,lat,lon,reportedAt,status,summary}` ·
`DemoAlert{sev,title,loc,time,action,ack}` · `DemoDrone{id,bat,st,mission,sig}` ·
`DemoFacility{kind,name,lat,lon,detail}`.
Rule: critical incident ⇒ critical alert; drone deploy ⇒ fleet status change;
shelter % ⇒ alert text. Relations live in services, not JSX.

## 5. 3D / map / performance guardrails

- Globe lazy on landing only (`next/dynamic`, `ssr: false`), R3F with
  `prefers-reduced-motion` disabling rotation; quality select trims pixel
  ratio/geometry; 2D fallback list when WebGL unavailable.
- Map: OSM + NASA GIBS VIIRS (canonical) with CARTO dark + Esri satellite
  documented as free alternates (`OD_TILES`); layer toggles for
  RISK/EVACUATION/RESPONDERS/INFRASTRUCTURE/SATELLITE/WEATHER/EARTHQUAKE/FIRE;
  `localStorage` view persistence; `invalidateSize` handled by Leaflet remount.
- Code-split per page, dynamic Leaflet import, lightweight SVG icons, no new paid APIs.

## 6. Merge sequence (completed additively)

1. Landed tokens (`--od-*`) + services + operational deltas (no UI change).
2. Extended CommandCenter map (Route B) + LiveStatusStrip honesty states.
3. Extended SituationBrief evidence chain.
4. Extended LiveImagery labels + liveServices attributions/vision feeds.
5. Globe documented (no functional change).
6. Build/lint/test → push → Vercel redeploy → QA Landing → Command → Map →
   Incident → AI → Resources → Imagery → Alerts → Reports → Settings.
