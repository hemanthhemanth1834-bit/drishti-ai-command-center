"""GIS risk engine (Step 11). HAZARD × EXPOSURE → RISK, layers kept separate.

Hazard: Step-8 modelled depth/extent (MODELLED) + rainfall intensity.
Exposure: OSM buildings/roads/facilities (reference, not ground truth).
Vulnerability: UNAVAILABLE (no verified data) — risk computed without it, flagged.
Population: UNAVAILABLE (no verified free gridded source) — never estimated.
Risk matrix is versioned config, never magic numbers.
"""

from __future__ import annotations

import math

import numpy as np

RISK_CONFIG_VERSION = "risk-matrix@v0.11.0"

# Hazard bands on modelled depth (m) → documented MODEL thresholds.
HAZARD_BANDS = [("NONE", 0.0), ("LOW", 0.05), ("MEDIUM", 0.15), ("HIGH", 0.5), ("SEVERE", 1.5)]

# (hazard, exposure_present) → (risk, factors note)
RISK_MATRIX = {
    ("NONE", False): ("LOW", ["no hazard"]),
    ("NONE", True): ("LOW", ["exposed but no hazard"]),
    ("LOW", False): ("LOW", ["low hazard"]),
    ("LOW", True): ("MODERATE", ["low hazard + exposure"]),
    ("MEDIUM", False): ("MODERATE", ["medium hazard"]),
    ("MEDIUM", True): ("HIGH", ["medium hazard + exposure"]),
    ("HIGH", False): ("HIGH", ["high hazard"]),
    ("HIGH", True): ("VERY_HIGH", ["high hazard + exposure"]),
    ("SEVERE", False): ("VERY_HIGH", ["severe hazard"]),
    ("SEVERE", True): ("VERY_HIGH", ["severe hazard + exposure"]),
}

EARTH_R_M = 6371000.0


def hazard_class(depth_m: float) -> str:
    label = "NONE"
    for name, lo in HAZARD_BANDS:
        if depth_m >= lo:
            label = name
    return label


def haversine_m(lon1, lat1, lon2, lat2) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_R_M * math.asin(math.sqrt(a))


def polygon_area_m2(ring: list) -> float:
    """Equirectangular shoelace (documented approximation for small footprints)."""
    if len(ring) < 3:
        return 0.0
    lat0 = sum(p[1] for p in ring) / len(ring)
    kx = math.cos(math.radians(lat0)) * EARTH_R_M * math.pi / 180.0
    ky = EARTH_R_M * math.pi / 180.0
    s = 0.0
    for i in range(len(ring)):
        x0, y0 = ring[i][0] * kx, ring[i][1] * ky
        x1, y1 = ring[(i + 1) % len(ring)][0] * kx, ring[(i + 1) % len(ring)][1] * ky
        s += x0 * y1 - x1 * y0
    return abs(s) / 2.0


def cell_index(lon: float, lat: float, extent: list[float], shape: tuple[int, int]):
    west, south, east, north = extent
    H, W = shape
    c = int((lon - west) / (east - west) * W)
    r = int((north - lat) / (north - south) * H)
    if 0 <= r < H and 0 <= c < W:
        return r, c
    return None


def assess_risk(hazard: str, exposure_present: bool) -> tuple[str, list[str]]:
    key = (hazard, bool(exposure_present))
    if key not in RISK_MATRIX:
        raise ValueError(f"unknown hazard/exposure combo: {key}")
    risk, factors = RISK_MATRIX[key]
    return risk, [f"hazard={hazard}", f"exposure={'present' if exposure_present else 'absent'}"] + factors
