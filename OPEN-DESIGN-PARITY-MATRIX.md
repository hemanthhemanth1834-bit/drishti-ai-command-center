# OPEN-DESIGN PARITY MATRIX (2026-09-24)

Reference: Open Design command-center spec (HTML reference absent from disk;
spec items in task brief are the visual source of truth). Backend/data
immutable: FastAPI/Railway, API contracts, env, providers, WS, ML logic.

| Open Design section | Existing React component | Current state | Missing visual elements | Porting action | Data/API dependency | Status |
|---|---|---|---|---|---|---|
| Top status bar (LIVE, mode, sync, search, alerts, emergency, settings) | `Navbar.tsx` + `StatusHeader` + `LiveStatusStrip` | Has brand/nav/LIVE-WS/posture/mode/lang/emergency; no search/alerts/settings shortcuts | Search entry, alerts + settings shortcuts | Add icon links: search→`/location`, bell→`/alerts`, gear→`/settings` (existing routes only) | None (links) | TODO |
| Hero / situation area (title, mission, command + intel actions) | `/command` poster hero | Has title, mission, CHECK MY RISK + FULL POSTER | Intelligence action | Add `OPEN INTELLIGENCE → /intelligence` button | None | TODO |
| Operational KPI row (incidents, critical, AI/risk, regions, responders) | `/command` KPI ticker (6 cards) | Present but scenario-simulated numbers (`tickerPeople` hardcoded, "live drill") | Real values + honest states | New `CommandKpiRow.tsx`: incidents, critical, rainfall-24h, states-in-registry, response queue, model health — LIVE/DEMO labeled | `/api/v1/incidents`, `/api/v1/rainfall/current`, `/api/regions/states`, `/api/v1/response/queue`, `/api/v1/model-health` | TODO |
| Live operational map (incidents, risk, evac, teams, sat toggle) | `DisasterMap.tsx` (8 layers) | Complete + honest; 420px | Slightly more prominence | Height 420→460; keep controls/filters | Existing | TODO (minor) |
| AI Situation Brief (OBSERVED→ANALYSIS→RECOMMENDATION) | `SituationBrief.tsx` | Complete, honest, wired | Nothing structural | Keep; verify visible order after map | Existing | KEEP |
| Live imagery / intelligence wall | `LiveImagery.tsx` | Complete, 6 panels, stacks on mobile | Nothing | Keep | Existing | KEEP |
| Risk / weather / rainfall | `/weather`, rainfall API, `FloodTimeline` | Wired to Open-Meteo via backend | KPI surfacing | Covered by new KPI row | Existing | KEEP |
| Incident / response panels | `AlertBanner`, response ledger, `AiDecisionTimeline`, telemetry log | Present | Nothing | Keep | Existing | KEEP |
| 3D / globe | `DisasterGlobe.tsx` + `DigitalTwinCanvas` | Renders (R3F, fallback, reduced-motion) | Nothing (diagnosed: renders) | Keep; polish heights already shipped | Existing | KEEP |
| Navigation (all routes incl. family/reunion/learn/talk) | `Navbar` + `MobileQuickBar` + module grid | Complete | Nothing | Keep; QA all routes | — | KEEP |
| Visual language (navy/cyan/glass/dense) | `globals.css` cinematic theme | Complete | Density on KPI row | Real-data KPI cards reuse `dx-kpi` style | — | TODO (KPI) |
| Responsive (desktop/tablet/mobile) | Grids + polish layer | Done in polish pass | Verify command order on mobile | Structural QA via rendered HTML | — | VERIFY |
| Drawers/focus/Escape | `useDialogA11y` + DemoMode | Done in polish pass | Nothing | Keep | — | KEEP |

Out of scope (explicitly forbidden): backend, Railway, DB, API contracts,
auth, providers, WS contracts, env vars, ML logic, paid services, new deps.
