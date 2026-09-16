# DATA-SOURCES.md — live inventory (verified 2026-09-16)

| Source | Use | Status | Auth | Fallback |
|---|---|---|---|---|
| Open-Meteo | weather/rainfall/soil proxy | LIVE | none | demo |
| SoilGrids/ISRIC | soil texture | LIVE | none | Open-Meteo → demo |
| OSM tiles / Nominatim / Overpass | maps/search/POIs | LIVE | none (throttled) | demo |
| NASA GIBS | satellite context | EXTERNAL tiles | none | demo obs |
| NASA GPM bulk | precipitation | NOT CONFIGURED | Earthdata login | Open-Meteo |
| Copernicus | Sentinel-1/-2 | NOT CONFIGURED | free account | demo obs |
| ISRO/Bhuvan/Bhoonidhi | soil/satellite | NOT CONFIGURED | varies | SoilGrids/demo |
| IMD | official weather | NOT CONFIGURED | key | Open-Meteo |
| DEM/SRTM | elevation | PLANNED | — | procedural DEM (demo) |
| History | training/trends | SIMULATED + CSV import | — | — |

Rules: respect ToS/quotas/robots.txt, attribute (see `/data-sources`), never synthesize official feeds. Full license table: `THIRD-PARTY-LICENSES.md`.
