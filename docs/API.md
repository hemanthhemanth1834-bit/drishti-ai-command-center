# API.md — backend groups (`/api/...`, interactive docs at `http://localhost:8000/docs`)

| Group | Key endpoints | Auth |
|---|---|---|
| telemetry (legacy) | `GET /api/health`, `/api/telemetry`, `/api/scenario`, `/ws/telemetry` | Bearer on REST |
| ml | `/api/v1/ml/predict|batch-predict|model|health|features|explain/{id}` | open read; key for batch |
| model-health | `GET /api/v1/model-health` | open |
| weather/rainfall | `/api/v1/weather/*`, `/api/v1/rainfall/*` | open |
| sensors | `/api/v1/sensors/*` (+ legacy `GET /api/v1/sensors`) | key on ingest |
| satellite/terrain/history | `/api/v1/satellite/*`, `/terrain/*`, `/history/*` | open read; key on import |
| warnings/alerts | `/api/v1/warnings/*`, `/api/v1/alerts/*` | key on evaluate/create/ack |
| roads/response | `/api/v1/roads/*`, `/api/v1/response/*` | key on blockage |
| incidents/vision | `/api/v1/incidents/*`, `/api/v1/vision/*` | key on create/verify |
| regions | `/api/regions/countries|states|districts|cities|localities|disasters|sectors|agencies|geocode|route` | open |
| ai | `/api/v1/ai/status|summarize|classify` | rate-limited, open |
| resources | `/api/v1/resources`, `/shelters`, `/nearest-shelter`, occupancy | key on occupancy |
| sectors | `/api/v1/sectors/impact` (LIVE/CALCULATED/DEMO/NOT_AVAILABLE) | open |
| ops | `/api/v1/ops/health` (errors, latency, inference, sync, db) | open |
| grid/risk | `/api/v1/grid/risk-cells`, `/api/v1/risk/assess` | open |
| sync/notify/admin | `/api/v1/sync/*`, `/api/v1/notifications/*`, `/api/v1/admin/*` | key on send/verify/admin |

Errors are honest: 400 validation, 401/403 auth, 429 rate limit, `NOT_CONFIGURED` bodies (never fake success).
