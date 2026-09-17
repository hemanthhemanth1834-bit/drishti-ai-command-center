# MAP-SOURCES.md

Free/open map stack (all keyless; verified HTTP 200 tile probes 2026-09-16).

| Layer | URL pattern | License |
|---|---|---|
| Street | `tile.openstreetmap.org/{z}/{x}/{y}.png` | ODbL |
| Dark/Light | `{s}.basemaps.cartocdn.com/{dark,light}_all/...` | ODbL + CARTO |
| Satellite | Esri World_Imagery MapServer tiles | Esri/Maxar/Earthstar |
| Terrain | `{s}.tile.opentopomap.org/...` | ODbL + CC-BY-SA style |
| 3D vector | `tiles.openfreemap.org/styles/bright` (MapLibre) | OpenMapTiles + OSM |
| Geocode | Nominatim (1 req/s, cached 1h, India-biased) | Usage policy |
| POIs | Overpass API | ODbL |
| Routing | OSRM demo server → straight-line×1.35 fallback | — |
| Google | OPTIONAL only (`NEXT_PUBLIC_GOOGLE_MAPS_KEY`, else NOT_CONFIGURED) | — |

Single source of truth: `src/platform/mapProvider.ts` (re-exported via `eoLayers.ts`).
Details: `docs/GIS.md`.
