# DRISHTI-X Command Center (`/command`)

Operational overview connecting all intelligence modules. No duplicate implementations — every panel links or embeds existing modules.

## Route / layout

`/command`: Navbar → StatusHeader → LiveStatusStrip → SOS/risk banners → poster hero → CommandKpiRow (real-data KPIs) → FloodTimeline → workstation (twin viewport, AI panel, decision timeline, SituationBrief, telemetry log, module grid) → 8-layer live map → imagery wall + globe → geospatial gallery.

## Status header (post-launch corrected)

SYSTEM from WebSocket state (ONLINE/OFFLINE, never forced) · NETWORK STABLE/SIM LINK · AI INFERENCE NOT AVAILABLE unless a runtime score exists · DRONE LINK SIM FLEET unless a live count source exists · DATA STREAM measured Hz or N/A · SATELLITE GIBS NRT/DAILY COMPOSITE · clock. No fabricated 98.4% / 32 units / 2.0 Hz / LEO-lock claims remain (repo-wide scan verified).

## Live status strip

Per-feed pills (backend/weather/quakes/satellite/fire) with source + timestamp, aria-live polite, clock aria-hidden.

## KPI row

Incidents, critical, rainfall-24h, states-in-registry, response queue, model health — backend-first with labeled DEMO/OFFLINE fallbacks.

## Module status grid

14 module links with per-endpoint probing (resources/sensors/roads/response/alerts), Open-Meteo feed state for weather, static truthful states (SIMULATION/DEMO/AVAILABLE/LATEST_AVAILABLE). One healthy endpoint never marks unrelated modules live.

## Maps / 3D twin / AI panels / telemetry / imagery / globe / gallery / navigation

Reused as built: DisasterMap, DigitalTwinCanvas, rule-output AI panel, WS telemetry log (measured rate or N/A), LiveImagery, DisasterGlobe, GeospatialIntelGallery (example metrics honest), module links.

## Source states / offline / simulation handling

All 11 states preserved; backend outage renders OFFLINE throughout; simulation content labeled SIMULATION/SIM.

## Accessibility / responsive

Native links/buttons, dialog focus+Escape, aria-live regions, global :focus-visible, 44px targets, 2-col module grid, stacked workstation on mobile, reduced-motion gates intact.
