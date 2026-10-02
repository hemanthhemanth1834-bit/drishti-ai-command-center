"""GFS decoded fields → structured forecast records (Step 4). Run/forecast_hour/
valid_time are NEVER collapsed: each record carries all three, which forecast
verification (Step 12) requires. tp accumulations convert kg m**-2 → mm (1:1).
"""

from __future__ import annotations

from app.core import units
from app.services.processing import qc
from app.services.processing.grib import DecodedField


def process_fields(fields: list[DecodedField]) -> dict:
    records = []
    counts = {"received": 0, "valid": 0, "missing": 0, "flagged": 0}
    for f in fields:
        for i, lat in enumerate(f.latitudes):
            for j, lon in enumerate(f.longitudes):
                counts["received"] += 1
                raw = f.values[i][j]
                value = _to_canonical(f.variable, raw, f.grib_units)
                flag = qc.flag_value(f.variable, value)
                counts["valid" if flag == "VALID" else ("missing" if flag == "MISSING" else "flagged")] += 1
                records.append({
                    "variable": f.variable, "latitude": lat, "longitude": lon,
                    "run_time": f.run_time.isoformat(), "forecast_hour": f.forecast_hour,
                    "valid_time": f.valid_time.isoformat(), "value": value,
                    "unit": _canon_unit(f.variable),
                    "accumulation_kind": f.accumulation_kind,
                    "record_kind": "forecast", "quality": flag,
                    "grib": {"cf_name": f.cf_name, "units": f.grib_units, "level": f.level},
                })
    return {"record_kind": "forecast", "records": records, "quality_summary": counts,
            "grid": "0.25°", "crs": "EPSG:4326"}


def _to_canonical(variable: str, value: float | None, grib_units: str):
    if value is None:
        return None
    if variable == "precipitation" and grib_units == "kg m**-2":
        return float(value)  # 1 kg m**-2 water ≡ 1 mm
    if variable == "temperature_2m" and grib_units == "K":
        return units.celsius(float(value), "K")
    return float(value)  # r2 already %


def _canon_unit(variable: str) -> str:
    return {"precipitation": "mm", "temperature_2m": "°C",
            "relative_humidity_2m": "%"}.get(variable, "")
