# DRISHTI-X route inventory (from `src/app/`, verified 2026-09-26)

51 route directories. Status reflects current production (backend OFFLINE → backend-backed panels degrade honestly).

| Route | Purpose | Data source | Status |
|---|---|---|---|
| `/` | Homepage (frozen Steps 1–20) | Mixed free APIs + static | LIVE/DEMO mix |
| `/command` | Command Center (status-corrected) | Backend + OM/USGS/GIBS direct | Partially OFFLINE |
| `/risk-map` | GIS risk + 8-layer overlay | GIBS/OSM + grid API | Map LIVE, grid OFFLINE |
| `/satellite` | GIBS viewer + FirePanel + adapters | GIBS direct + backend | Viewer LIVE, backend DEMO |
| `/earthquakes` | USGS intelligence | Engine `usgs-earthquakes-7d` | LIVE |
| `/weather` | Backend chain + OM direct intel | Backend + Open-Meteo direct | Backend OFFLINE, OM LIVE |
| `/events` | EONET intelligence | Engine `eonet-events` | LIVE |
| `/model-health` | Model ops (SYNTHETIC-DEMO honest) | Backend artifacts | OFFLINE |
| `/prediction` | RF playground (PredictorCard) | Backend ML / DEMO fallback | OFFLINE→DEMO |
| `/ml` | Model lab | Backend ML | OFFLINE |
| `/twin` | 3D twin command view | Local simulation | SIMULATION |
| `/nesafe` | NE-India 3D center | Local + MapLibre | SIMULATION |
| `/incidents` | Reports + verify workflow | Backend + offline queue | OFFLINE→DEMO |
| `/response` | P1–P4 triage board | Backend | OFFLINE |
| `/alerts` | Alert center | Backend + rules | OFFLINE→DEMO |
| `/resources` | Hospital ICU view | Backend | OFFLINE |
| `/shelter` | Shelter scanner (DEMO rows) | Static DEMO | DEMO |
| `/drones` | Drone swarm & SAR | WS telemetry (sim link) | SIMULATION |
| `/sensors` | Sensor network table | Backend | OFFLINE |
| `/roads` | Road intel | Backend + OSRM | OFFLINE→DEMO |
| `/regions` | Geo registry browser | Backend registry | OFFLINE→DEMO |
| `/terrain` | Terrain intel | Procedural DEM | SIMULATION |
| `/safety` | Citizen risk check | Shared stores | LIVE (local) |
| `/emergency` | SOS + emergency | Browser + local | LIVE (local) |
| `/evacuate` | Evacuation routes | OSRM/straight-line | DEMO |
| `/family` | Family safety | Local | LIVE (local) |
| `/reunion` | OP-MILAN reunion | Simulation flow | SIMULATION |
| `/learn` | Disaster education | Static | STATIC |
| `/talk` | Voice assistant | Web Speech API | LIVE (browser) |
| `/kit` | Emergency kit | Static | STATIC |
| `/plan` | Personal plan | Local | LIVE (local) |
| `/nearby` | Nearby help (Overpass) | Overpass API | LIVE/DEMO |
| `/location` | Location intel (OSM search) | Nominatim + GPS | LIVE |
| `/report` | Citizen reporting | Backend + offline queue | OFFLINE→queued |
| `/recovery` | Recovery & audit | Simulation ledger | SIMULATION |
| `/history` | Historical incidents/photos | Static + vendored NASA | HISTORICAL |
| `/intelligence` | 17-module hub | Mixed | Mixed |
| `/ops` | Ops overview | Backend ops | OFFLINE |
| `/admin` | Admin (RBAC) | Backend admin | OFFLINE |
| `/notifications` | Notification channels | Backend (unconfigured providers) | NOT_CONFIGURED |
| `/offline` | Offline PWA status | IndexedDB/local | LIVE (local) |
| `/platform` | Platform specs | Static | STATIC |
| `/portal` | Citizen portal | Local | LIVE (local) |
| `/sources` | Free-source catalog | Static | STATIC |
| `/data-sources` | Provider table + live checks | Static + provider APIs | Mixed |
| `/settings` | Local prefs + transparency | localStorage | LIVE (local) |
| `/demo` | Demo presenter | Local scenarios | DEMO |
| `/simulation` | What-if copilot | Local scenarios | SIMULATION |
| `/welcome` | Legacy cinematic entry | Static | STATIC |
| `/contact` `/privacy` `/terms` | Footer placeholders | Static | STATIC |

Fire experience is embedded: `/satellite` FirePanel + DisasterMap FIRE layer (no dedicated `/fire` route by design).
