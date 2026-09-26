# DRISHTI-X backend restore runbook (2026-09-26)

The FastAPI backend is implemented, tested (51/51 pytest), and Docker-ready.
It is currently OFFLINE because the Railway trial expired
(`railway up` → "Your trial has expired"). No code changes are needed —
only a funded/suitable host plus server environment.

## What to restore (unchanged code)

- Entry: `backend/` → `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  (`backend/Dockerfile` already uses `${PORT:-8000}`; image builds clean).
- Health: `GET /docs`, `GET /openapi.json`, `GET /api/v1/model-health`.
- Auth: `POST /api/v1/auth/token`, `GET /api/v1/auth/me`,
  `POST /api/v1/auth/logout` (PyJWT HS256, 12h, OPERATOR_KEYS).

## Why not the alternatives (evaluated, rejected)

- Vercel `services.backend`: builds (`λ services/backend/fastapi`) but
  serves no HTTP on `/api/backend/*` (edge 404, no body). Routing
  contract unknown; blind experiments risk the working frontend.
- Vercel Python serverless (`api/` + Mangum): sklearn+pandas exceed the
  250MB serverless limit. Not viable.
- HuggingFace Spaces / Render / Fly.io / Koyeb / Oracle: all require
  interactive signup/OAuth/tokens not available here; no credentials
  will be invented. Railway remains the path of least change.

## Server environment (NAMES ONLY — set in the host vault, never Git)

Required: `GATEWAY_KEY`, `JWT_SECRET`, `OPERATOR_KEYS`
(user:role:secret,…), `CORS_ORIGINS`
(`https://drishti-ai-command-center.vercel.app`), `CORS_STRICT=true`.
Optional: `DATABASE_URL` (default SQLite seeds itself), `TELEMETRY_HZ`,
`RAIN_*`, `WARN_PROB_*`, provider keys (all empty → honest
NOT_CONFIGURED). Generate fresh secrets; never reuse exposed ones.

## Restore steps (owner)

1. Fund/select the Railway project (or any Docker host with a stable
   HTTPS URL, env vault, and long-running services).
2. Deploy `backend/` (Dockerfile) with the env above.
3. Verify: `/docs`, `/openapi.json`, `/api/v1/model-health` → 200.
4. Auth matrix with a NEW operator credential: valid → 200+JWT;
   wrong → 401; `/me` with/without token; logout; RBAC allow/deny.
5. Set Vercel `NEXT_PUBLIC_API_BASE` (+ `NEXT_PUBLIC_WS_URL`) to the
   backend URL; redeploy frontend; verify login end-to-end.
6. Never commit secrets; never put server keys in `NEXT_PUBLIC_*`.

## Current status

OFFLINE. Frontend login correctly reports service-unavailable (no fake
auth). All other modules degrade per their honest states.
