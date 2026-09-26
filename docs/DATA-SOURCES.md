# DATA-SOURCES.md — live inventory (reverified 2026-09-26)

| Source | Use | Status | Auth | Fallback |
|---|---|---|---|---|
| Open-Meteo | weather/rainfall/soil proxy (+direct current/hourly/daily via data engine) | LIVE (keyless; backend chain OFFLINE while backend down) | none | demo |
| SoilGrids/ISRIC | soil texture | LIVE | none | Open-Meteo → demo |
| OSM tiles / Nominatim / Overpass | maps/search/POIs | LIVE | none (throttled) | demo |
| NASA GIBS | satellite context (4-layer viewer, 14d NRT) | LATEST_AVAILABLE tiles | none | demo obs |
| USGS | earthquakes (M2.5+/7d via engine) | LIVE | none | none (empty state) |
| NASA EONET | natural events (100 rec, engine) | LIVE | none | none (empty state) |
| NASA FIRMS | active fire | NOT_CONFIGURED | free MAP_KEY (server-side) | MODIS 7-2-1 burn-scar |
| NASA GPM bulk | precipitation | NOT CONFIGURED | Earthdata login | Open-Meteo |
| Copernicus | Sentinel-1/-2 | NOT_CONFIGURED (live-probed: no public imagery path) | free account | demo obs |
| ISRO/Bhuvan/Bhoonidhi | soil/satellite | NOT CONFIGURED | varies | SoilGrids/demo |
| IMD | official weather | NOT_CONFIGURED | key | Open-Meteo |
| SMS/push/email | notifications | NOT_CONFIGURED | provider keys | in-app queue |
| Google Maps Embed | optional location view (`/location` toggle) | NOT_CONFIGURED (no key) | key + billing-enabled project, referrer-restricted | OSM radar (default) |
| DEM/SRTM | elevation | PLANNED | — | procedural DEM (demo) |
| History | training/trends | SIMULATED + CSV import | — | — |

Rules: respect ToS/quotas/robots.txt, attribute (see `/data-sources`), never synthesize official feeds. Full license table: `THIRD-PARTY-LICENSES.md`. Per-source details: `DATA-ENGINE.md`, `SATELLITE-INTELLIGENCE.md`, `FIRE-INTELLIGENCE.md`, `EARTHQUAKE-INTELLIGENCE.md`, `WEATHER-INTELLIGENCE.md`, `EONET-EVENT-INTELLIGENCE.md`, `SENTINEL-INTELLIGENCE.md`.

Backend outage note (2026-09-26): Railway trial expired → backend-backed panels show OFFLINE; direct keyless feeds (Open-Meteo/USGS/GIBS/EONET/OSM) remain LIVE from the browser.
