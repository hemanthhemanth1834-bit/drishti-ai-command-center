# DRISHTI-X PRODUCTION FREE-SOURCES VERIFICATION (2026-09-24)

Commit verified: `5db4d56` + psycopg2 pin (pending commit below).
Policy: $0 external API cost. No paid service was added. See also
`FREE-SOURCES-AUDIT.md` (provider table) — this file records live
verification results.

## Endpoints

- Backend: https://drishti-ai-backend-production.up.railway.app
  (Railway project `drishti-ai-backend`, Docker, Python 3.11, status SUCCESS)
- Frontend: https://drishti-ai-command-center.vercel.app
  (existing Vercel project, deployment READY)

## Status matrix (all verified live 2026-09-24)

| Area | Status | Evidence |
|---|---|---|
| Backend | LIVE | 8/8 endpoints HTTP 200 (openapi, weather, rainfall, thresholds, providers, districts, cities, model-health) |
| Frontend | LIVE | 18/18 routes HTTP 200; prod bundle contains Railway backend URL |
| Database | LIVE (SQLite) | Seeded registry serves 26 AP districts + verified cities; `DATABASE_URL` switch preserved |
| PostgreSQL | OPTIONAL-READY | `psycopg2-binary==2.9.13` pinned (wheels for py3.11+3.14 verified); activates only via `DATABASE_URL`; SQLite remains default; no migration, no data loss |
| Weather | LIVE | `LIVE:Open-Meteo` 27.3°C / rain_24h 7.4mm / threshold NORMAL |
| Rainfall | LIVE | Observed 1/6/24/72h/7d + forecast split |
| Earthquake | LIVE (client) | USGS M2.5+/7d via keyless `liveServices.ts` |
| Satellite | LATEST_AVAILABLE | GIBS WMTS (daily NRT, per-tile liveness); bulk providers NOT_CONFIGURED |
| GIS / Maps | LIVE | Leaflet + MapLibre, OSM/CARTO/Esri/OpenTopoMap/OpenFreeMap — no paid keys |
| Geocoding | LIVE | Nominatim (throttled 1 req/s + cached) |
| Routing | LIVE/DEMO | OSRM public, straight-line fallback |
| POI | LIVE/DEMO | Overpass, DEMO facilities fallback |
| Soil | LIVE (chain) | SoilGrids → Open-Meteo → DEMO, chain recorded |
| AI/ML | SYNTHETIC-DEMO (honest) | RF metrics on file, `data_kind: SYNTHETIC-DEMO`; deterministic rules fallback; no LLM APIs |
| Drones | SIMULATION (+LIVE WS) | wss handshake Open, 2 Hz telemetry frames flowing; labeled SIM link without hardware |
| Sensors | SIMULATION | Same telemetry path; no fabricated hardware claims |
| Auth | FUNCTIONAL | Gateway key + PyJWT + OPERATOR_KEYS server-side; mutations require Bearer |
| CORS | STRICT | `CORS_STRICT=true`, ACAO echoes exactly the Vercel origin |
| WebSocket | LIVE | `wss://…/ws/telemetry` (main.py:151) + `/ws/telemetry-v1`; hook reconnects with backoff, UI degrades to SIMULATION when down |

## Scans (2026-09-24)

- Paid-service scan (src + backend): no openai/anthropic/mapbox/billing/auth SaaS —
  only false positives ("travelling", "coherent", "No Google/Mapbox tokens" copy).
- Dead-URL scan: no `backend-production-47f1` references remain in repo.
- Secret scan: no sk-/AKIA/private-key/APIza tokens; `.env`/`.db` untracked
  and git-ignored; server creds (JWT_SECRET, OPERATOR_KEYS, DATABASE_URL)
  appear in src only as UI label text, never values.
- `NEXT_PUBLIC_*` in bundles: API_BASE, WS_URL, GATEWAY_KEY (publishable by
  design), FORCE_DEMO, MAP_STYLE. Nothing server-private.

## Tests

- `npm run typecheck` clean · `npm run lint` clean · `npm test` 7/7 ·
  `npm run build` static OK · `python -m pytest -q` 51/51 ·
  `pip install --dry-run -r requirements.txt` resolves (incl. psycopg2 pin).

## Remaining states (by design)

- DEMO: fallback rows when backend unreachable; gallery reference imagery.
- SIMULATION: drone/sensor link, terrain/twin, flood timeline.
- NOT_CONFIGURED: FIRMS, Earthdata, Copernicus, ISRO, IMD, SMS/push/email.
- Known limitations: SQLite ephemeral on Railway (reseeds on boot — registry
  always present); Postgres needs `DATABASE_URL` + redeploy to activate;
  old orphaned Railway domain (other owner) still 404s — superseded.
