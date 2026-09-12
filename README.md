# DRISHTI-X — Sovereign Real-Time Disaster Intelligence Command Center

🌐 **Live Demo:** https://drishti-ai-command-center.vercel.app/welcome
📡 **Live API:** https://backend-production-47f1.up.railway.app/api/health

**Routes:** `/` → cinematic welcome poster · `/command` → operator deck ·
`/safety` → citizen dashboard · 20+ tactical + citizen routes (see tree below).

Offline-first drone mesh HUD: **Next.js 14 (App Router) + Three.js + Leaflet + FastAPI WebSockets**.
Zero paid APIs — CartoDB/OSM tiles only. Tactical dark HUD (`#051424`, `#00d2ff` cyan).

## Architecture

```text
drishti-ai-command-center/
├── .github/workflows/   # deploy.yml (build/test/docker) + pr-check.yml (lint/typecheck)
├── backend/             # FastAPI (Python 3.11) — REST + WebSocket telemetry mesh
│   ├── app/main.py                # entrypoint, CORS, legacy routes + v1 routers
│   ├── app/config.py              # env / gateway keys
│   ├── app/telemetry.py           # legacy re-export (canonical: services/telemetry_engine.py)
│   ├── app/models/telemetry.py    # Pydantic schemas
│   ├── app/services/connection_manager.py + telemetry_engine.py
│   ├── app/routers/api_v1.py      # /api/v1/telemetry, /drones, /sensors
│   ├── app/routers/ws_telemetry.py# /ws/telemetry-v1 (legacy /ws/telemetry in main.py)
│   ├── Dockerfile + requirements.txt
├── src/                 # Next.js 14 frontend
│   ├── app/page.tsx               # → redirects / to /welcome (poster front door)
│   ├── app/welcome/page.tsx       # Cinematic poster landing (ENTER-to-enter)
│   ├── app/command/page.tsx       # Master Command Operations Deck (moved from /)
│   ├── app/{drones,twin,location,simulation,resources,shelter,reunion,recovery,portal,platform}/
│   │                               # 10 tactical routes: pillars + Location Intel, Citizen Portal, Platform Specs
│   ├── app/{safety,risk,emergency,alerts,nearby,evacuate,report,family,plan,kit,learn,talk}/
│   │                               # 12 citizen routes: public-safety platform (see below)
│   ├── components/DigitalTwin.tsx + RadarMap.tsx + TelemetryFeed.tsx (canonical)
│   ├── components/3d/DigitalTwinCanvas.tsx / maps/DroneLeafletTracker.tsx
│   ├── components/dashboard/LiveTelemetryTable.tsx + HeaderBar.tsx
│   ├── components/alerts/GeofenceBreachModal.tsx
│   ├── hooks/useTelemetrySocket.ts # reconnecting WS client
│   └── utils/apiClient.ts + geofenceDetection.ts (point-in-polygon)
│       + geocode.ts (Nominatim search, haversine/bearing)
├── public/              # static assets
├── docker-compose.yml   # one-click launcher
```

## Commands (detailed reference)

### A. First-time setup — run once per machine

```powershell
cd drishti-ai-command-center\backend
copy .env.example .env
```
Copies the example settings file into a real `.env` the server actually reads.
What it sets: `GATEWAY_KEY` (password for REST calls), `CORS_ORIGINS` (which
sites may call the API), `TELEMETRY_HZ` (packets per second). The `.env` file is
git-ignored, so your local values never get committed.

```powershell
pip install -r requirements.txt
```
Installs the Python packages listed in `requirements.txt` (FastAPI, Uvicorn,
Pydantic, pytest, httpx). Run it from inside `backend/`. Success looks like a
trail of `Successfully installed ...` lines with no red errors.

```powershell
cd drishti-ai-command-center
copy .env.local.example .env.local
```
Same idea as above, for the web app: creates `.env.local` holding
`NEXT_PUBLIC_API_BASE` (where the API lives), `NEXT_PUBLIC_WS_URL` (where the
live stream lives) and `NEXT_PUBLIC_GATEWAY_KEY` (must match the server's
`GATEWAY_KEY`). Also git-ignored.

```powershell
npm install
```
Downloads the JavaScript packages from `package.json` (Next.js, React, Leaflet,
Three.js, Tailwind, lucide-react) into `node_modules/`. Takes 1–3 minutes the
first time. `package-lock.json` pins exact versions so every machine gets the
same tree.

### B. Daily local run — two terminals

