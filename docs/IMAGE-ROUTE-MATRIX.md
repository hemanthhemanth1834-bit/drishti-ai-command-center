# DRISHTI-X Image–Route Matrix (2026-09-26)

Columns: ROUTE | SECTION | CURRENT VISUAL | SOURCE | LICENSE | REAL/ILLUSTRATIVE | STATUS | ACTION

| ROUTE | SECTION | CURRENT VISUAL | SOURCE | LICENSE | R/I | STATUS | ACTION |
|---|---|---|---|---|---|---|---|
| `/` | hero/mission/disasters/before-after | RealPhoto JPGs + project SVGs + mini DisasterMap | NASA/FEMA/USN PD; in-repo SVG | PD / original | REAL + DIAGRAM | LIVE/STATIC | NONE (frozen) |
| `/command` | gallery/ops wall | GeospatialIntelGallery (rebuilt) + LiveImagery + DisasterMap + globes | NASA EO/FEMA/USN PD; GIBS; OSM | PD / open | REAL | HISTORICAL/ARCHIVAL/LIVE | REBUILT gallery data |
| `/welcome` | gateway hero + gallery | AiCoreScene + GeospatialIntelGallery (rebuilt) | same as /command | PD | REAL | ARCHIVAL | REBUILT gallery data |
| `/intelligence` | situation + sectors | DisasterGlobe + 6 sector SVGs | in-repo SVG | original | DIAGRAM | DEMO | NONE (diagrams stay) |
| `/prediction` | model flow + predictor | ModelFlowVisual + PredictorCard | NASA PD photos; OSM tile; registry | PD / ODbL | REAL | per-provider | DONE earlier |
| `/ml` | model flow + cards | ModelFlowVisual + model/health tables | same as /prediction | PD / ODbL | REAL | OFFLINE (backend down) | DONE earlier |
| `/model-health` | registry tables | VizFigure diagrams + tables | in-repo | original | DIAGRAM | OFFLINE | NONE (technical) |
| `/risk-map` | GIS layers | RiskGridMap + DisasterMap + GIBS EO layers | GIBS; OSM; Esri; Carto | open / ODbL | REAL | per-layer | NONE (maps real) |
| `/risk` | score ring + heatmap | RiskVisualizer SVG + RiskChecker | in-repo | original | DIAGRAM | DEMO | NONE |
| `/weather` | rainfall + intel + context photo | WeatherIntel (Open-Meteo) + wx SVG states + RealPhotoCard Nilam | Open-Meteo CC-BY; NASA PD photo | CC-BY / PD | REAL | LIVE/HISTORICAL | ADDED Nilam card |
| `/satellite` | viewer + fire + registry gallery | SatelliteViewer (GIBS) + DisasterImage incl. cyclone-ilsa | GIBS; NASA EO PD | open / PD | REAL | per-adapter | NONE (already real) |
| `/earthquakes` | USGS feed + map | QuakeMap (Leaflet/OSM) + list | USGS; OSM | open / ODbL | REAL | LIVE | NONE (map is visual) |
| `/events` | EONET feed + map | EventMap (Leaflet/OSM) + list | EONET; OSM | open / ODbL | REAL | LIVE | NONE (no generic photo — would mislead) |
| `/incidents` | reports + diagram | VizFigure dis-road.svg + table | in-repo | original | DIAGRAM | DEMO | NONE |
| `/resources` | ICU registry + context photo | AnimatedCounters + RealPhotoCard EOC | operator DEMO; FEMA PD photo | — / PD | REAL | DEMO/ARCHIVAL | ADDED EOC card |
| `/response` | triage queue + context photo | WhyList queue + RealPhotoCard rescue | engine DEMO; USN PD photo | — / PD | REAL | DEMO/ARCHIVAL | ADDED rescue card |
| `/regions` | picker + schematic + terrain photo | selects + regions.svg + RealPhotoCard Himalaya | Region API; in-repo; NASA PD photo | — / original / PD | REAL | DEMO/REFERENCE | ADDED Himalaya card |
| `/location` | geocode + radar map | RadarMap + DroneLeafletTracker | OSM/Nominatim | ODbL | REAL | LIVE | NONE |
| `/drones` | swarm sim | DroneLeafletTracker + DroneSwarmScene 3D | sim | — | SIMULATION | SIM | NONE (no fake feed) |
| `/twin` | 3D twin | TwinViewport + FloodTimeline | Esri tiles; sim overlays | open / — | REAL base + SIM | SIMULATION | NONE |
| `/nesafe` | ops panels | MapLibre + Terrain3D + sim viz | OSM; sim | ODbL / — | REAL + SIM | mixed | NONE |
| `/history` | event timeline | DisasterImage registry (incl. 5 real EO photos) | NASA EO PD | PD | REAL | HISTORICAL | NONE (already real) |
| `/data-sources` | provider catalog | tables | static | — | TEXT | LIVE | FIXED Unsplash row |
| `/sources` | LIVE vs FUTURE tables | tables | static | — | TEXT | mixed | NONE |
| `/terrain` | metrics + schematic | VizFigure terrain.svg + /twin link | in-repo | original | DIAGRAM | DEMO | NONE |
| `/roads` | registry + schematic | VizFigure dis-road.svg + table | in-repo | original | DIAGRAM | DEMO | NONE |
| `/sensors` | node table + topology | VizFigure sensor-net.svg | in-repo | original | DIAGRAM | DEMO | NONE |
| `/offline` | sync queue + flow | VizFigure offline-sync.svg | in-repo | original | DIAGRAM | LIVE badge = page state | NONE |
| `/admin` | authority wall | VizFigure hero-command.svg | in-repo | original | DIAGRAM | DEMO | NONE |
| `/shelter` | scanner + occupancy | AnimatedCounter/RadialGauge | operator | — | DATA | DEMO | NONE (no fake facility photo) |
| `/emergency` | SOS radar | SosRadar + GPS actions | device GPS | — | DATA | LIVE | NONE |
| `/evacuate` | routes/shelters | OSM/Overpass lists | OSM | ODbL | REAL | LIVE | NONE |
| `/nearby` | amenities | OSM amenity lists | OSM | ODbL | REAL | LIVE | NONE |
| `/alerts` | alert list | cards, no imagery | engine | — | DATA | per-alert | NONE |
| `/recovery` | ledger/audit | tables + sensors | engine | — | DATA | DEMO | NONE |
| `/reports` | ops summary | summary + CSV | engine | — | DATA | per-state | NONE |
| `/report` | citizen form | form + photo upload | user device | reporter-owned | REAL (user) | UNVERIFIED until review | NONE |
| `/reunion` | match queue | cards | local | — | DATA | DEMO | NONE |
| `/safety` | hazard grid + phases | RiskChecker + JourneySteps | static | — | DIAGRAM | DEMO | NONE |
| `/kit` `/plan` `/learn` `/family` `/talk` | checklists/chat | Checklist/cards | static/local | — | TEXT | STATIC | NONE (no decoration) |
| `/demo` `/platform` `/ops` `/simulation` | consoles/diagrams | DemoConsole/ArchitectureDiagram/telemetry | in-repo/sim | — | DIAGRAM/SIM | labeled | NONE |
| `/portal` | role links | cards | static | — | TEXT | STATIC | NONE |
| `/settings` `/privacy` `/terms` `/contact` `/notifications` | prefs/legal/lists | text/cards | static/local | — | TEXT | STATIC | NONE |

Heritage notes: `/` frozen; 3D/twin/drones stay SIMULATION; model-health stays technical;
events/earthquakes use real maps, never generic disaster photos.
