"""Nowcast features (Step 6). Step-5 base + spatial-neighbor context, all causal.

Schema `nowcast-features@v0.6`. Spatial features use only neighbor cells' data
at t ≤ T on the common grid. Storm-motion estimation is NOT performed with the
TEST-ROI density: MOTION_ESTIMATION_STATUS is UNAVAILABLE (documented, exposed).
"""

from __future__ import annotations

from ml.features.rainfall import MODEL_FEATURES as BASE_FEATURES
from ml.features.rainfall import availability_row as base_availability

FEATURE_SCHEMA_VERSION = "nowcast-features@v0.6"

# Interval horizons: (start_h, end_h] exclusive of T, in hours.
INTERVALS = {"0-1h": (0, 1), "1-3h": (1, 3), "3-6h": (3, 6)}

# MODEL intensity classes on hourly rate (evaluation/display only — NOT
# official warning categories). Cuts: 2.5 / 7.5 / 15 / 30 mm/h (documented
# MODEL choices for a dry-skewed TEST ROI, not meteorological standards).
# Sub-hourly horizons (+15/+30/+45 min) are NOT offered: hourly inputs cannot
# support them (see NOWCAST-DATA-LIMITATIONS.md).
INTENSITY_CLASSES = (("DRY", 0.0), ("LIGHT", 2.5), ("MODERATE", 7.5),
                     ("HEAVY", 15.0), ("EXTREME", 30.0))


def intensity_category(accum_mm: float, width_h: int) -> str:
    """Rate-based MODEL class for an interval accumulation (display only)."""
    rate = max(0.0, accum_mm) / max(1, width_h)
    if rate == 0:
        return "DRY"
    label = "LIGHT"
    for name, lo in INTENSITY_CLASSES[1:]:
        if rate >= lo:
            label = name
    return label

SPATIAL_FEATURES = ("nbr_lag1_mean", "nbr_lag1_max", "nbr_lag1_range", "nbr_count")

MOTION_ESTIMATION_STATUS = "UNAVAILABLE"
MOTION_NOTE = ("Storm-motion vectors require dense radar/satellite fields; the 4-point "
               "TEST ROI cannot support them. No motion is estimated or used.")


def schema_columns() -> list[str]:
    return list(BASE_FEATURES) + list(SPATIAL_FEATURES)


def availability_row(has_rain: bool, has_terrain: bool, nbr_count: int = 0) -> dict:
    row = base_availability(has_rain, has_terrain)
    row["spatial_state"] = "AVAILABLE" if nbr_count > 0 else "MISSING"
    row["motion_status"] = MOTION_ESTIMATION_STATUS
    return row