Terminal 1 — start the live data server:
```powershell
cd drishti-ai-command-center\backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- `app.main:app` — load the `app` object from `app/main.py`.
- `--host 0.0.0.0` — listen on all network interfaces (reachable as `localhost`).
- `--port 8000` — serve on port 8000.
- `--reload` — auto-restart whenever you edit Python files.
- Success: log lines ending in `Uvicorn running on http://0.0.0.0:8000`.
- Prove it: open http://localhost:8000/api/health → `{"ok":true,...}`.
- The live stream lives at ws://localhost:8000/ws/telemetry.

Terminal 2 — start the web app:
```powershell
cd drishti-ai-command-center
npm run dev
```
- Runs the Next.js development server with hot-reload (edits appear instantly).
- Success: `✓ Ready in ... ms` followed by `○ Local: http://localhost:3000`.
- Open http://localhost:3000 and press **Ctrl+F5** (hard reload) so the fresh
  stylesheet, map tiles and 3D canvas load. `/` lands on the welcome poster —
  press ENTER (or INITIALIZING) to enter; the operator deck lives at
  `/command`, citizen dashboard at `/safety`. Command nav carries 11 routes
  (`/command`, `/drones`, `/twin`, `/location`, `/simulation`, `/resources`,
  `/shelter`, `/reunion`, `/recovery`, `/portal`, `/platform`).

### C. Verify everything still works

```powershell
npx tsc --noEmit
```
Type-checks all TypeScript without writing files. No output = clean. Fix any
`error TS...` lines it prints before committing.

```powershell
npm run build
```
Runs the full production build (compile + lint + static pages). Ends with a
route-size table. ⚠️ Run this only when the dev server (`npm run dev`) is
stopped — both share the `.next/` folder and building while dev runs can
corrupt its stylesheet manifest (page renders unstyled until dev restarts).

```powershell
python -m compileall app
```
Quick syntax check of the Python service (run from `backend/`). Prints nothing
on success.

### D. One-click launcher (Docker)

```powershell
docker compose up --build
```
Builds the `backend` image from `backend/Dockerfile` and starts both services:
API on http://localhost:8000, web app on http://localhost:3000. Re-run with
`--build` after changing Python code or `requirements.txt`. Stop everything
with **Ctrl+C**, or `docker compose down` to remove the containers.

### E. Ship to the live sites

```powershell
railway up -y -d
```
(From `backend/`.) Uploads the service and deploys it to Railway unattended
(`-y` accepts defaults, `-d` detaches from logs). First run creates the
project; afterwards it redeploys the same service. Pair with
`railway domain` (public URL) and `railway variables set KEY=value`.

```powershell
vercel --prod --yes
```
(From the repo root.) Uploads the web app and promotes it to the production
URL. `NEXT_PUBLIC_*` values are baked in at build time, so set them first via
`vercel env add <NAME> production --value "<v>" --visibility config --no-sensitive --yes`,
then redeploy.

```powershell
git add -A
git commit -m "feat: describe the change"
git push origin main
```
Stage everything, snapshot it with a message, and upload to GitHub. CI
(`.github/workflows/`) type-checks, builds and containerizes each push.

## Auth (dev only)
`GATEWAY_KEY=drishti-mesh-dev-key-2025` must match
`NEXT_PUBLIC_GATEWAY_KEY`. Frontend sends `Authorization: Bearer <key>` for REST.
WS stream stays open for local HUD.

## Citizen access (no login, no keys, no cost)
- **Public mode** (toggle in the top bar): My Safety (`/safety`), Check My Risk (`/risk`),
  Alert Center (`/alerts`), Help Near Me (`/nearby`, real OSM data via Overpass),
  Safe Evacuation (`/evacuate`), Emergency (`/emergency`), Report (`/report`),
  Family (`/family`), Plan (`/plan`), Kit (`/kit`), Learn (`/learn`), Talk (`/talk`).
- **Command mode**: the full operator deck (default view).
- Every data panel carries a trust badge: LIVE / SIMULATION / DEMO + source.
  Demo hazard cells, shelters and alerts live in `src/data/providers.ts` behind
  provider interfaces (`Hazard/Shelter/Alert/Weather/Hospital/Evacuation/Incident/Drone`),
  so official APIs can replace them later without touching pages.
- Personal data (reports, family, checklists) stays in the browser's localStorage.
- PWA shell (`public/manifest.json` + `sw.js`) caches safety/emergency pages for offline use.
