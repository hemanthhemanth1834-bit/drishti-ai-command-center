# DRISHTI-X FREE-SOURCES AUDIT (2026-09-24)

Strict policy: $0 external API cost. Every provider below is free, open,
public, or no-cost. Removed 2026-09-24: Google Places API (New) +
Google Maps embed/key path (billing-gated) — replaced by OSM/Nominatim.

Honesty states used across UI: LIVE · RECENT · LATEST_AVAILABLE · CACHED ·
DEMO · SIMULATED/SIMULATION · HISTORICAL · STALE · OFFLINE · NOT_CONFIGURED ·
NO_FEED. Demo never silently becomes live (asserted in tests).

## Live providers (keyless, $0)

| Provider | Purpose | URL | Free/Public | Key? | Cost | Fallback | Usage | State |
|---|---|---|---|---|---|---|---|---|
| Open-Meteo forecast API | Weather + precipitation/rainfall | https://open-meteo.com/ | Free, no key (CC-BY 4.0 attribution in-app) | No | $0 | DEMO rows / STALE cache | `backend/app/routers/weather.py`, `rainfall.py`, `src/lib/liveServices.ts` | LIVE (verified prod 2026-09-24) |
| USGS Earthquake GeoJSON | Earthquakes M2.5+/7d | https://earthquake.usgs.gov/ | Public, no key | No | $0 | OFFLINE note | `src/lib/liveServices.ts`, DisasterMap EARTHQUAKE layer | LIVE |
| NASA GIBS WMTS | Satellite true-color / 7-2-1 tiles | https://gibs.earthdata.nasa.gov/ | Public, no key | No | $0 | OSM base map | DisasterMap SATELLITE layer, per-tile liveness measured | LATEST_AVAILABLE (daily NRT) |
| OpenStreetMap tiles | Base maps, search context | https://tile.openstreetmap.org/ | Free (tile policy + attribution) | No | $0 | Local grid fallback | Leaflet bases, Nominatim search | LIVE |
| Nominatim | Geocoding + reverse | https://nominatim.openstreetmap.org/ | Free (1 req/s, attribution; throttled + cached in-app) | No | $0 | OFFLINE note | `src/utils/geocode.ts`, `/location` | LIVE |
| Overpass API | POIs (shelters/hospitals) | https://overpass-api.de/ | Free, no key | No | $0 | DEMO facilities | Maps/shelter flows | LIVE/DEMO |
| OSRM demo server | Routing | https://router.project-osrm.org/ | Free demo, no key | No | $0 | Straight-line fallback | `/regions` route helper | LIVE/DEMO |
| SoilGrids (ISRIC) | Soil data | https://soilgrids.org/ | Free, no key | No | $0 | Open-Meteo → DEMO chain recorded | Weather/terrain chain | LIVE |
| CARTO basemaps | Dark/light tiles | https://carto.com/basemaps/ | Free with attribution | No | $0 | OSM tiles | `mapProvider.ts` leaflet bases | LIVE |
| Esri World Imagery | Satellite basemap | https://server.arcgisonline.com/ | Free with attribution (Maxar/Earthstar) | No | $0 | OSM tiles | `mapProvider.ts` satellite base | LIVE |
| OpenTopoMap | Terrain tiles | https://opentopomap.org/ | Free (CC-BY-SA) | No | $0 | OSM tiles | `mapProvider.ts` terrain base | LIVE |
| OpenFreeMap | MapLibre vector style | https://openfreemap.org/ | Free (OpenMapTiles + OSM) | No | $0 | OSM raster | `MapLibreCommand`, NE-SAFE | LIVE |

## Optional-registration providers (free tier, server-side only, NOT_CONFIGURED when absent)

