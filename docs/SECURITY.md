# SECURITY.md (docs mirror — canonical: /SECURITY.md)

Summary of the implemented posture; details and reporting contact in root `SECURITY.md`.

- RBAC roles: citizen, public_user, volunteer, field_officer/responder, emergency_responder, police, fire_service, healthcare, municipal/district/state operators + admins, sys_admin.
- Uploads: allow-listed image/video types, 15 MB cap, ≤4 files, malware-scan hook point.
- Rate limits on ML/AI/incident endpoints; security headers via `next.config.js` (nosniff, SAMEORIGIN, geolocation/camera-only permissions).
- Privacy: reports UNVERIFIED by default, contact optional, GPS rounded in SOS display paths, no tracking in family/report flows.
- Dev-only: default gateway key, open CORS, SQLite, minimal JWT decoder — see root SECURITY.md before any shared deploy.
