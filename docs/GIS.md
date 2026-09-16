# GIS.md — map platform

- Providers: Leaflet + OSM tiles default; MapLibre 3D in `/nesafe`; style via `NEXT_PUBLIC_MAP_STYLE`. No paid map key required.
- Layers: risk grid (`/api/v1/grid/risk-cells?step=` + `&bbox=` future), sensors, roads, incidents, shelters. Legend + toggles on `/risk-map`.
- Geocoding: Nominatim adapter, India-biased, ≤10 results, 1 req/s throttle, 1 h cache, `CACHED` label on hits (`backend/app/services/geo_providers.py`).
- Routing: OSRM demo server; unreachable → straight-line×1.35 DEMO estimate, explicitly not an approved evacuation route.
- Boundaries: schematic until open boundary datasets are wired (labeled in UI). Admin boundary sources must be ODbL-compatible (GADM/geoBoundaries) before import.
- Performance: dynamic imports (`ssr:false`), server-side grid, circle clustering by grid step.
