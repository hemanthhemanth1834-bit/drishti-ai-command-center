# SECURITY.md (docs mirror — canonical: /SECURITY.md)

Summary of the implemented posture; details and reporting contact in root `SECURITY.md`.

- RBAC roles: citizen, public_user, volunteer, field_officer/responder, emergency_responder, police, fire_service, healthcare, municipal/district/state operators + admins, sys_admin.
- Uploads: allow-listed image/video types, 15 MB cap, ≤4 files, malware-scan hook point.
- Rate limits on ML/AI/incident endpoints; security headers via `next.config.js` (nosniff, SAMEORIGIN, geolocation/camera-only permissions).
- Privacy: reports UNVERIFIED by default, contact optional, GPS rounded in SOS display paths, no tracking in family/report flows.
- Dev-only: default gateway key, open CORS, SQLite, minimal JWT decoder — see root SECURITY.md before any shared deploy.

## Verified 2026-09-26 (post-launch audit)

- Secret handling: env-only secrets; repo-wide scan for sk-/AKIA/private-key/APIza tokens: clean. No `.env`/`.db` tracked (gitignored + verified via `git ls-files`).
- Environment variables: all optional; frontend reads only `NEXT_PUBLIC_*` (publishable: API base, WS URL, gateway key by design, map style, demo flags). Server credentials (`GATEWAY_KEY`, `JWT_SECRET`, `OPERATOR_KEYS`, provider keys, DB/storage secrets) never leave the backend.
- API credentials: gateway Bearer key for mutations; `OPERATOR_KEYS` server-side role logins; no committed or client-exposed keys (FIRMS/Copernicus/Earthdata remain NOT_CONFIGURED).
- Client/server separation: browser never sees JWT secrets, DB URLs, or provider keys (verified by scan).
- Authentication: PyJWT HS256 login (`/api/v1/auth/*`), rate-limited + audited; in-memory frontend token, no refresh rotation (prototype-grade).
- Authorization/RBAC: 16 roles, least-privilege, `require_perm` on sensitive mutations.
- JWT: HS256, 12h, `require exp`; dev default key must be rotated in production.
- Gateway key behavior: dev default `drishti-mesh-dev-key-2025`; override via `GATEWAY_KEY`; publishable counterpart `NEXT_PUBLIC_GATEWAY_KEY` sends Bearer on mutations only.
- Security limitations: default gateway key, open CORS unless `CORS_STRICT=true`, SQLite default, no secret rotation automation, no paid monitoring.
- Production considerations: set `CORS_STRICT=true` + `CORS_ORIGINS`, rotate `GATEWAY_KEY`/`JWT_SECRET`/`OPERATOR_KEYS`, use Postgres + volumes, terminate TLS at host, keep Railway-style hosts' secrets in the platform vault (never in code).
