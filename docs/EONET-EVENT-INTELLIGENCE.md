# DRISHTI-X disaster event intelligence (Step 27)

Dedicated experience on `/events`, powered exclusively by the Step 22
engine (`fetchDataset('eonet-events')` + `adaptEonetEvents`). No parallel
pipeline and no component-level fetching.

**DRISHTI-X reports observed NASA EONET records. It does NOT predict,
rank, or score disasters.**

## Source

NASA EONET v3 open event API (`/api/v3/events?limit=100&status=all`),
keyless. Verified live 2026-09-26: 100 events across floods,
severeStorms, wildfires (set varies). 30-minute engine TTL.

## Normalization

Per record: EONET id/title/description/link verbatim; first category
(id + title) preserved exactly (no severity mapping); open = closed
field null (with geometry) else false; closed date kept; source ids
kept; latest geometry entry wins for coordinates/timestamp; non-Point
geometries yield list-only records (coordinates null — never a
fabricated point); missing id → skipped + counted; missing timestamps
stay null.

## Page contract (`/events`)

Header (EONET attribution + engine status), summary (count, category
count, with/without coords, latest source time — all computed),
category + open/closed filters over retrieved data, list (newest
first), Leaflet map (EONET coordinates only, category colors + names),
timeline (old → new, source event time), detail dialog (source-backed
fields, NOT AVAILABLE gaps, VIEW SOURCE external link), provenance
panel, manual refresh (force, no auto-poll).

## States

Loading / ready / error / empty ("DISASTER EVENT DATA UNAVAILABLE",
zero placeholders) / offline-cached (STALE) / offline-empty. Cached
data is never labeled live.

## Freshness

Registry thresholds for EONET (fresh ≤6h, aging ≤24h from newest
source timestamp). Per-record freshness computed by the engine.

## Limitations

- Curation latency varies; geometry may be approximate.
- Category set changes with the live feed; filters derive from data.
- Not a warning feed; no severity, casualty, damage, or prediction data.
- No reverse-geocoding (coordinates shown numerically).

## Environment variables

None required. No secrets involved.

## Tests

`__tests__/events.test.ts`: 16 deterministic cases (mocked payloads):
normalization, categories, coordinates, timestamps, malformed payloads,
sorting, filtering, empty summary, cache, offline, provenance, and a
no-fabricated-fields assertion.
