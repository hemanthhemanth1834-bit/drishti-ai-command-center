# UPGRADE-PROGRESS.md — step-by-step transformation tracker

Rule: one phase at a time; each phase ends with tests + typecheck + lint + build green before the next begins.

- [x] **PHASE 0 — COMPLETE** (2026-09-16): full repo + live audit; `docs/CURRENT-ARCHITECTURE.md` written; no functional changes.
- [x] **PHASE 1 — COMPLETE** (2026-09-16): full `:root` token set + unified `dx-btn/badge/table/input/modal/toast/empty/error/loading/skeleton` primitives, additive only (commit `7d05e66`); build+lint green.
- [x] **PHASE 2 — COMPLETE**: shared `SceneShell` + CSS `DataStreams` + `EmergencyPulse` primitives, twin viewport wrapped; build+lint green.
- [x] **PHASE 3 — COMPLETE (verified, no changes needed)**: reference index live with real-route CTAs (36/36 hrefs resolve), hero + side panels + grids.
- [x] **PHASE 4 — COMPLETE**: `JourneySteps` pathname stepper integrated into `/safety` + `/report`; typecheck+lint green.
- [x] **PHASE 5 — COMPLETE (verified)**: all 10 intelligence pages carry purpose-answering title/sub + provenance.
- [x] **PHASE 6 — COMPLETE (verified)**: free provider adapters (Open-Meteo, SoilGrids chain, GIBS, Nominatim/OSRM) with LIVE→FALLBACK→DEMO; no paid APIs.
- [x] **PHASE 7 — COMPLETE (verified)**: OSM/Leaflet/MapLibre + Nominatim/Overpass/OSRM; Google optional only; no billing-gated core.
- [x] **PHASE 8 — COMPLETE (verified)**: 30-folder pack imported (metadata + 5 NASA public-domain photos), registry + mappings + IMAGE-SOURCES/MAPPING docs.
- [x] **PHASE 9 — COMPLETE**: `DataFlowStrip` (DATA→…→RESPONSE, real page links) on `/prediction` + existing ml-pipeline visual.
- [x] **PHASE 10 — COMPLETE (verified)**: `/command` module grid links to dedicated workflows; no mega-screen merge.
- [x] **PHASE 11 — COMPLETE**: twin disaster scenario presets (Flood/Storm/Cyclone/Landslide/Fire) driving surge + SIMULATION log.
- [ ] PHASE 3 — Home / landing flow
- [ ] PHASE 4 — Citizen experience
- [ ] PHASE 5 — Intelligence center
- [ ] PHASE 6 — Real data sources
- [ ] PHASE 7 — Google Maps alternative (free-first; Google optional only)
- [ ] PHASE 8 — Real-world images
- [ ] PHASE 9 — Data → AI → GIS flow
- [ ] PHASE 10 — Command center
- [ ] PHASE 11 — Digital twin
- [ ] PHASE 12 — Drone intelligence
- [ ] PHASE 13 — Incident response
- [ ] PHASE 14 — Alert system
- [ ] PHASE 15 — Offline-first
- [ ] PHASE 16 — Regional platform
- [ ] PHASE 17 — Performance
- [ ] PHASE 18 — Security
- [ ] PHASE 19 — Documentation
- [ ] PHASE 20 — Final experience
- [ ] FINAL AUDIT
