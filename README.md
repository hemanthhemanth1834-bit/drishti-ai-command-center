<div align="center">

# DRISHTI-X
## Heavy Rainfall & Flood Intelligence Command Center

**See Early · Understand Better · Act Faster**

DRISHTI-X is a free-first disaster-management prototype focused on heavy rainfall, flood/inundation awareness, weather intelligence, GIS, alerts and emergency response.

[Live Demo](https://drishti-ai-command-center.vercel.app/) · [GitHub](https://github.com/hemanthhemanth1834-bit/drishti-ai-command-center)

> **Prototype / decision-support software.** DRISHTI-X does not replace official government warnings, forecasts or emergency systems.

</div>

## SIH 26071 focus

The project is being consolidated around SIH Problem Statement 26071: an AI/ML-based heavy-rainfall early-warning and inundation-prediction system using satellite, radar, observations and numerical-weather-model data.

The repository now keeps the application shell and response workflows that support that goal while removing unrelated operational demos and unsupported data claims.

## Core capabilities

- Weather and rainfall monitoring with explicit observed/forecast provenance
- Flood and inundation risk visualisation
- GIS maps, regional hierarchy and location-aware views
- NASA GIBS imagery context with clear distinction between imagery and analysis observations
- Alerts, incidents, roads, resources, shelters and emergency-response workflows
- Source/freshness/status indicators
- Authentication, roles and operator controls
- Clearly labelled simulation/presentation views where a live source is not available

## Data honesty rules

The application does **not** generate synthetic operational measurements when a provider is unavailable.

Provider states are explicit:

- **LIVE** — live upstream data was retrieved
- **FORECAST** — model forecast, not an observation
- **AVAILABLE / CONTEXT** — usable imagery or map context, not an analytical observation
- **NOT_CONFIGURED** — an integration exists but credentials/access are missing
- **UNAVAILABLE** — the upstream source could not be reached
- **SIMULATION / DEMO** — presentation or testing content only

No simulated radar field, synthetic satellite observation, hard-coded rainfall fallback, fake ML prediction, or fabricated operational telemetry is presented as live data.

## Current source posture

| Capability | Current source/status |
|---|---|
| Weather | Open-Meteo, live when reachable |
| Rainfall | Open-Meteo precipitation, with explicit observed/forecast separation |
| Satellite imagery | NASA GIBS / external imagery context |
| Maps / geocoding / routing | OpenStreetMap ecosystem |
| Flood / river context | Open-Meteo/GloFAS where available |
| Official IMD feed | Not configured unless legitimate credentials/integration are supplied |
| Radar | Not connected; no synthetic radar is generated |
| NWP fusion | Not claimed until NWP variables are actually ingested and consumed |
| Calibrated uncertainty | Not claimed unless calibration data and implementation exist |

## What was removed

To keep the 26071 scope clear, the repository no longer exposes:

- Fire-specific intelligence
- Landslide prediction / legacy landslide ML
- Generic soil-intelligence module
- Drone/SAR demo route
- Generic sensor-network demo
- Drone/fleet/swarm telemetry streams
- Legacy duplicate ML implementation
- Simulated satellite-observation provider
- Synthetic weather/rainfall fallbacks
- Duplicate asset archives/placeholders

Historical or illustrative imagery may still appear in documentation or presentation material only when explicitly labelled as historical/illustrative/demo content.

## Architecture

```
Weather + Rainfall + Satellite Context + GIS
                    |
                    v
             Data / Provenance
                    |
                    v
          Flood Risk & Inundation
                    |
                    v
        Alerts + Response Workflows
```

The target SIH 26071 architecture will extend this foundation with verified radar, satellite-observation ingestion and NWP data before those sources are described as live or fused.

## Technology

- Next.js / React / TypeScript
- FastAPI / Python
- Leaflet / MapLibre GIS
- OpenStreetMap / Open-Meteo / NASA GIBS and other open-data integrations
- PostgreSQL/SQLite-compatible persistence paths
- Vercel deployment

## Important limitations

This is not a certified early-warning system. Model quality, flood-depth accuracy, spatial inundation accuracy and uncertainty calibration must be established against documented real-world validation datasets before operational claims are made.

Likewise, a deterministic or uncalibrated flood-routing calculation must be labelled as modelled output rather than presented as a validated AI prediction.

## Development rule

When a new SIH 26071 provider or model is added, its UI and API must expose:

1. source
2. retrieval/validity timestamp
3. data type (observed / forecast / historical / context)
4. status
5. model/version where applicable
6. validation status
7. uncertainty status where implemented

If those fields are not known, the system must say so rather than inventing a value.
