# DRISHTI-X weather intelligence (Step 26)

Open-Meteo direct intelligence on `/weather` via `WeatherIntel`,
backed exclusively by the Step 22 engine (`fetchDataset('openmeteo-current')`
+ `WeatherAdapter`). The pre-existing backend rainfall/threshold/provider
panels on the same route are untouched.

## Source

Open-Meteo forecast API, keyless free non-commercial use, CC-BY 4.0
attribution shown in-app. Single request carries `current` + `hourly` +
`daily` (`forecast_days=7`, `timezone=auto`).

## Current vs forecast (mandatory split)

- CURRENT panel: OBSERVED model values (`weather-observation` records).
- HOURLY (next 24) and 7-DAY panels: FORECAST records, labeled as model
  forecasts that may differ from actual conditions — never warnings.
- The two are never merged into one number.

## Fields

Current: temperature, feels-like, condition (WMO code map below),
humidity, precipitation, wind (+compass), gusts, pressure, cloud cover.
Hourly: temp, feels-like, precipitation, probability, wind, code.
Daily: min/max, precipitation sum, probability max, wind max, code.
Missing metrics render NOT AVAILABLE, never zero.

## WMO weather-code mapping

Per the documented Open-Meteo specification: 0 Clear sky · 1 Mainly
clear · 2 Partly cloudy · 3 Overcast · 45/48 Fog · 51/53/55 Drizzle ·
56/57 Freezing drizzle · 61/63/65 Rain · 66/67 Freezing rain · 71/73/75
Snow · 77 Snow grains · 80/81/82 Showers · 85/86 Snow showers ·
95 Thunderstorm · 96/99 Thunderstorm with hail. Unknown codes render
as "Code N".

## Timestamps

Open-Meteo returns wall-clock ISO without offset; the adapter applies
`utc_offset_seconds` to normalize to UTC ISO. Unparseable stays null.
Daily records carry the calendar date. Acquisition vs retrieved times
are shown separately in provenance.

## Location

12 verified showcase cities (`config/regions.ts` `SHOWCASE_CITIES`) in a
preset select. No free-text geocoding here (Nominatim policy respected
by avoidance); coordinates ship with each request.

## Map policy

Point forecast only. No regional raster is drawn: a single Open-Meteo
point is NOT a weather heatmap. Spatial context lives on `/risk-map`.

## Cache / freshness / offline

Step 22 engine, 10-minute TTL. Manual REFRESH (force). Offline + cache
→ OFFLINE + STALE with retrieval age. Offline + no cache →
WEATHER DATA UNAVAILABLE (no fallback temperatures generated).

## Alerts

No official alert source is configured. Forecast values are never
presented as emergency warnings; the page states this explicitly.

## Limitations

- Point model output, not ground stations.
- Probabilities/forecasts are model estimates.
- Feed latency ~tens of minutes; not a nowcast radar.

## Environment variables

None required. No secrets involved.

## Tests

`__tests__/weather.test.ts`: 22 deterministic cases (mocked payloads):
values, code map, compass, hourly/daily parsing, missing fields,
timestamps + UTC offset, provenance, registry config, cache hit,
offline cached/empty, API error, malformed payload, invalid location,
current/forecast separation, units, request params.
