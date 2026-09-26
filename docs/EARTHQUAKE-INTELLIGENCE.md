# DRISHTI-X earthquake intelligence (Step 25)

Dedicated experience on `/earthquakes`, powered exclusively by the
Step 22 engine (`fetchDataset('usgs-earthquakes-7d')` + `EarthquakeAdapter`).
No parallel pipeline: `DisasterMap`/`RiskGridMap` markers use the legacy
`liveServices` path against the same USGS feed (untouched per protection
rules); a future step may converge them onto the engine.

**DRISHTI-X reports observed/available USGS earthquake information.
It does NOT predict earthquakes.**

## Source

USGS Earthquake Hazards Program, M2.5+ last 7 days GeoJSON
(`fdsnws/event/1/query?format=geojson`). Keyless. 5-minute engine TTL.
Feed latency ~minutes; magnitudes revise.

## Page contract (`/earthquakes`)

- Header: title, USGS attribution, dataset status badge (provenance
  status; OFFLINE/ERROR when unreachable).
- Summary: EVENTS count, STRONGEST (M x.x), LATEST (relative time),
  COVERAGE — all computed from the returned dataset; zero events
  renders "0 EVENTS" with no placeholders.
- Layout: event list (newest first) | Leaflet epicenter map | detail
  dialog | timeline strip (old → new) | provenance panel.
- Refresh button uses `forceRefresh` (no auto-polling; respects USGS).
- Map markers: radius = 4 + 2.2·M (linear, documented in legend);
  ring color = depth bucket AND numeric depth in every popup/row
  (never color alone). Click selects; selected ring pulses unless
  reduced-motion is preferred.
- Detail dialog: all available fields; missing → NOT AVAILABLE;
  VIEW ON USGS opens the official event page externally.
- States: loading / ready / error / empty (0 events) / offline-cached
  (STALE via engine) / offline-empty. Cached data is never labeled LIVE.

## Freshness / cache / offline

Step 22 registry thresholds for USGS (fresh ≤15m, aging ≤1h).
Offline + stale cache → OFFLINE/STALE with retrieval age. Offline +
no cache → error state with no fabricated content.

## Limitations

- Global M2.5+ feed; smaller local events absent.
- Magnitudes/depths revise after first publication.
- No predictions, no intensity/casualty/damage estimates.
- No reverse-geocoding (USGS `place` used verbatim).

## Environment variables

None required. No secrets involved.

## Tests

`src/components/earthquake/__tests__/quake.test.ts`: 20 deterministic
cases over `quakeUtils` (formatting, buckets, sorting, summary, detail
contract, no-severity-words). Component/map/dialog/keyboard behavior
verified via code patterns + production QA (no DOM test library
installed; none added per dependency rule).
