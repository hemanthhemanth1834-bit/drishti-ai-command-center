# CURRENT-ARCHITECTURE.md — Phase 0 audit (2026-09-16, verified by inspection + execution)

> Read-only audit. No functional code was modified to produce this document.
> HEAD: `5146f1b`. Live: https://drishti-ai-command-center.vercel.app/ (matches repo; backend-absent fallbacks honest).

## Frontend (`src/`, Next.js 14.2.5 / React 18.3.1 / TS 5.5)
- **Routes:** 46 dirs in `src/app/` + `/` index = **47 routes** (all static in production build).
- **Index `/`:** reference-design landing (`components/home/`: header, hero+3D core, 3 card grids, overview, regions, feed, mission, footer). Central route map: `src/config/navigation.ts` (36/36 hrefs resolve).
- **Auth UI, no gate:** `components/auth/LoginCard.tsx` (modal) + `store/authStore.ts` (in-memory JWT); public pages stay public; header SIGN IN → `/command` on success.
- **State:** `appStore` (mode/lang/a11y/quality/sound, 9 langs), `opsStore`, `intelStore`, `authStore`, `platform/regionStore`.
- **i18n:** `i18n/dict.ts` (nav/modes/risk/emergency EN+TE+HI+…), `platform/i18n.ts` (EN/TE), `platform/alertTemplates.ts` (9 langs).
- **3D:** vanilla Three `AiCoreScene` (reduced-motion + WebGL fallback), `DigitalTwin`, R3F `Terrain3D`, `GlobeView`, MapLibre `MapLibreCommand`, `DroneSwarmScene`, `FloodTimeline`. Dynamic imports, adaptive quality.
- **Maps:** Leaflet `RiskGridMap` (risk cells + sensors/roads/shelters/incidents), `RadarMap`, `DroneLeafletTracker`. EO layers catalog `platform/eoLayers.ts` (GIBS VIIRS/MODIS live-verified; Sentinel/FIRMS/ISRO NOT_CONFIGURED).
- **PWA/offline:** `sw.js` (shell cache + push handler), `platform/offlineDb.ts` (IndexedDB queue + receipts + auto-sync), `/offline` page. No Background Sync.
- **Visuals:** 26 original SVGs (`public/img/`), 5 vendored NASA public-domain photos + 30-folder metadata pack (`public/assets/drishti-x/real-world/`), registry `config/imageSources.ts` + `disasterVisuals.ts`, `components/visuals/DisasterImage.tsx`, gallery EXAMPLE-hardened.

## Backend (`backend/`, FastAPI 0.116.1, Python 3.11 CI / 3.14 local)
- **85 endpoints, 28 groups** (`app.openapi()`): `api_v1` legacy (telemetry/WS preserved), `ml`, `model_health`, `weather`, `rainfall` (observed/forecast split), `sensors`, `satellite`, `terrain`, `history` (CSV import), `warnings`, `roads`, `response`, `notifications`, `incidents` (UNVERIFIED→VERIFIED/REJECTED), `vision`, `grid`, `risk`, `alerts` (7 levels), `sync` (idempotent receipts), `admin`, `nesafe`, `regions` (10: geo hierarchy + geocode/route), `ai` (Ollama-optional, explains only), `resources`, `sectors`, `ops` (observability), `auth` (PyJWT bootstrap/operator-keys).
- **Providers** (`services/`): `providers.py` (Open-Meteo live, SoilGrids live, IMD/SMS/push/email NOT_CONFIGURED), `geo_providers.py` (Nominatim cached+throttled, OSRM+fallback), `ai_providers.py`, `spatial.py` (haversine, PostGIS path), `security.py` (PyJWT, 16 roles, rate limits, upload guards), `telemetry_engine.py`, `connection_manager.py`.
- **ML (`ml/`):** 22-feature schema, RandomForest `Landslide-RF-v1`, metrics acc 0.8867 / F1 0.931 / ROC-AUC 0.9408 on **SYNTHETIC-DEMO** (2400/600), DEMO-heuristic fallback, honest monitoring.
- **Database:** 29 tables (`models/platform.py` 17 + `models/geo.py` 12), SQLite dev fallback, Postgres/PostGIS path, lazy-init + additive migration shim, DEMO + geo seeds (AP 26 + TG 33 districts verified).

## Cross-cutting
- **Provenance:** `LIVE/FORECAST/EXTERNAL/DEMO/SIMULATION/OFFLINE/STALE/NOT_CONFIGURED/NOT_AVAILABLE/CACHED/MODEL/HISTORICAL` on every value; asserted in tests.
- **Security:** headers in `next.config.js`, `CORS_STRICT` flag, env-only secrets (48 vars, all optional), audit logging. Dev-only: default gateway key, open CORS default, SQLite.
- **Infra:** `docker-compose.yml` (keyless default; `--profile full` = PostGIS/Valkey/MinIO/Mailpit), `vercel.json`, GH Actions `pr-check` + `deploy`.
- **Tests:** 51 pytest + 7 vitest, typecheck/lint/build green. No LICENSE file.
- **Docs:** 12 files in `docs/` + README/CONTRIBUTING/SECURITY/FREE-STACK/THIRD-PARTY-LICENSES + `data/README.md`.
