# API-MAP.md

85 endpoints / 28 groups (`backend/app/main.py` → `routers/`; interactive docs at `http://localhost:8000/docs`).
Legacy: `api_v1` (telemetry/WS), `ws_telemetry`. Platform: `ml`, `model_health`, `weather`, `rainfall`, `sensors`, `satellite`, `terrain`, `history`, `warnings`, `roads`, `response`, `notifications`, `incidents`, `vision`, `grid`, `risk`, `alerts`, `sync`, `admin`, `nesafe`, `regions` (10), `ai`, `resources`, `sectors`, `ops`, `auth`.
Mutations: Bearer (gateway key or PyJWT) + RBAC + rate limits + audit. Reads: open with honest status bodies. Full table: `docs/API.md`.
