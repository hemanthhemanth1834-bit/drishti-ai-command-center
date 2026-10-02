"""Open-Meteo fetch → processed records (Step 4). Forecast values are NEVER
relabelled as observations: output keeps `record_kind` ∈ {forecast, historical}
mirroring the provider status (FORECAST / HISTORICAL).
"""

from __future__ import annotations

from app.core import units
from app.schemas.observations import QualityFlag
from app.services.processing import qc
from app.services.processing.temporal import TemporalRecord, align, ensure_utc

ACCUM_KIND = "interval-accumulation per provider timestep (hourly)"


def process_fetch(fetch: dict) -> dict:
    """Clean + temporally align one adapter payload. Returns records + quality summary."""
    status = fetch.get("status", "UNAVAILABLE")
    record_kind = {"FORECAST": "forecast", "HISTORICAL": "historical"}.get(status, "unknown")
    series: dict[tuple[str, str], list[TemporalRecord]] = {}
    counts = {"received": 0, "valid": 0, "missing": 0, "flagged": 0, "duplicates": 0}
    seen: set[tuple] = set()
    for o in fetch.get("observations", []):
        counts["received"] += 1
        key = (o["variable"], o["timestamp"])
        if key in seen:
            counts["duplicates"] += 1
            continue
        seen.add(key)
        flag = qc.flag_value(o["variable"], o.get("value"))
        if flag == "MISSING":
            counts["missing"] += 1
        elif flag == "VALID":
            counts["valid"] += 1
        else:
            counts["flagged"] += 1  # OUTLIER/INVALID/SUSPECT kept with flag
        grid_key = (o["variable"], str(o.get("latitude")), str(o.get("longitude")))
        series.setdefault(grid_key, []).append(TemporalRecord(
            ensure_utc(_parse(o["timestamp"])), o.get("value"),
            valid_time=ensure_utc(_parse(o.get("valid_time", o["timestamp"])))))
    aligned = {k: align(v, step="1h") for k, v in series.items()}
    records = []
    for (variable, lat, lon), recs in aligned.items():
        for r in recs:
            records.append({
                "variable": variable, "latitude": float(lat), "longitude": float(lon),
                "timestamp": r.valid_time.isoformat(), "value": r.value,
                "unit": _canon_unit(variable), "record_kind": record_kind,
                "accumulation_kind": ACCUM_KIND if variable == "precipitation" else "instantaneous",
                "quality": qc.flag_value(variable, r.value),
                "derived": r.method != "observed", "method": r.method,
                "source": fetch.get("source_id"), "status": status,
                "provenance_run_id": fetch.get("provenance_run_id"),
            })
    return {"record_kind": record_kind, "records": records, "quality_summary": counts,
            "temporal_step": "1h", "crs": "EPSG:4326"}


def _parse(s: str):
    from datetime import datetime
    return datetime.fromisoformat(s)


def _canon_unit(variable: str) -> str:
    return {"precipitation": "mm", "temperature_2m": "°C", "relative_humidity_2m": "%",
            "wind_speed_10m": "m/s", "wind_direction_10m": "°",
            "pressure_msl": "hPa"}.get(variable, "")
