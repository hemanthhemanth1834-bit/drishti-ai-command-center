# DRISHTI-X Final Architecture

## Scope

DRISHTI-X is being consolidated around SIH 26071: heavy-rainfall early warning and inundation prediction.

## Current application architecture

```
Next.js / React UI
       |
       v
Provenance + data-status layer
       |
       +--> Open-Meteo weather / rainfall
       +--> NASA GIBS imagery context
       +--> OpenStreetMap GIS / routing
       +--> Flood / river context providers where available
       |
       v
Rainfall + flood screening
       |
       v
Alerts / incidents / roads / resources / emergency response
```

## Data truth

Every provider should expose source, status and timing information. Missing inputs are not silently replaced with synthetic values.

## SIH 26071 expansion point

The target multi-source pipeline is:

```
Satellite observations
        +
Radar rainfall
        +
Surface observations
        +
NWP forecasts
        |
        v
Quality control / feature fusion
        |
        v
Rainfall ML + nowcasting
        |
        v
Inundation / flood-depth modelling
        |
        v
Early warning + GIS + response
```

Only sources and model stages that are actually connected and validated may be presented as live or operational.

## Deliberately removed

The architecture no longer includes the legacy landslide ML stack, generic soil intelligence, fire-specific intelligence, drone/SAR simulation, sensor-network demo or generic telemetry stream.
