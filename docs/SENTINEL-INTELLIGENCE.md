# DRISHTI-X Sentinel intelligence (Step 28 — OUTCOME B)

Copernicus Data Space remains **NOT_CONFIGURED**. No Sentinel products
are displayed. This document records the live probe evidence behind
that decision (2026-09-26, read-only, no credentials used).

## Live probe results

1. STAC API root `https://stac.dataspace.copernicus.eu/v1/` — HTTP 200,
   anonymous, advertises collections/search/conformance.
2. `GET /v1/collections` — 200, 10 collections, all CCM/CLMS
   (hyperspectral/optical/SAR/thermal/land-cover); **no Sentinel-1/2
   collection exposed on this path**.
3. `POST /v1/search` (`ccm-optical`, India bbox and unfiltered) — 200
   but **0 features**. No usable product records keylessly.
4. OData catalog `.../odata/v1/Products?$top=1` (no auth) — 200 with
   real metadata (Id, Name, ContentDate, Footprint WKT).
5. `.../Products(<id>)/Quicklook` (no auth) — **404**. No publicly
   retrievable thumbnails.
6. Bulk download requires OAuth tokens (documented; not attempted
   without an account).

Conclusion: catalog metadata is partially visible, but there is **no
verified keyless path to usable Sentinel imagery**. Per policy, the
honest outcome is hardened NOT_CONFIGURED, not a metadata-only
browser masquerading as imagery intelligence.

## What NOT_CONFIGURED means here

- `copernicusState()` returns status NOT_CONFIGURED, empty products,
  probe evidence, and server-side enablement steps.
- The satellite viewer shows `COPERNICUS — NOT_CONFIGURED (free
  account required)` with no products, thumbnails, or footprints.
- GIBS daily-NRT imagery remains the operational satellite source.

## Enablement (server-side only)

1. Create a free account at https://dataspace.copernicus.eu/.
2. Set `COPERNICUS_USER` (and companion secret) on the backend host.
   Never commit secrets; never expose them in client bundles.
3. Add a server-side proxy for search/download; browser stays keyless.
4. Verify quicklook/download retrieval, then flip the registry entry
   to `enabled: true` and build the adapter in a future step.

## Fields that a future adapter must handle

Product ID, title, platform (S1/S2), product type, instrument,
acquisition UTC, cloud cover (S2 only — never estimate), footprint
WKT/GeoJSON or bbox, processing level, source URL, quicklook URL only
if publicly retrievable. All optional-safe; missing → NOT AVAILABLE.

## Cache / freshness / offline

N/A while disabled. When enabled: long TTLs for catalog metadata,
per-record acquisition honesty, offline → labeled stale or honest
empty. Freshness thresholds to be set from measured cadence, not
assumed.

## Security

No keys in source, client, Git, or diagnostics. Probe used anonymous
endpoints only. `NEXT_PUBLIC_*` carries nothing Copernicus-related.

## Tests

`__tests__/sentinel.test.ts`: 7 deterministic cases (state, gating,
no products, probe evidence, attribution, enablement, registry
contract). No live dependency.
