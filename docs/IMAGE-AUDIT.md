# DRISHTI-X Image Audit (2026-09-26)

Full-repository inspection: 54 routes (`src/app`), 85 components, `public/img/`
(26 SVG + 6 verified JPGs), `public/assets/drishti-x/real-world/` (30 folders,
5 vendored NASA public-domain binaries + metadata-only registries).

## Classification legend

- VERIFIED REAL — genuine observation, license verified → KEEP
- PROJECT ORIGINAL — in-repo SVG/diagram → KEEP (label DEMO/REFERENCE where shown)
- ILLUSTRATIVE — labeled as such in UI → KEEP + LABEL
- DIAGRAM — technical schematics stay diagrams → KEEP
- PLACEHOLDER — stock/unverified masquerading as content → REPLACE/REMOVE IF USED

## Findings

| # | Asset / area | Class | Action taken |
|---|---|---|---|
| 1 | `public/img/photos/*.jpg` (6) | VERIFIED REAL (NASA/FEMA/USN PD) | KEPT; catalogued in `src/data/images/imageRegistry.ts` |
| 2 | `public/assets/.../real-world/*.jpg|png` (5) | VERIFIED REAL (NASA EO PD) | KEPT; added to registry; wired into gallery |
| 3 | `public/img/*.svg` (26) | PROJECT ORIGINAL / DIAGRAM | KEPT; `ml-pipeline.svg` retired from /ml + /prediction (homepage frozen use remains) |
| 4 | `GeospatialIntelGallery` 6× Unsplash hotlinks + fabricated metrics (142.8 km², 968 hPa, 0.932 mAP…) | PLACEHOLDER | REPLACED with registry-backed local images + real metadata (commit f3ad467); zero `images.unsplash.com` refs remain in `src/` |
| 5 | `reference-home.png`, `public-exact-format/` package | PLACEHOLDER (unused) | NOT INTEGRATED; untouched on disk |
| 6 | GIBS tiles, OSM/Esri/Carto/OpenTopo tiles, Leaflet/MapLibre maps | VERIFIED REAL (live) | KEPT; extended via `osmTileUrl` previews |
| 7 | `VisionPanel` 91%/87%/78%, `DroneSwarmScene` 94.2, `providers.ts`/`operational.ts` demo numbers | DEMO/SIMULATION (labeled) | KEPT — truthfully labeled, not imagery |
| 8 | Homepage (`/`) visuals | VERIFIED REAL + FROZEN | UNTOUCHED (structure frozen; images already verified) |
| 9 | 3D twin / drones / simulation / model-health | SIMULATION / TECHNICAL | UNCHANGED — no decorative photos added |
| 10 | `RealPhotoCard` (`src/components/visuals/RealPhotoCard.tsx`) | new shared primitive | ADDED; used on /weather, /resources, /response, /regions |

## Placeholder sweep (post-change)

`placeholder=` input hints only (standard HTML, not imagery). Zero hits for:
`lorem`, `picsum`, `placehold.co`, `dummy-image`, `temp-image`, `coming-soon`,
`sample/stock/random image`, `unknown source`, `images.unsplash.com` in `src/`.

## Provenance

- `public/img/SOURCES.md` — photo table + model-flow table + gallery table
- `src/data/images/imageRegistry.ts` — machine-readable, test-validated
  (missing source/license rejected; real+illustrative conflict rejected)
- `docs/IMAGE-ROUTE-MATRIX.md` — per-route visual inventory
- `docs/IMAGE-SOURCES.md`, `docs/DATA-SOURCES.md` — catalogs