| Provider | Purpose | Free status | Key location | Fallback | State |
|---|---|---|---|---|---|
| NASA FIRMS | Active-fire points | Free MAP_KEY after signup | Server env `FIRMS_MAP_KEY` (never NEXT_PUBLIC_*) | NOT_CONFIGURED + MODIS 7-2-1 burn-scar view | NOT_CONFIGURED |
| NASA Earthdata | GPM/IMERG bulk download | Free login | Server env `EARTHDATA_TOKEN` | GIBS context layers | NOT_CONFIGURED |
| Copernicus (Sentinel-1/-2) | SAR/MSI analysis | Free account | Server env `COPERNICUS_USER` | GIBS tiles | NOT_CONFIGURED |
| ISRO Bhuvan/Bhoonidhi | India layers | Varies by dataset | Server-side only | GIBS/Esri | NOT_CONFIGURED |
| IMD | Official India weather | Opt-in stub, never synthesized | Server env `IMD_API_KEY` | Open-Meteo | NOT_CONFIGURED |
| OLLAMA (local) | Optional local LLM summaries | Free, localhost | Server env `OLLAMA_BASE_URL` | Deterministic rule-based brief (default) | NOT_CONFIGURED by default |

Core AI/ML never needs any of the above: scikit-learn RandomForest
(`backend/ml/`: schemas → features → train → joblib artifacts →
inference registry → monitoring) + deterministic weighted risk fallback.
Model on file is SYNTHETIC-DEMO and labeled as such everywhere
(`data_kind: SYNTHETIC-DEMO`). No OpenAI/Anthropic/Gemini/paid LLM in
code or dependencies (verified by scan 2026-09-24).

## Removed (paid / billing-gated)

| Removed | Replacement | Files changed 2026-09-24 |
|---|---|---|
| Google Places API (New) — billing-enabled key | OSM/Nominatim place record (name/address/type/coords) | Deleted `src/utils/googlePlaces.ts`; `/location` uses OSM only |
| Google Maps embed + key toggle | Leaflet/DroneLeafletTracker OSM radar only | `src/app/location/page.tsx` |
| Google status badge | Free-basemap note | `src/app/risk-map/page.tsx` |
| `googleStatus()` + `'google'` MapKind | Removed from provider abstraction | `src/platform/mapProvider.ts` |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` placeholder | Removed (+ free-only note) | `.env.example` |
| Dockerfile missing `ml/` (prod crash, not cost) | Added `COPY ml ./ml` | `backend/Dockerfile` |

## Architecture (all free / open-source)

- Database: SQLite file fallback (local dev + current prod, seeded registry);
  PostgreSQL/PostGIS-ready via `DATABASE_URL` (documented path; requires
  adding a psycopg2 driver to `backend/requirements.txt` — not yet installed).
  No paid managed DB required.
- Auth: existing app auth — PyJWT HS256 + gateway key + `OPERATOR_KEYS`,
  SQLite-backed, rate-limited, audited. No Auth0/Clerk/Firebase.
- Storage: local filesystem (+ MinIO-ready via compose `--profile full`, OSS).
- Realtime: own FastAPI WebSocket telemetry + polling + IndexedDB offline
  queue. No Pusher/Ably/paid realtime.
- Maps/GIS: Leaflet + MapLibre GL JS + GeoJSON + local haversine; PostGIS
  path documented. No Google/Mapbox/HERE SDKs (verified by scan).
- Notifications: in-app live only; SMS/push/email report NOT_CONFIGURED
  until a free provider is wired. Nothing paid is called.
- Hosting: portable Docker (`backend/Dockerfile`, `$PORT` convention) +
  Next.js frontend. Runs fully local at $0 (SQLite + keyless providers);
  current prod: Vercel (frontend) + Railway (backend service). No code
  lock-in — backend deploys anywhere Python 3.11 runs.

## Keys required for $0 operation

None. Full functionality degrades honestly: LIVE (keyless) → CACHED →
DEMO/SIMULATION (labeled) → NOT_CONFIGURED / NO_FEED / OFFLINE.

## Verification (2026-09-24)

- `npm run typecheck` clean · `npm run lint` clean · `npm test` 7/7 ·
  `npm run build` static OK · `python -m pytest -q` 51/51
- Paid-provider scan (src + backend): no openai/anthropic/mapbox/billing SDKs
- Secret scan: no sk-/AKIA/private-key/APIza tokens in code; `.env`/`.db`
  untracked by git; server keys never in `NEXT_PUBLIC_*`
- Prod backend probed live: weather LIVE (Open-Meteo), rainfall observed+
  forecast, thresholds, providers (IMD NOT_CONFIGURED), 26 AP districts,
  cities, model-health HEALTHY + SYNTHETIC-DEMO
