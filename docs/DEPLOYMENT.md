# DEPLOYMENT.md

- Frontend → Vercel (this repo's `vercel.json` wires frontend + backend services; production serves the frontend, platform APIs need the FastAPI backend or pages show labeled DEMO).
- GitHub `main` → Vercel Git integration → production. NEVER `vercel --prod` (CLI deployment is unauthorized in this project flow).
- Current production: frontend Ready (commit `b4275aa`); backend OFFLINE — Railway trial expired 2026-09-26, redeploy blocked without a paid plan (no paid action taken per free-sources policy).
- Backend → any Docker host: `docker compose up --build` (SQLite). Full: `docker compose --profile full up --build` (PostGIS :5432, Valkey :6379, MinIO :9000/:9001, Mailpit :8025/:1025). Or Railway-style host with `DATABASE_URL`, `GATEWAY_KEY`, `CORS_ORIGINS`, `CORS_STRICT=true`.
- CI (`.github/workflows/`): Node 20 typecheck+lint+build; Python 3.11 compile + pytest; backend image build.
- Env: copy `.env.example` → `.env.local` (frontend) and `backend/.env.example` → `backend/.env`. All keys optional; rotate `GATEWAY_KEY`/`JWT_SECRET` in production and tighten `CORS_ORIGINS`.
