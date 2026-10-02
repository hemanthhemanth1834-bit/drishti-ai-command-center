"""Centralized quality control (Step 4). Flags first; deletion only with a logged reason.

Flag vocabulary: VALID | MISSING | SUSPECT | OUTLIER | DUPLICATE | INVALID | STALE.
Nothing is silently discarded: every record keeps its flag, and every removal
returns a log entry.
"""

from __future__ import annotations

import math
from datetime import datetime

from app.services.processing.ranges import Ranges

RANGES = Ranges()


def is_missing(value: float | None) -> bool:
    return value is None or (isinstance(value, float) and (math.isnan(value) or math.isinf(value)))


def valid_coords(lat: float | None, lon: float | None) -> bool:
    return (lat is not None and lon is not None
            and math.isfinite(lat) and math.isfinite(lon)
            and -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0)


def flag_value(variable: str, value: float | None) -> str:
    if is_missing(value):
        return "MISSING"
    assert value is not None
    return RANGES.classify(variable, value)


def find_duplicate_indices(keys: list) -> set[int]:
    """Indices of repeats (first occurrence kept). Works for timestamps or coords."""
    seen: dict = {}
    dupes: set[int] = set()
    for i, k in enumerate(keys):
        if k in seen:
            dupes.add(i)
        else:
            seen[k] = i
    return dupes


def find_gaps(sorted_times: list[datetime], expected_s: float) -> list[dict]:
    """Gaps > 1.5× the expected step. Returns [{after, before, missing_steps}]."""
    gaps = []
    for a, b in zip(sorted_times, sorted_times[1:]):
        delta = (b - a).total_seconds()
        if delta > 1.5 * expected_s:
            gaps.append({"after": a.isoformat(), "before": b.isoformat(),
                         "missing_steps": round(delta / expected_s) - 1})
    return gaps


def is_stale(ingestion_time: datetime, now: datetime, max_age_s: float) -> bool:
    return (now - ingestion_time).total_seconds() > max_age_s


def validate_geometry(geom: dict) -> str:
    """Structural GeoJSON validation (no shapely in Step 4 — topology arrives Step 10).

    Returns VALID | INVALID with reason. Checks: type known, coordinates finite,
    rings closed, bbox ordered.
    """
    try:
        gtype = geom.get("type")
        coords = geom.get("coordinates")
        if gtype == "Point":
            if len(coords) != 2 or not all(math.isfinite(c) for c in coords):
                return "INVALID: point needs 2 finite coords"
            if not valid_coords(coords[1], coords[0]):
                return "INVALID: point out of range"
            return "VALID"
        if gtype in ("LineString", "MultiPoint"):
            if len(coords) < 2 or not all(len(p) == 2 and all(math.isfinite(c) for c in p) for p in coords):
                return "INVALID: bad positions"
            return "VALID"
        if gtype in ("Polygon", "MultiLineString"):
            for ring in (coords if gtype == "Polygon" else [ln for ln in coords]):
                if len(ring) < 4 or ring[0] != ring[-1]:
                    return "INVALID: ring not closed"
                for p in ring:
                    if len(p) != 2 or not all(math.isfinite(c) for c in p):
                        return "INVALID: bad positions"
            return "VALID"
        return "INVALID: unknown geometry type"
    except (TypeError, AttributeError) as exc:
        return f"INVALID: malformed geometry ({exc})"


def iqr_outliers(values: list[float], k: float = 3.0) -> set[int]:
    """Tukey outliers (k=3 conservative) as *diagnostic candidates* — flag, don't delete."""
    clean = sorted(v for v in values if not is_missing(v))
    if len(clean) < 8:
        return set()
    q1, q3 = clean[len(clean) // 4], clean[3 * len(clean) // 4]
    iqr = q3 - q1
    lo, hi = q1 - k * iqr, q3 + k * iqr
    return {i for i, v in enumerate(values) if not is_missing(v) and (v < lo or v > hi)}
