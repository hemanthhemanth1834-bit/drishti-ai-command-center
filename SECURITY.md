# Security policy (prototype-grade)

DRISHTI-X is a **working prototype**, not hardened production infrastructure. If you deploy it beyond localhost, treat the items below as mandatory pre-work.

## What exists

- Bearer auth on mutating REST endpoints (gateway key, backward compatible) + JWT-ready role checks (`backend/app/services/security.py`).
- RBAC: citizen → field_officer → district_admin → state_admin → sys_admin.
- Per-identity rate limiting, upload type/size validation (≤15 MB, allow-listed extensions), audit log for alert/incident actions.
- Secrets via environment only; `.env*`, `backend/.env`, `*.db`, `ml/artifacts/` are gitignored.

## Development-only defaults (rotate before any shared deploy)

- `GATEWAY_KEY` default `drishti-mesh-dev-key-2025` (also in `docker-compose.yml`).
- `CORS_ORIGINS + "*"` in `app/main.py` (open CORS).
- SQLite file DB; hand-rolled minimal JWT decoder (replace with a JWT library + tests).

## Reporting a vulnerability

Open a **private** report via the repository owner's email (see README author section) with: affected version/commit, reproduction steps, and impact. Please allow reasonable time to fix before public disclosure. Do not open public issues containing exploit details or credentials.
