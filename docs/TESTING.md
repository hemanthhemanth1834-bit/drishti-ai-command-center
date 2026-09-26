# DRISHTI-X testing (final verified state)

## Commands

```bash
npm run typecheck   # tsc --noEmit — clean
npm run lint        # next lint — no warnings/errors
npm test            # vitest run — 131/131 PASS
npm run build       # next build — 50/50 static routes
cd backend && python -m pytest -q  # 51/51 PASS
```

## Vitest (131)

Platform (7): alert templates, geo config. Engine (18+7+4+20+22+16+18): request/timeout/network/HTTP/parse/retry/rate-limit/auth, adapters (USGS/FIRMS/Open-Meteo/EONET/model), validation, cache hit/expiry, dedup, offline, freshness, provenance, registry, no-fabrication guards. Twin (12), quake UI logic (20), weather UI (22), events (16), model display (18). All mocked/deterministic; no live-API dependencies.

## Backend pytest (51)

Legacy API (9) + platform (26) + universal/auth (16). Contracts + honesty flags verified — not real-world prediction skill.

## Build

`next build`: static prerender all routes; dynamic `ssr:false` for Leaflet/R3F maps; OneDrive `.next` file-lock is an environment quirk (clear `.next`, rebuild) — not an app failure.

## Route QA

All 51 route dirs return HTTP 200 in production; content markers verified per route (headers, imagery, disclaimers, honest states).

## Responsive QA

1350/1100/760/460 breakpoints + coarse-pointer 44px targets + short-viewport map/globe heights; grids collapse 6→3→2→1; no horizontal overflow (structural QA; no pixel-screenshot tooling in this environment — stated honestly).

## Accessibility QA

Semantic landmarks, native links/buttons, dialog focus + Escape (`useDialogA11y`), aria-live regions (clocks aria-hidden), global `:focus-visible`, 44px targets, reduced-motion gates, no color-alone status (icon + text).

## Reduced-motion QA

`prefers-reduced-motion` freezes decorative animation (twin VFX, pulses, sweeps, globe rotation, particles) while keeping all data visible; verified by code inspection against each animated component.

## Security scan

Secret-pattern scan (sk-/AKIA/private-key/APIza) over `src/` + `backend/`: clean. `git ls-files`: no `.env`/`.db`/keys tracked. Server creds absent from client bundles.

## Fake-data audit

Repo-wide scan for fabricated live values (98.4/99.2/LEO-lock/unit formulas): zero remaining; DEMO/SIMULATION labels asserted in tests and copy.

## Production QA

Post-deploy: route matrix 200s, content markers, backend reachability, honest OFFLINE rendering during the Railway outage, alias verification per deployment.
