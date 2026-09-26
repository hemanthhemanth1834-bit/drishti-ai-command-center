# DRISHTI-X GIS + Satellite (Steps 21/23/24)

## Leaflet

- `RiskGridMap` (`/risk-map`): OSM/CARTO/Esri/OpenTopoMap/OpenFreeMap bases, GIBS overlays with per-tile LIVE/UNAVAILABLE tracking, risk grid cells from `/api/v1/grid/risk-cells`, incidents/sensors/roads/shelters overlays, click-to-inspect satellite panel, **scale control, cursor coordinate + zoom readout, fullscreen** (Step 21).
- `DisasterMap`: 8 layers (RISK/EVACUATION/RESPONDERS/INFRA/SATELLITE/WEATHER/EARTHQUAKE/FIRE), USGS markers link to event pages, FIRMS layer renders nothing without a key, position in localStorage.

## MapLibre

3D GIS on `/nesafe` (OpenFreeMap style, risk heat, sensors, roads). Leaflet remains the 2D reference architecture.

## NASA GIBS

WMTS `best/<LAYER>/default/<DATE>/GoogleMapsCompatible_Level9`, 4 curated layers (VIIRS SNPP True Color, MODIS Terra True Color, MODIS 7-2-1, MODIS Aqua True Color), 14-day window ending yesterday UTC, LATEST_AVAILABLE only, per-tile measurement. Docs: `SATELLITE-INTELLIGENCE.md`.

## Satellite imagery

Live composites in viewer + map; Kerala 2018 before/after reference pair (NASA EO, public domain, vendored); sat-*.svg concept renders labeled DEMO.

## FirePanel integration

`/satellite` FirePanel via engine `firms-fires` → NOT_CONFIGURED (no MAP_KEY), zero detections, burn-scar fallback pointer. Docs: `FIRE-INTELLIGENCE.md`.

## Risk map / coordinates / layers / provenance

Legend (LOW→CRITICAL + sensor/shelter/satellite), inspect dialog (location/source/acquired/status), attributions (OSM/CARTO/Esri/GIBS), region presets, EO layer groups with measured statuses.

## Sentinel/Copernicus status

NOT_CONFIGURED (Outcome B, live-probed 2026-09-26: catalog visible, no public imagery path). Docs: `SENTINEL-INTELLIGENCE.md`.

## Limitations / offline-error behavior

~1-day NRT latency; 14-day viewer window; max zoom 9 on GIBS; tile failures → UNAVAILABLE states; offline → cached tiles labeled, nothing claimed live.
