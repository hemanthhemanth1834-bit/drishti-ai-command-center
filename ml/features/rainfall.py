"""Rainfall feature engineering (Step 5). All features causal (t ≤ T); target windows
strictly future (T → T+H). No radar/satellite fabrication — unavailable sources
appear as NULL + state flags, never filled.
"""

from __future__ import annotations

import math

FEATURE_SCHEMA_VERSION = "rainfall-features@v0.5"

HORIZONS_H = (1, 3, 6)

# MODEL_EVALUATION_THRESHOLD (not a warning threshold): fixed exceedance cut for
# comparable model scoring. Purpose: model evaluation only. Quantile analysis
# alongside; see evaluation/metrics.py.
MODEL_EVALUATION_THRESHOLD_MM_H = 2.5

TEMPORAL_FEATURES = ("hour", "dayofyear", "month", "hour_sin", "hour_cos", "doy_sin", "doy_cos")
LAG_HOURS = (1, 3, 6, 12, 24)
ROLLING_WINDOWS_H = (3, 6, 12, 24)
WEATHER_VARS = ("temperature", "humidity", "pressure", "wind_speed", "wind_direction")

# Model input columns: everything the regressors consume. Structurally
# unavailable sources are EXCLUDED (they carry no signal, only mask flags).
MODEL_FEATURES = (
    list(TEMPORAL_FEATURES)
    + [f"rain_lag_{h}h" for h in LAG_HOURS]
    + [f"rain_roll_{w}h" for w in ROLLING_WINDOWS_H]
    + list(WEATHER_VARS) + ["elevation", "latitude", "longitude"])

# Sources that are structurally unavailable in Step 5 (no verified feed/credentials).
# Columns exist in the schema with state flags; values stay None.
UNAVAILABLE_SOURCES = ("radar_precipitation", "satellite_precipitation",
                       "gfs_precipitation", "gfs_temperature", "gfs_humidity",
                       "gfs_wind", "slope", "aspect", "flow_accumulation")


def temporal_features(ts) -> dict:
    """Cyclic + raw calendar encodings for a UTC datetime."""
    h, doy, month = ts.hour, ts.timetuple().tm_yday, ts.month
    return {"hour": h, "dayofyear": doy, "month": month,
            "hour_sin": math.sin(2 * math.pi * h / 24), "hour_cos": math.cos(2 * math.pi * h / 24),
            "doy_sin": math.sin(2 * math.pi * doy / 365.25), "doy_cos": math.cos(2 * math.pi * doy / 365.25)}


def schema_columns() -> list[str]:
    cols = [c for c in TEMPORAL_FEATURES]
    cols += [f"rain_lag_{h}h" for h in LAG_HOURS]
    cols += [f"rain_roll_{w}h" for w in ROLLING_WINDOWS_H]
    cols += list(WEATHER_VARS) + ["elevation", "latitude", "longitude"]
    cols += list(UNAVAILABLE_SOURCES)
    cols += [f"{c}_state" for c in
             ("rainfall_obs", "gfs", "satellite", "radar", "terrain")]
    return cols


def availability_row(has_rain: bool, has_terrain: bool) -> dict:
    return {"rainfall_obs_state": "OBSERVED" if has_rain else "MISSING",
            "gfs_state": "UNAVAILABLE", "satellite_state": "UNAVAILABLE",
            "radar_state": "UNAVAILABLE",
            "terrain_state": "OBSERVED" if has_terrain else "MISSING"}
