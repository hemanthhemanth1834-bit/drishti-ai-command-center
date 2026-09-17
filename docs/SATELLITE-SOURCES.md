# SATELLITE-SOURCES.md

Live (keyless, tile-probed 200): VIIRS SNPP True Color, MODIS Terra True Color,
MODIS Terra 7-2-1 (water/vegetation) via GIBS `.../default/...` (latest NRT
composite, ~1-day latency). Dated GIBS URLs 400 — use `default` only.
NOT_CONFIGURED: Sentinel-1/-2 (free account), FIRMS (free MAP_KEY), GPM bulk
(Earthdata login), ISRO/Bhuvan (varies). Rejected after probing: thermal
anomaly names tried, `MODIS_Combined_Flood_3-Day` (404). Catalog:
`src/platform/eoLayers.ts`. History page hosts the outbound reference library.
