# DRISHTI-X satellite intelligence (Step 23)

Live Earth observation lives on `/satellite` via `SatelliteViewer`
(Leaflet, client-rendered) backed by `src/data/engine/satellite.ts`.
No new data-fetch architecture: tile liveness reuses the measured
tileload/tileerror pattern; JSON APIs (where used) flow through the
Step 22 engine client.

## NASA GIBS integration

- WMTS: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/<LAYER>/default/<DATE>/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`
- Curated layers (verified in production use): VIIRS SNPP True Color,
  MODIS Terra True Color, MODIS Terra 7-2-1, MODIS Aqua True Color.
- Dates are nominal acquisition dates in a 14-day window ending
  yesterday UTC (daily NRT latency). Per-tile availability is measured
  at render; missing tiles yield an honest no-imagery state, never a
  substituted image.
- Labels: LATEST_AVAILABLE only. Never "live".

## Copernicus integration

NOT_CONFIGURED. Copernicus Data Space offers free Sentinel access, but
no credentials are configured; `COPERNICUS_USER` stays server-side only
(see `.env.example`). The viewer states this instead of showing products.

## Cache strategy

- Leaflet/browser tile cache handles imagery (no custom tile store).
- Layer catalog, date bounds, and presets are static config (no TTL).
- Step 22 engine cache applies to any JSON metadata requests.

## Freshness / provenance

Every view shows SOURCE, PRODUCT, nominal ACQUISITION date, RETRIEVED
time, STATUS, COVERAGE, COPERNICUS state, and ATTRIBUTION. Acquisition
is the selected nominal date; retrieved is the actual fetch time. The
two are never conflated.

## Fallbacks

- No tiles for layer/date: no-imagery notice + date/layer switch.
- Invalid date: blocked by input bounds + explicit message.
- Offline: browser offline state surfaces via tile failures.
- No WebGL needed (Leaflet canvas); reduced-motion disables map animation.

## Limitations

- ~1-day NRT latency; not real-time tasking.
- 14-day selectable window (recent NRT), not the full GIBS archive.
- Max zoom 9 on GIBS overlays (provider grid level).
- Public tile usage: cache-first, no scraping.

## Environment variables

None required. Optional server-side only: `COPERNICUS_USER`,
`EARTHDATA_TOKEN` (documented in `.env.example`, never client-side).
