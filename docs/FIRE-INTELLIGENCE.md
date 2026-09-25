# DRISHTI-X fire intelligence (Step 24)

Active-fire detections live on `/satellite` via `FirePanel`, backed by
`fetchDataset('firms-fires')` and `adaptFirmsFires` (Step 22 engine).
No new fetch architecture; no backend changes.

## Source

NASA FIRMS (MODIS / VIIRS / Landsat active-fire products, near-real-time
~1–3h latency). Free MAP_KEY signup at
https://firms.modaps.eosdis.nasa.gov/api/.

## Current state: NOT_CONFIGURED

No `FIRMS_MAP_KEY` is configured in this deployment, so the engine
returns NOT_CONFIGURED with zero records and performs no fetch. The UI
shows this honestly with the reason and the MODIS 7-2-1 burn-scar
fallback pointer. No synthetic fires are displayed — ever.

To enable (server-side only):
1. Sign up for a free FIRMS MAP_KEY.
2. Set `FIRMS_MAP_KEY` on the backend host (documented in `.env.example`).
3. Add a server-side proxy (browser must never see the key) and flip the
   `nasa-firms` registry entry to `enabled: true`.

Never commit the key. Never put it in `NEXT_PUBLIC_*`.

## Adapter

`adaptFirmsFires` normalizes VIIRS/MODIS rows (flat array or
`{ fires: [] }`): coordinates validated (lon ±180, lat ±90),
`acq_date` + `acq_time` combined to UTC ISO, missing timestamps stay
null, malformed rows skipped and counted. Confidence, satellite,
instrument, brightness, FRP, day/night, version preserved when present.

## Cache / freshness

1-hour TTL when enabled. Offline serves labeled stale cache only.
Freshness thresholds (registry): fresh ≤3h, aging ≤12h from source
timestamp — per-source, not universal.

## Limitations

- Detection latency ~1–3h; confidence varies by product.
- Detections are hotspots, not burned-area maps.
- Absence of detections is not proof of absence of fire.
