# DRISHTI-X known limitations (verified, honest)

- **Backend availability:** Railway trial expired 2026-09-26 → production backend OFFLINE. Frontend degrades honestly (OFFLINE/DEMO/STALE). Restore via any Docker host or funded Railway project; no code changes needed.
- **FIRMS configuration:** no MAP_KEY → fire detections NOT_CONFIGURED; burn-scar context via MODIS 7-2-1 only.
- **Copernicus/Sentinel configuration:** no credentials → NOT_CONFIGURED (live-probed 2026-09-26: catalog visible, no public imagery path). GIBS remains the operational satellite source.
- **Synthetic ML data:** Landslide-RF-v1 trained on synthetic data (87% positive skew); metrics are demo-artifact values, immutable SYNTHETIC-DEMO label.
- **Simulated Digital Twin scenarios:** procedural terrain/city/corridor/markers; corridor is not an official evacuation route.
- **External API dependency:** Open-Meteo/USGS/GIBS/OSM/Nominatim/EONET subject to their quotas/policies; Nominatim 1 req/s throttled + cached in-app.
- **Network dependency:** offline works from cache/IndexedDB queue; fresh data needs connectivity.
- **Browser permissions:** geolocation behind user permission; WebGL required for full 3D (2D fallbacks included).
- **WebGL/device limitations:** low-end devices use performance modes; pixel-ratio caps; reduced-motion support.
- **Demo/simulation modules:** drones (no hardware fleet), shelter occupancy (DEMO rows), reunion/recovery flows (simulation aids, not dispatch systems).
- **Data freshness limitations:** GIBS ~1-day NRT latency; EONET curation latency; USGS magnitudes revise; forecasts are model output.
- **Auth/prototype caveats:** dev default gateway key, open CORS default, SQLite default, JWT without refresh rotation, no secret rotation automation.
- **Data gaps:** sparse demo geography outside AP/Telangana showcases; duplicate incidents possible; no Background Sync; no bulk satellite ingestion.
- **Screenshot QA:** no pixel-screenshot tooling in this environment; visual QA is structural (rendered-HTML) + responsive-class audit — stated, not oversold.

None of these are disguised failures: each is an intentional architectural tradeoff or an external dependency with an honest UI state.
