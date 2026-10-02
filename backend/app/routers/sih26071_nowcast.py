"""Nowcast routes (Step 6). Registry-gated NOWCAST artifacts; live causal features;
grid output for the TEST ROI. Statuses: READY / PARTIAL / UNAVAILABLE.
"""

import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from ml.features.nowcast import (  # noqa: E402
    FEATURE_SCHEMA_VERSION,
    INTERVALS,
    MOTION_ESTIMATION_STATUS,
    MOTION_NOTE,
)
from ml.inference import predict as inference  # noqa: E402
from ml.registry import registry as registry_mod  # noqa: E402

router = APIRouter()
# Serve the HistGradientBoosting nowcasts (0.8–2.1 MB each): already trained,
# registered and evaluated on nowcast-testroi-2022-2024-v06, fitting the Render
# Free 512 MB budget where the 36–47 MB RF bundles cannot. Model identity is
# echoed in every response; nothing retrained or fabricated for this switch.
MODEL_FOR_INTERVAL = {"0-1h": "nowcast-0-1h-hist-gradient-boosting",
                      "1-3h": "nowcast-1-3h-hist-gradient-boosting",
                      "3-6h": "nowcast-3-6h-hist-gradient-boosting"}
TEST_ROI = [("delhi_nw", 28.75, 77.00), ("delhi_ne", 28.75, 77.25),
            ("delhi_sw", 28.50, 77.00), ("delhi_se", 28.50, 77.25)]


def _live_history(lat: float, lon: float) -> dict[str, dict]:
    from datetime import datetime, timedelta, timezone

    from app.core.cache import FileCache
    from app.services.providers.openmeteo import OpenMeteoProvider

    end = datetime.now(timezone.utc).date()
    start = (end - timedelta(days=3)).isoformat()
    prov = OpenMeteoProvider(
        cache=FileCache(Path(__file__).resolve().parents[3] / "data" / ".cache"))
    fetch = prov.fetch_historical(lat, lon, start, end.isoformat())
    by_time: dict[str, dict] = {}
    for o in fetch["observations"]:
        by_time.setdefault(o["timestamp"], {})[o["variable"]] = o["value"]
    return by_time


def _feature_row(lat: float, lon: float, by_time: dict, nbr_series: list) -> tuple[dict, str, str]:
    from ml.features.nowcast import availability_row
    from ml.features.rainfall import temporal_features
    from datetime import datetime

    times = sorted(by_time)
    if len(times) < 30:
        raise HTTPException(status_code=502, detail="insufficient live history for nowcast features")
    T = times[-1]
    idx = times.index(T)
    series = [by_time[t].get("precipitation") for t in times]
    if any(v is None for v in series[idx - 24:idx + 1]):
        raise HTTPException(status_code=502, detail="live feature gap — refusing gap-filled nowcast")
    row = dict(temporal_features(datetime.fromisoformat(T)))
    for L in (1, 3, 6, 12, 24):
        row[f"rain_lag_{L}h"] = series[idx - L]
    for W in (3, 6, 12, 24):
        row[f"rain_roll_{W}h"] = sum(series[idx - W:idx])
    cur = by_time[T]
    row.update({"temperature": cur.get("temperature_2m"), "humidity": cur.get("relative_humidity_2m"),
                "pressure": cur.get("pressure_msl"), "wind_speed": cur.get("wind_speed_10m"),
                "wind_direction": cur.get("wind_direction_10m"),
                "elevation": None, "latitude": lat, "longitude": lon})
    if any(row.get(c) is None for c in ("temperature", "humidity", "pressure")):
        raise HTTPException(status_code=502, detail="live weather gap — refusing gap-filled nowcast")
    nbr_vals = [s[idx - 1] for s in nbr_series if s is not None and len(s) > idx and s[idx - 1] is not None]
    if nbr_vals:
        row.update({"nbr_lag1_mean": sum(nbr_vals) / len(nbr_vals), "nbr_lag1_max": max(nbr_vals),
                    "nbr_lag1_range": max(nbr_vals) - min(nbr_vals), "nbr_count": float(len(nbr_vals))})
        status = "READY"
    else:
        row.update({"nbr_lag1_mean": None, "nbr_lag1_max": None,
                    "nbr_lag1_range": None, "nbr_count": 0.0})
        status = "PARTIAL"
    row.update(availability_row(has_rain=True, has_terrain=False, nbr_count=int(row["nbr_count"])))
    return row, status, T


@router.get("/api/v1/ml/nowcast/status")
def nowcast_status() -> dict:
    models = [m for m in registry_mod.list_models() if m.get("model_type") == "NOWCAST"]
    return {"scope": "TEST ROI", "trained": bool(models),
            "intervals": sorted(INTERVALS),
            "temporal_resolution": "1 h (claimed; no finer resolution asserted)",
            "spatial_resolution": "0.1° common grid",
            "motion_estimation_status": MOTION_ESTIMATION_STATUS,
            "sources": {"observations": "AVAILABLE (key-free archive replay → HISTORICAL)",
                        "NWP": "UNAVAILABLE (no archived GFS)",
                        "satellite": "UNAVAILABLE (auth required)",
                        "radar": "UNAVAILABLE (no feed)"},
            "models": len(models)}


@router.get("/api/v1/ml/nowcast/models")
def nowcast_models() -> dict:
    return {"models": [{k: m.get(k) for k in
                        ("model_id", "version", "model_type", "target", "algorithm",
                         "training_dataset_id", "scope", "created_at")}
                       for m in registry_mod.list_models() if m.get("model_type") == "NOWCAST"]}


