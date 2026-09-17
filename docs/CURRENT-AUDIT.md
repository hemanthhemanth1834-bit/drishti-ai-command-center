# CURRENT-AUDIT.md — Step 0 repository + deployment audit (2026-09-16)

> Audit only. No functional changes made for this document. HEAD: `81c9165`.
> Verified by: file inspection, test/build execution, live HTTP fetches.

## Routes (47: 46 dirs + `/`)
All build as static. Index `/` = reference landing (36/36 links resolve).
Citizen: welcome/safety/location/risk/alerts/emergency/evacuate/nearby/report/family/plan/kit/learn/talk/offline.
Intelligence: intelligence/prediction/risk-map/weather/sensors/satellite/terrain/history/ml/model-health.
Ops: command/ops/nesafe/twin/drones/simulation/location/resources/shelter/reunion/recovery/response/roads/notifications/regions/admin + platform/portal/sources/demo.

## Backend (85 endpoints, 28 groups, FastAPI)
Legacy telemetry + WS preserved. Platform routers: ml/model-health/weather/rainfall/sensors/satellite/terrain/history/warnings/roads/response/notifications/incidents/vision/grid/risk/alerts/sync/admin/nesafe/regions/ai/resources/sectors/ops/auth/api_v1.
DB: 29 tables, SQLite dev, Postgres path. ML: RF Landslide-RF-v1, 22 features, SYNTHETIC-DEMO (acc 0.8867/F1 0.931/ROC-AUC 0.9408).

## Providers (live-verified keyless)
LIVE: Open-Meteo, SoilGrids, OSM/Nominatim/Overpass, GIBS VIIRS+MODIS (+7-2-1), CartoDB, Esri, OpenTopoMap, OSRM.
NOT_CONFIGURED: IMD, Copernicus, Earthdata-bulk, FIRMS, ISRO, SMS/push/email, JWT/Ollama/Postgres.
SIMULATED: terrain DEM, satellite obs, history seeds, vision heuristic, twin/drones.

## 3D/GIS
Vanilla Three (AiCoreScene, twin, swarm, flood) + R3F Terrain3D + GlobeView + MapLibre + Leaflet heatmaps. Dynamic imports, quality modes, reduced-motion + WebGL fallbacks.

## Auth/RBAC/offline/i18n
PyJWT bootstrap/operator-keys, 16 roles, audit log, in-memory frontend token. Offline: SW + IndexedDB queue + receipts + auto-sync (no Background Sync). 9 app langs + EN/TE platform + 9-lang alert templates.

## Problems found (honest backlog)
1. Sparse demo geography outside showcases (warnings return empty affected lists there).
2. Training data 87% positive skew (metrics optimistic).
3. No duplicate-incident detection; no JWT refresh rotation; SQLite default.
4. Vercel serves frontend only (backend local/Docker); occasional Vercel CLI `Not authorized` transient (retry works).
5. Theme-color metadata warnings in build (cosmetic, pre-existing).

## Deployment state
GitHub `main` == local (clean). Vercel production READY; live `/`, `/regions`, `/twin`, `/risk-map`, `/history`, `/model-health` fetched and correct with honest DEMO states. No missing deployment changes.
