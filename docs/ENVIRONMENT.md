# DRISHTI-X environment variables (from `.env.example`, all optional)

| Name | Purpose | Required | Used by | Safe example |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_BASE` | Backend origin for API calls | No (defaults localhost:8000) | Browser bundles | `https://api.example.com` |
| `NEXT_PUBLIC_WS_URL` | Telemetry WebSocket URL | No | Browser | `wss://api.example.com/ws/telemetry` |
| `NEXT_PUBLIC_GATEWAY_KEY` | Publishable gateway key (mutations only) | No | Browser | *(generate, never commit real)* |
| `NEXT_PUBLIC_MAP_STYLE` | MapLibre style URL | No | Browser | OpenFreeMap default in code |
| `NEXT_PUBLIC_FORCE_DEMO` | Force demo mode | No | Browser | `true`/`false` |
| `NEXT_PUBLIC_*_API_KEY` (weather/map/satellite) | Optional provider keys | No | Browser (optional paths) | empty |
| `DATABASE_URL` | Postgres URL (default SQLite file) | No | Backend | `postgresql+psycopg2://user:****@host/db` |
| `GATEWAY_KEY` | Server gateway secret | Rotate in prod | Backend | *(generate)* |
| `JWT_SECRET` / `OPERATOR_KEYS` | Auth signing + operator logins | Rotate in prod | Backend | *(generate)* |
| `CORS_ORIGINS` / `CORS_STRICT` | Allowed origins + strict mode | Recommended prod | Backend | `https://app.example.com` / `true` |
| `WEATHER_PROVIDER` / `IMD_API_KEY` / `RAIN_*` / `WARN_PROB_*` | Weather chain config | No | Backend | documented defaults |
| `SATELLITE_PROVIDER` / `COPERNICUS_USER` / `EARTHDATA_TOKEN` / `FIRMS_MAP_KEY` / `NASA_API_KEY` | Satellite/fire providers | No (NOT_CONFIGURED when empty) | Backend only | empty |
| `SMS_*/PUSH_*/WEB_PUSH_*/SMTP_*` | Notifications | No | Backend only | empty |
| `STORAGE_*` | MinIO/S3-compatible storage | No (local FS default) | Backend only | empty |
| `MAX_UPLOAD_MB` / `ML_*` / `AI_PROVIDER` / `OLLAMA_*` | Uploads, model dir, local AI | No | Backend | defaults |

Rules: never commit real secrets; frontend only `NEXT_PUBLIC_*`; provider keys server-side only; all keys optional (app runs keyless in DEMO MODE).