@router.post("/api/v1/ml/rainfall/nowcast")
def rainfall_nowcast(
    lat: float = Query(..., ge=-90, le=90), lon: float = Query(..., ge=-180, le=180),
    horizon: str = Query("0-1h"),
) -> dict:
    if horizon not in INTERVALS:
        raise HTTPException(status_code=422, detail="horizon must be one of 0-1h, 1-3h, 3-6h")
    entry = next((m for m in registry_mod.list_models()
                  if m["model_id"] == MODEL_FOR_INTERVAL[horizon]), None)
    if entry is None:
        raise HTTPException(status_code=503, detail={"status": "NOT_TRAINED", "horizon": horizon})
    if not inference.artifact_path(entry).exists():
        raise HTTPException(status_code=503, detail={
            "status": "GATED",
            "reason": (f"artifact for {entry['model_id']} not deployed in this environment; "
                       "no nowcast fabricated"),
            "model_id": entry["model_id"], "horizon": horizon,
            "uncertainty": {"status": "NOT_IMPLEMENTED"},
        })
    try:
        by_time = _live_history(lat, lon)
        nbr_series = []
        for _, nlat, nlon in TEST_ROI:
            try:
                nb = _live_history(nlat, nlon)
                ts = sorted(nb)
                nbr_series.append([nb[t].get("precipitation") for t in ts])
            except Exception:  # noqa: BLE001 — neighbor gaps degrade, never fail
                nbr_series.append(None)
        row, status, T = _feature_row(lat, lon, by_time, nbr_series)
        from datetime import datetime, timedelta
        a, b = INTERVALS[horizon]
        valid = (datetime.fromisoformat(T) + timedelta(hours=b)).isoformat()
        return {"timestamp": T, "init_time": T, "valid_time": valid,
                "latitude": lat, "longitude": lon, "horizon": horizon,
                "nowcast_status": status, "motion_estimation_status": MOTION_ESTIMATION_STATUS,
                **inference.predict_with_model(entry["model_id"], row, entry["version"])}
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"nowcast unavailable: {exc}") from exc


@router.get("/api/v1/ml/nowcast/grid")
def nowcast_grid(horizon: str = Query("0-1h")) -> dict:
    """Machine-readable TEST-ROI grid output (one cell per point)."""
    if horizon not in INTERVALS:
        raise HTTPException(status_code=422, detail="horizon must be one of 0-1h, 1-3h, 3-6h")
    entry = next((m for m in registry_mod.list_models()
                  if m["model_id"] == MODEL_FOR_INTERVAL[horizon]), None)
    if entry is None:
        raise HTTPException(status_code=503, detail={"status": "NOT_TRAINED", "horizon": horizon})
    if not inference.artifact_path(entry).exists():
        return {"horizon": horizon, "grid": "TEST ROI 2x2 (0.1° concept, 0.25° actual spacing)",
                "motion_estimation_status": MOTION_ESTIMATION_STATUS,
                "status": "GATED",
                "reason": (f"artifact for {entry['model_id']} not deployed in this environment; "
                           "no nowcast fabricated"),
                "cells": [{"point_id": pid, "latitude": nlat, "longitude": nlon,
                           "status": "GATED", "reason": "artifact not deployed"}
                          for pid, nlat, nlon in TEST_ROI],
                "provenance": {"model_id": entry["model_id"], "version": entry["version"],
                               "training_dataset_id": entry["training_dataset_id"]}}
    cells = []
    histories = {}
    for pid, nlat, nlon in TEST_ROI:
        try:
            histories[pid] = _live_history(nlat, nlon)
        except Exception as exc:  # noqa: BLE001
            cells.append({"point_id": pid, "latitude": nlat, "longitude": nlon,
                          "status": "UNAVAILABLE", "reason": str(exc)[:120]})
    nbr_all = []
    for pid, hist in histories.items():
        ts = sorted(hist)
        nbr_all.append([hist[t].get("precipitation") for t in ts])
    for pid, nlat, nlon in TEST_ROI:
        if pid not in histories:
            continue
        try:
            others = [s for q, s in zip(histories, nbr_all) if q != pid]
            row, status, T = _feature_row(nlat, nlon, histories[pid], others)
            pred = inference.predict_with_model(entry["model_id"], row, entry["version"])
            from datetime import datetime, timedelta
            b = INTERVALS[horizon][1]
            valid = (datetime.fromisoformat(T) + timedelta(hours=b)).isoformat()
            cells.append({"point_id": pid, "latitude": nlat, "longitude": nlon,
                          "prediction_mm": pred["prediction_mm"],
                          "intensity_category": pred.get("intensity_category", "UNAVAILABLE"),
                          "horizon": horizon,
                          "timestamp": T, "init_time": T, "valid_time": valid,
                          "status": status,
                          "source_states": pred["source_states"],
                          "model_id": entry["model_id"], "version": entry["version"]})
        except HTTPException as exc:
            cells.append({"point_id": pid, "latitude": nlat, "longitude": nlon,
                          "status": "UNAVAILABLE", "reason": str(exc.detail)[:120]})
    return {"horizon": horizon, "grid": "TEST ROI 2x2 (0.1° concept, 0.25° actual spacing)",
            "motion_estimation_status": MOTION_ESTIMATION_STATUS, "cells": cells,
            "provenance": {"model_id": entry["model_id"], "version": entry["version"],
                           "training_dataset_id": entry["training_dataset_id"]}}
