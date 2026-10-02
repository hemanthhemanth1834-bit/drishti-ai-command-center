"""GRIB2 decoding (Step 4). Primary: cfgrib + xarray + ecCodes (open source).

Measured 2026-09-28 on live NOMADS GFS 0.25° ROI bytes (1x1°, f006) — variable
names below are OBSERVED, not assumed:

| request (filter,var) | cfgrib var | GRIB shortName | units    | level            |
|----------------------|------------|----------------|----------|------------------|
| var_APCP surface     | tp         | tp             | kg m**-2 | surface          |
| var_TMP 2m above gnd | t2m        | (see attrs)    | K        | heightAboveGround|
| var_RH  2m above gnd | r2         | (see attrs)    | %        | heightAboveGround|

tp (total precipitation) is an INTERVAL ACCUMULATION over [run, valid_time]
(kg m**-2 ≡ mm water). Never confuse with instantaneous rate.

Requires the native ecCodes library: Linux `apt install libeccodes-dev`
(plus pip cfgrib/xarray); Windows dev notes in docs/INGESTION-RUNBOOK.md.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

GRIB_VARS: dict[str, dict] = {
    # canonical var → NOMADS filter pair + decode expectations + accumulation kind
    "precipitation": {"filter_var": "var_APCP", "filter_lev": "lev_surface",
                      "cf_names": ("tp",), "canonical_unit": "mm",
                      "kind": "interval-accumulation [run, valid_time]"},
    "temperature_2m": {"filter_var": "var_TMP", "filter_lev": "lev_2_m_above_ground",
                       "cf_names": ("t2m",), "canonical_unit": "°C",
                       "kind": "instantaneous at valid_time"},
    "relative_humidity_2m": {"filter_var": "var_RH", "filter_lev": "lev_2_m_above_ground",
                             "cf_names": ("r2",), "canonical_unit": "%",
                             "kind": "instantaneous at valid_time"},
}


@dataclass
class DecodedField:
    variable: str          # canonical DRISHTI-X name
    cf_name: str           # cfgrib variable actually found
    grib_units: str
    level: str
    run_time: datetime
    valid_time: datetime
    forecast_hour: str
    latitudes: list[float]
    longitudes: list[float]
    values: list[list[float]]  # row-major [lat][lon]
    accumulation_kind: str


def _require_backend():
    try:
        import cfgrib  # noqa: F401
        import xarray  # noqa: F401
    except ImportError as exc:
        raise ImportError(
            "GRIB decoding needs pip packages cfgrib+xarray AND the native ecCodes "
            "library (Linux: apt install libeccodes-dev).") from exc


def decode_grib(path: str | Path, expect: str = "precipitation") -> list[DecodedField]:
    """Decode a NOMADS subset file. Raises ValueError on malformed/empty input."""
    _require_backend()
    import cfgrib

    p = Path(path)
    if not p.exists() or p.stat().st_size == 0:
        raise ValueError(f"missing or empty GRIB file: {path}")
    spec = GRIB_VARS[expect]
    try:
        datasets = cfgrib.open_datasets(str(p))
    except Exception as exc:
        raise ValueError(f"malformed GRIB (cfgrib cannot open {path}): {exc}") from exc
    if not datasets:
        raise ValueError(f"no decodable messages in {path}")
    out: list[DecodedField] = []
    for ds in datasets:
        for cf in spec["cf_names"]:
            if cf not in ds.data_vars:
                continue
            da = ds[cf]
            run = _to_utc(ds.coords["time"].values)
            valid = _to_utc(ds.coords["valid_time"].values)
            lats = [float(v) for v in ds.coords["latitude"].values]
            lons = [float(v) for v in ds.coords["longitude"].values]
            vals = da.values
            if vals is None or vals.size == 0:
                raise ValueError(f"empty values for {cf} in {path}")
            out.append(DecodedField(
                variable=expect, cf_name=cf, grib_units=str(da.attrs.get("units", "")),
                level=str(da.attrs.get("GRIB_typeOfLevel", "")),
                run_time=run, valid_time=valid,
                forecast_hour=str(ds.attrs.get("GRIB_step", da.attrs.get("GRIB_step", ""))),
                latitudes=lats, longitudes=lons, values=vals.tolist(),
                accumulation_kind=spec["kind"]))
    if not out:
        raise ValueError(f"expected variable {spec['cf_names']} not in {path} "
                         f"(found {[list(d.data_vars) for d in datasets]})")
    return out


def _to_utc(v) -> datetime:
    import numpy as np
    import pandas as pd
    if isinstance(v, np.ndarray) and v.size == 1:
        v = v.reshape(-1)[0]
    dt = pd.Timestamp(v).to_pydatetime()
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
