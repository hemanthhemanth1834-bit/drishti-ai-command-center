# API-INVENTORY.md — DRISHTI-X provider audit (2026-09-27)

Discovery: ApiVault catalog (https://apivault.dev/, via its public
exa-studio/ApiVault `API_LIST.md`) across Weather, Environment, Government,
Open Data, Geocoding, News, Events, Science & Math, Tracking, Transportation,
Machine Learning. ApiVault listings render client-side; the repo file was used
as the enumerable source. Every candidate below was then verified against the
OFFICIAL provider docs — ApiVault was never treated as proof of freeness.

| Capability | Current Provider | Candidate Provider | Auth | Free? | Key Required? | Official Docs | Current Status | Fallback |
|---|---|---|---|---|---|---|---|---|
| Weather current/forecast | Open-Meteo | — (incumbent verified) | none | yes (non-commercial, CC-BY 4.0) | no | https://open-meteo.com/en/docs | LIVE | demo |
| River discharge (flood context) | — | Open-Meteo Flood API (GloFAS v4) | none | yes (same Open-Meteo terms) | no | https://open-meteo.com/en/docs/flood-api | INTEGRATED 2026-09-27 (`openmeteo-flood`, MODEL/FORECAST) | demo |
| Earthquakes | USGS FDSN/GeoJSON | — (incumbent verified) | none | yes | no | https://earthquake.usgs.gov/fdsnws/event/1/ | LIVE | empty state |
| Natural events | NASA EONET v3 | — (incumbent verified) | none | yes | no | https://eonet.gsfc.nasa.gov/docs/v3 | LIVE | empty state |
| Disaster alerts w/ levels | — | GDACS API (UN OCHA / EU JRC) | none | yes | no | https://www.gdacs.org/gdacsapi/swagger/index.html | INTEGRATED (engine `gdacs-alerts`, LATEST_AVAILABLE; levels are assessments) | EONET |
| Satellite imagery | NASA GIBS WMTS | — (incumbent verified) | none | yes | no | https://nasa-gibs.github.io/gibs-api-reference/ | LATEST_AVAILABLE | demo obs |
| Maps/geocode/POIs | OSM/Nominatim/Overpass | — (incumbent verified) | none | yes (strict usage policies) | no | https://wiki.openstreetmap.org/wiki/Tile_usage_policy | LIVE | demo |
| Active fire | — (registry ready) | NASA FIRMS area CSV (server proxy `/api/v1/fire/active`) | free MAP_KEY, server-side | yes (free signup) | YES — human signup required, none performed | https://firms.modaps.eosdis.nasa.gov/api/ | NOT_CONFIGURED (proxy 503s honestly; FirePanel gates on `/status`) | MODIS 7-2-1 burn-scar |
| IMD warnings/rainfall | — | api.imd.gov.in (official platform) | key (401 without) | unknown | YES — not obtained | https://api.imd.gov.in/public/api_reference.html | NOT_CONFIGURED (probed 401) | Open-Meteo |
| NDMA SACHET CAP/RSS alerts | — | sachet.ndma.gov.in CAP-XML (+RSS) | none per integration guide | yes (official) | no | https://sachet.ndma.gov.in/docs/Integration_Guide_For_Agencies.pdf | NOT INTEGRATED (exact anonymous feed URL unverified; ETag protocol documented for future work) | GDACS/EONET |
| India catalog | — | data.gov.in CKAN | key (free signup) | yes | YES — not obtained | https://data.gov.in/ | CATALOG_ONLY (catalog, not live feeds) | — |
| Bhuvan/ISRO | — | NRSC Bhuvan | login-walled | varies | YES — not obtained | https://bhuvan.nrsc.gov.in/ | NOT_CONFIGURED | GIBS |
| Soil texture | SoilGrids/ISRIC | — (incumbent) | none | yes | no | (existing) | LIVE | Open-Meteo→demo |
| Precipitation bulk | — | NASA GPM/Earthdata | Earthdata login | yes (login) | YES — not obtained | https://www.earthdata.nasa.gov/ | NOT_CONFIGURED | Open-Meteo |
| Sentinel imagery | — | Copernicus Data Space | free account | yes | YES — not obtained | https://dataspace.copernicus.eu/documentation | NOT_CONFIGURED | demo obs |
| Official India weather | — | IMD | key | unknown/limited | YES — not obtained | (no open API found) | NOT_CONFIGURED | Open-Meteo |
| India open data | — | data.gov.in (CKAN catalog) | key (free signup) | yes | YES — not obtained | https://data.gov.in/ | NOT INTEGRATED (catalog, not live disaster feeds) | — |
| India KYC/services | — | API Setu | key | gov partitioned | YES — not obtained | https://www.apisetu.gov.in/ | NOT INTEGRATED (not disaster-relevant) | — |
| River levels (US) | — | USGS Water Services | none | yes | no | https://waterservices.usgs.gov/ | NOT INTEGRATED (US-only, no India coverage) | GloFAS model |
| US alerts | — | NWS api.weather.gov | none | yes | no | https://www.weather.gov/documentation/services-web-api | NOT INTEGRATED (US-only) | — |
| Norway/global backup wx | — | MET Norway Locationforecast | User-Agent ID | yes | no | https://api.met.no/weatherapi/documentation | EVALUATED, not integrated (Open-Meteo suffices; keep as documented fallback) | Open-Meteo |
| Aviation obs | — | NOAA Aviation Weather | none | yes | no | https://www.aviationweather.gov/dataserver | EVALUATED, not integrated (aviation-specific; no UI need) | — |
| News/events firehose | — | GDELT 2.0 | none | yes | no | (official GDELT docs) | REJECTED (firehose noise; EONET suffices; unreliable-scrape rule) | EONET |
| ISRO info | — | isro.vercel.app (community wrapper) | none | n/a | no | n/a | REJECTED (unofficial third party, not ISRO) | — |
| Wildfire (Brazil) | — | INPE Queimadas | none | yes | no | https://queimadas.dgi.inpe.br/queimadas/dados-abertos/ | NOT INTEGRATED (wrong region) | FIRMS path |
| Geocoding alt | Nominatim | Geocode.xyz / OpenCage etc. | mixed | toy/paid | varies | (per vendor) | NOT INTEGRATED (Nominatim works; toys fail verification) | Nominatim |
| MetaWeather | — | — | — | — | — | — | DEAD (service shut down 2021; ApiVault stale) | — |
| Air quality | — (not consumed) | Open-Meteo Air Quality / PurpleAir | none / key | yes / gated | no / YES | https://open-meteo.com/en/docs/air-quality-api | NOT INTEGRATED (no UI gap claimed) | — |
| Notifications | in-app queue | SMTP/WebPush | keys | varies | YES — not obtained | (existing .env.example) | NOT_CONFIGURED | in-app queue |
| Maps embed | OSM default | Google Maps Embed | key+billing | pay-as-you-go | YES — not obtained | (existing docs) | NOT_CONFIGURED | OSM |

## Rules applied to every row

- No-key first; government/open-data preferred; keys only via official human signup (none performed here).
- Nothing labeled LIVE unless the HTTP path returns live data (MODEL/FORECAST/DEMO/NOT_CONFIGURED used truthfully).
- Cache-first engine (dedupe, TTL, backoff, stale fallback) fronts every integrated provider.
- No credentials exist anywhere in this process: no signups performed, no keys obtained, nothing committed.
