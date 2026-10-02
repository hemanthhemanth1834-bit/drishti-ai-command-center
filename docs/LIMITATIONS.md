# DRISHTI-X Limitations

DRISHTI-X is prototype decision-support software for SIH Problem Statement 26071. It is not a certified government early-warning system.

## Current provider limitations

- Open-Meteo weather/rainfall is live only when its upstream service is reachable.
- NASA GIBS is used as imagery/context; GIBS imagery is not described as a tasked satellite observation or flood-analysis result.
- Radar is not currently connected. No synthetic radar field is generated.
- NWP fusion is not claimed until NWP variables are ingested and consumed by a model.
- Official IMD feeds are not claimed unless a legitimate integration and credentials are configured.
- Calibrated uncertainty is not claimed without a documented calibration implementation and validation dataset.

## Removed synthetic/legacy behavior

The 26071-focused build no longer exposes:

- synthetic weather/rainfall fallbacks
- simulated satellite observations
- fake radar values
- landslide ML prediction
- generic soil/sensor telemetry
- drone/fleet/swarm telemetry
- fabricated operational dispatch/population values

## Validation limitation

Flood extent, flood depth, rainfall prediction, nowcasting and warning thresholds must be evaluated against documented real-world datasets before they can be described as validated operational predictions.
