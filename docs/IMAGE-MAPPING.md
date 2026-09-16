# IMAGE-MAPPING.md — every visual wired to its page (correct image + feature + context + provenance)

Registry: `src/config/imageSources.ts` (30 pack entries) · mappings: `src/config/disasterVisuals.ts` ·
component: `src/components/visuals/DisasterImage.tsx` · manifest: `public/assets/drishti-x/real-world/manifest.json`.
Rule: static pack visuals are HISTORICAL/REFERENCE/DEMO; live imagery comes only from provider layers.

| Page | Visuals | Statuses |
|---|---|---|
| `/` (hero/side panels) | project SVGs (hero-scene, satellite, drone) | SIMULATION (decorative context) |
| `/` overview cards | lucide icons + live counts or DEMO | LIVE or DEMO |
| `/risk-map` | live GIBS VIIRS/MODIS/7-2-1 tiles + backend overlays + reference renders | LIVE + DEMO |
| `/satellite` | registry satellite entries (Worldview/GIBS, Sentinel, Bhuvan, FIRMS) + reference renders | NEAR_REAL_TIME / EXTERNAL / REFERENCE |
| `/weather` | dynamic wx-clear/rain/storm by measured mm | context for LIVE/DEMO data |
| `/terrain` | terrain.svg schematic | DEMO (procedural until SRTM) |
| `/history` | HISTORICAL registry library (NASA EO cases) + DB records + CSV import | HISTORICAL REFERENCE + DEMO/MIXED |
| `/prediction`, `/ml` | ml-pipeline.svg (method diagram, not evidence) | MODEL/DEMO |
| `/incidents` | user uploads (evidence) + road reference render | OBSERVED (user) / DEMO |
| `/response` | response.svg + shelter.svg + P1–P4 queue | DEMO + CALCULATED |
| `/regions` | regions.svg schematic + 7 sector cards | DEMO |
| `/notifications` | level badges + 9-language templates (no photos, intentional) | LIVE queue / NOT_CONFIGURED channels |
| `/offline` | offline-sync.svg (technical diagram) | LIVE mechanism |
| `/admin` | hero-command.svg reference render | DEMO |
| `/data-sources` | provider catalog incl. pack rows | mixed, labeled |
| `/model-health` | metrics only (no imagery, intentional) | MODEL / NOT AVAILABLE |

Disaster types (18: LANDSLIDE…MULTI_HAZARD) → `visualsFor()` in `disasterVisuals.ts`.
Sectors (7) → `SECTOR_VISUAL` (project SVG + registry category).
