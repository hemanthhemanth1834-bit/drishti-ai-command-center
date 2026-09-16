# FREE-STACK.md — verified free/open stack audit

Only `READY`/`LIVE` marks were actually tested (backend pytest + live HTTP checks 2026-09-16).
Target: **₹0 mandatory recurring API cost** for the core app.

| Function | In use | Free/open alternative | Status |
|---|---|---|---|
| Maps (2D) | Leaflet + OSM tiles | OpenStreetMap (ODbL) | LIVE (tested) |
| 3D GIS | MapLibre GL + R3F/Three.js | OpenFreeMap style, no key | READY (keyless) |
| Weather | Open-Meteo adapter | Open-Meteo (CC-BY 4.0) | LIVE (tested) |
| Official weather | IMD stub | IMD (where permitted) | NOT CONFIGURED |
| Rainfall | Open-Meteo / NASA GPM adapter | Open-Meteo live; GPM needs Earthdata login | LIVE / CONFIG REQUIRED |
| Routing | OSRM adapter + straight-line fallback | OSRM demo server / self-host | LIVE (tested, demo server) |
| Geocoding | Nominatim adapter (cache + 1 req/s) | Nominatim usage policy | LIVE (tested) |
| AI classification | keyword-v0 + RF model | scikit-learn (BSD) | READY (heuristic labeled) |
| AI summarization | local extractive / Ollama adapter | Ollama (local, MIT-ish per model) | READY / NOT CONFIGURED |
| CV | filename-heuristic interface | OpenCV/PyTorch/YOLO (to be wired) | SIMULATED |
| GIS data | GeoJSON + app math | OSM/Overpass/Nominatim | LIVE (tested) |
| Satellite | adapters only | NASA GIBS (live tiles) / Copernicus / ISRO | EXTERNAL / NOT CONFIGURED |
| Database | SQLAlchemy + SQLite file | PostgreSQL/PostGIS (compose profile) | READY / NOT DEPLOYED |
| Cache/queue | in-memory + IndexedDB | Valkey (compose profile) | READY / NOT DEPLOYED |
| 3D | Three.js (MIT) | — | READY |
| Charts | inline SVG (no lib) | Recharts/D3 if needed | READY (zero-dep) |
| Icons | lucide-react (ISC) | — | READY |
| Realtime | native WebSocket + polling | Socket.IO/SSE if needed | READY |
| Email dev | SMTP adapter | Mailpit (compose profile) | NOT CONFIGURED |
| Auth | Bearer + PyJWT RBAC | PyJWT (HPND), self-hosted IdP later | READY (prototype-grade) |
| Testing | pytest (backend) + vitest (frontend) | both free/open | READY |
| Storage | local FS + MinIO adapter | MinIO (compose profile) | READY / NOT CONFIGURED |
| Hosting | Vercel (frontend) + Docker | any Docker host | READY |

Nothing above requires payment. Paid options may only ever be OPTIONAL.
