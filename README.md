# DRISHTI-X — Sovereign Real-Time Disaster Intelligence Command Center

🌐 **Live Demo:** https://drishti-ai-command-center.vercel.app
📡 **Live API:** https://backend-production-47f1.up.railway.app/api/health

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
│   ├── app/page.tsx               # Master Command Operations Deck
│   ├── app/{drones,location,simulation,resources,shelter,recovery,portal}/
│   │                               # 7 tactical sub-routes + Location Intel (OSM geocode)
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

## 1. Backend (port 8000)
```powershell
cd drishti-ai-command-center\backend
copy .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Health: http://localhost:8000/api/health (+ `/api/v1/health`)
WS: ws://localhost:8000/ws/telemetry (+ `/ws/telemetry-v1`)

## 2. Frontend (port 3000)
```powershell
cd drishti-ai-command-center
copy .env.local.example .env.local
npm install
npm run dev
```
Open http://localhost:3000 — live telemetry feed, Three.js digital twin, Leaflet radar.

## Docker (one-click)
```powershell
docker compose up --build
```

## Auth (dev only)
`GATEWAY_KEY=drishti-mesh-dev-key-2025` must match
`NEXT_PUBLIC_GATEWAY_KEY`. Frontend sends `Authorization: Bearer <key>` for REST.
WS stream stays open for local HUD.
