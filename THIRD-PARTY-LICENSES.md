# THIRD-PARTY-LICENSES.md

Key dependencies, data sources and assets. Check exact versions in
`package.json`, `backend/requirements.txt`, `docker-compose.yml`.

## Code libraries
| Item | License | Notes |
|---|---|---|
| Next.js 14 / React 18 | MIT | frontend framework |
| Three.js (MIT), R3F/drei (MIT) | MIT | 3D twin/terrain |
| Leaflet 1.9 (BSD-2), MapLibre GL (BSD-3) | BSD | maps |
| Tailwind 3 (MIT), framer-motion (MIT), lucide-react (ISC) | MIT/ISC | UI |
| FastAPI / Uvicorn / Pydantic / Starlette | MIT/BSD | backend |
| scikit-learn (BSD), pandas (BSD), numpy (BSD), SQLAlchemy (MIT) | BSD/MIT | ML + DB |
| PostGIS (GPLv2), Valkey (BSD-3), MinIO (AGPLv3), Mailpit (MIT) | mixed | compose profile only |
| Valkey note: BSD-3 fork of Redis, safe for self-hosting. MinIO AGPLv3 applies if you modify/redistribute MinIO itself; using it as object storage over S3 API is normal self-host use. |

## Data / tiles / imagery
| Source | License/terms | Attribution shown |
|---|---|---|
| OpenStreetMap tiles/data | ODbL 1.0 | in-app + /data-sources |
| Open-Meteo | CC-BY 4.0 | in-app + README |
| SoilGrids/ISRIC | CC-BY 4.0 | in-app |
| NASA GIBS | open, per NASA media guidelines | where used |
| Copernicus Sentinel | free with account, per CSCDA terms | adapter only (not connected) |
| Overpass/Nominatim | ODbL / usage policy (1 req/s, user-agent) | throttled + cached |
| `public/poster.jpg` | project artwork (do not redistribute without permission) | — |

## Fonts/media
System fonts + inline SVG; no redistributed third-party images. Citizen uploads remain the reporter's responsibility; reports are UNVERIFIED by default.
