# DRISHTI-X data engine (`src/data/engine/`, Step 22)

Canonical normalized data layer for Steps 23+. Existing callers
(`src/lib/liveServices.ts`, `src/platform/api.ts`, `src/utils/apiClient.ts`)
are untouched; new source integrations must use this engine.

## Lifecycle

```
SOURCE CLIENT (fetch, timeout, retry, dedupe)
  -> ADAPTER (raw payload -> DataRecord[], skip malformed)
  -> CACHE (memory TTL, cache-first reads)
  -> FRESHNESS (per-source thresholds)
  -> PROVENANCE (source, timestamps, attribution, limitations)
  -> HEALTH (last success/failure, latency, cache state)
```

Entry point: `fetchDataset(kind, params, opts)` where kind is
`'usgs-earthquakes-7d'` or `'openmeteo-current'` (more in Steps 23+).

## Statuses

Data statuses: LIVE, NEAR_REAL_TIME, LATEST_AVAILABLE, FORECAST,
HISTORICAL, DEMO, OFFLINE, NOT_CONFIGURED, ERROR. Status describes the
DATA, never just the HTTP request. Freshness: FRESH / AGING / STALE /
UNKNOWN, computed from source timestamp vs retrieval time against
per-source thresholds in the registry.

## Source registry

7 definitions in `registry.ts`: NASA GIBS, NASA FIRMS, NASA EONET, USGS,
Open-Meteo, Copernicus Data Space, OpenStreetMap. Each carries base/docs
URLs, data types, access type, env var (if any), rate-limit notes,
attribution, freshness thresholds, adapter name, enabled flag.
Only USGS + Open-Meteo adapters exist in Step 22; the rest are
definitions for Steps 23+ (FIRMS/Copernicus report NOT_CONFIGURED
without server-side credentials — never in client code).

## Client rules (`client.ts`)

- GET only, 12s default timeout, AbortController throughout.
- Retry (max 2, exponential backoff): network errors, timeouts, and
  HTTP 408/425/429/5xx only. Never 4xx, parse, or auth errors.
- In-flight deduplication: identical concurrent GETs share one request.
- Errors normalized to 11 kinds; diagnostics carry no secrets.

## Cache (`cache.ts`)

Memory TTL store with key/data/createdAt/expiresAt/source/status.
Source-appropriate TTLs (USGS 5min, Open-Meteo 10min). Stale entries
serve only explicit offline fallback, labeled STALE — never as LIVE.

## Validation (`errors.ts`)

- Coordinates: lon -180..180, lat -90..90; invalid records skipped.
- Timestamps normalized to UTC ISO; unparseable -> null (unknown),
  never replaced with "now". Local time only at presentation.
- Minimal GeoJSON shape check; malformed geometry rejected, never repaired.

## Offline / fallback

Offline + stale cache -> OFFLINE/STALE with retrieval age. Offline +
no cache -> OFFLINE, empty. Errors prefer stale cache (labeled) over
empty; unrelated datasets are never substituted.

## Adding a source (Steps 23+)

1. Add/extend client call in `engine.ts` (`buildUrl` + `adapt`).
2. Write adapter in `adapters.ts` returning `{ records, skipped }`.
3. Set `enabled: true` in the registry (keep NOT_CONFIGURED otherwise).
4. Add deterministic mocked tests in `__tests__/engine.test.ts`.

## Health

`getHealth(source)` / `recordHealth()` track AVAILABLE / DEGRADED /
UNAVAILABLE / NOT_CONFIGURED / UNKNOWN with last success/failure,
latency, and cache state — all from real request outcomes.

## Tests

`__tests__/engine.test.ts`: 18 deterministic cases (mocked fetch only):
request success/timeout/network/HTTP/parse, retry, rate-limit, auth,
adapter skips, coordinate/timestamp validation, cache hit/expiry,
dedup, offline, freshness, provenance, registry, status mapping.

## Environment variables

None required. Optional server-side only: `FIRMS_MAP_KEY`,
`COPERNICUS_USER` (documented in `.env.example`). Never `NEXT_PUBLIC_*`.
