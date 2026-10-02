# DRISHTI-X Route Inventory

This inventory describes the current 26071-focused application surface. Removed legacy routes are intentionally absent.

## Core routes

| Route | Purpose | Status |
|---|---|---|
| `/` | Project entry / SIH 26071 focus | Available |
| `/command` | Command-center overview and provenance status | Available |
| `/intelligence` | Cross-module flood/weather/GIS intelligence | Available |
| `/weather` | Live weather and rainfall context | Live when provider is reachable |
| `/satellite` | NASA GIBS imagery context | Context / latest available |
| `/risk-map` | GIS risk layers and spatial context | Available |
| `/risk` | Deterministic heavy-rain/flood screening | Screening, not validated ML |
| `/alerts` | Alert review and management | Available |
| `/incidents` | Field incident reporting / verification | Available |
| `/roads` | Road and access intelligence | Available |
| `/resources` | Hospitals and response resources | Available |
| `/shelter` | Shelter workflow | Demo/availability depends on source |
| `/response` | Emergency response workflow | Available |
| `/regions` | Geographic hierarchy and location context | Available |
| `/history` | Historical incident context | Available |
| `/terrain` | Terrain context | Available |
| `/data-sources` | Provider provenance | Available |
| `/offline` | Offline/PWA support | Available |

## Removed routes

- `/prediction` — legacy landslide prediction
- `/ml` — legacy generic ML lab
- `/model-health` — legacy landslide model-health surface
- `/drones` — drone/SAR simulation
- `/sensors` — generic sensor-network demo

## Data rule

A missing provider must result in an explicit unavailable/not-configured state. The application must not replace missing rainfall, radar, satellite observations or model output with synthetic operational values.
