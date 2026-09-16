# IMAGE-SOURCES.md — every visual asset, traced

Rule: no image without source/license. Project SVGs are original
(disaster-intelligence diagrams, no factual events depicted). Reference
imagery is labeled EXAMPLE/REFERENCE/DEMO in the UI and is never evidence.

## Project-original SVG diagrams (`public/img/`, no license needed)

| Image | Purpose | Used on |
|---|---|---|
| `dis-landslide.svg` | landslide-on-road reference | /intelligence, /risk-map, /history, /regions(sectors) |
| `dis-flood.svg` | river/urban flood reference | /intelligence, /history, /regions(sectors) |
| `dis-cyclone.svg` | cyclone spiral reference | /history, /regions(sectors) |
| `dis-fire.svg` | wildfire reference | /regions(sectors) |
| `dis-earthquake.svg` | cracked-buildings reference | (library, future use) |
| `dis-drought.svg` | drought farmland reference | /regions(sectors) |
| `dis-storm.svg` | thunderstorm reference | (library, future use) |
| `dis-road.svg` | blocked-highway reference | /incidents, /roads, /regions(sectors) |
| `sat-before.svg` / `sat-after.svg` / `sat-change.svg` | before/after/change-detection concept renders | /intelligence, /risk-map, /satellite |
| `terrain.svg` | contour/slope schematic (not a DEM render) | /intelligence, /risk-map, /terrain |
| `sensor-net.svg` | soil/rain/tilt → gateway topology | /sensors |
| `ml-pipeline.svg` | data → RF → probability → GIS → warning | /prediction, /ml |
| `offline-sync.svg` | device → IndexedDB → receipt flow | /offline |
| `regions.svg` | hierarchy schematic (not to survey scale) | /regions |
| `response.svg` / `shelter.svg` | units + shelter capacity reference | /response |
| `wx-clear.svg` / `wx-rain.svg` / `wx-storm.svg` | weather visual states (context only) | /weather (dynamic by mm) |
| `hero-command.svg` | situation-wall reference render | /admin |

All: original vector diagrams, dark-navy/cyan command-center style, lazy-loaded,
responsive (`nesafe-vizgrid`), meaningful alt text in `VizFigure` (`src/platform/VizFigure.tsx`).

## External imagery (hotlinked, attributed, labeled)

| Image | Purpose | Source / URL | License | Attribution | Used on |
|---|---|---|---|---|---|
| Gallery placeholders (6) | cinematic intel examples | Unsplash `images.unsplash.com` photo IDs in `GeospatialIntelGallery.tsx` | Unsplash License | "Illustrative image (Unsplash)" in UI | welcome/command gallery |
| Google Place photo | place context | Google Places API (key-gated) | Google terms | via API | /location |
| User uploads | incident evidence | citizen/field devices | reporter's own | shown with GPS/type/status | /incidents |
| `public/poster.jpg` | project artwork hero | project artwork | do not redistribute | — | /command |

## Deliberately NOT used
- No scraped news/copyrighted disaster photos. No paid image APIs. No stock-photo grids.
- `dis-earthquake.svg` / `dis-storm.svg` ship unused for future sector pages (documented here, not dead code).

## Live EO tile layers (verified HTTP 200, 2026-09-16, keyless)

| Layer | GIBS endpoint (EPSG:3857, `default` = latest NRT composite) | Use |
|---|---|---|
| VIIRS SNPP True Color | `.../VIIRS_SNPP_CorrectedReflectance_TrueColor/default/...` | daily NRT base |
| MODIS Terra True Color | `.../MODIS_Terra_CorrectedReflectance_TrueColor/default/...` | alternate daily sensor |
| MODIS Terra 7-2-1 | `.../MODIS_Terra_CorrectedReflectance_Bands721/default/...` | water dark / burn scars red |
| Base maps | OSM, CartoDB dark/light, Esri World Imagery, OpenTopoMap | all HTTP 200 |

Probed and REJECTED (do not wire without re-verification): dated GIBS URLs (400 — `best` serves `default` only), thermal-anomaly layers (400), `MODIS_Combined_Flood_3-Day` (404), IMERG rate names tried (400), FIRMS (needs free MAP_KEY).
License: NASA Worldview/GIBS open use with attribution; tiles © OSM/CARTO/Esri/OpenTopoMap per base. Catalog: `src/platform/eoLayers.ts`.
