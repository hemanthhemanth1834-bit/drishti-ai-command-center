"""ML routes (Step 5). Real predictions from registered artifacts only; structured
NOT_TRAINED/UNAVAILABLE otherwise. Uncertainty is NOT_IMPLEMENTED, never invented.
"""

import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from ml.features.rainfall import MODEL_FEATURES, temporal_features  # noqa: E402
from ml.inference import predict as inference  # noqa: E402

router = APIRouter()
# 1h serves the Random Forest (shipped since the first production inference);
# 3h/6h serve the HistGradientBoosting models — already trained, registered and
# evaluated (skill equivalent to RF on this TEST ROI: 3h MAE 0.797 vs 0.816,
# 6h MAE 1.384 vs 1.385; see docs/ML-EVALUATION-REPORT.md), ~2 MB each so they
# fit the Render Free 512 MB budget where the 48–56 MB RF bundles cannot.
# No model was retrained or fabricated for this switch; the served model_id is
# echoed in every response and in the UI.
MODEL_FOR_HORIZON = {1: "rainfall-1h-random-forest", 3: "rainfall-3h-hist-gradient-boosting",
                     6: "rainfall-6h-hist-gradient-boosting"}


@router.get("/status")
def ml_status() -> dict:
    return {"scope": "TEST ROI models only", **inference.model_status()}


@router.get("/models")
def ml_models() -> dict:
    return {"models": [{k: m.get(k) for k in
                        ("model_id", "version", "target", "horizon_h", "algorithm",
                         "training_dataset_id", "scope", "created_at")}
                       for m in inference.model_status().get("models", [])]}


@router.post("/rainfall/predict")
def rainfall_predict(
    lat: float = Query(..., ge=-90, le=90), lon: float = Query(..., ge=-180, le=180),
    horizon_h: int = Query(1),
) -> dict:
    """Predict from live key-free features (past 48 h archive → causal lags)."""
    if horizon_h not in (1, 3, 6):
        raise HTTPException(status_code=422, detail="horizon_h must be one of 1, 3, 6")
    from app.core.cache import FileCache
    from app.services.providers.openmeteo import OpenMeteoProvider
    from datetime import datetime, timedelta, timezone

    status = inference.model_status()
    if not status.get("trained"):
        raise HTTPException(status_code=503, detail=status)
    # Per-horizon artifact gate: registry entry alone is NOT enough — the
    # artifact file must be deployed in this environment. 3h/6h stay GATED
    # (503 ARTIFACT_UNAVAILABLE) on Render Free instead of failing late as 502.
    try:
        from ml.registry import registry as registry_mod
        entry = registry_mod.get(MODEL_FOR_HORIZON[horizon_h])
        if not inference.artifact_path(entry).exists():
            raise HTTPException(status_code=503, detail={
                "status": "GATED",
                "reason": (f"artifact for {MODEL_FOR_HORIZON[horizon_h]} not deployed "
                           "in this environment (Render 512 MB limit — 1h only shipped); "
                           "no prediction fabricated"),
                "model_id": MODEL_FOR_HORIZON[horizon_h],
                "horizon_h": horizon_h,
                "uncertainty": {"status": "NOT_IMPLEMENTED"},
            })
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001 — registry lookup failure → honest 503
        raise HTTPException(status_code=503, detail={"status": "GATED",
                                                     "reason": f"registry lookup failed: {exc}"}) from exc
    try:
        end = datetime.now(timezone.utc).date()
        start = (end - timedelta(days=3)).isoformat()
        prov = OpenMeteoProvider(cache=FileCache(Path(__file__).resolve().parents[3] / "data" / ".cache"))
        fetch = prov.fetch_historical(lat, lon, start, end.isoformat())
        by_time: dict[str, dict] = {}
        for o in fetch["observations"]:
            by_time.setdefault(o["timestamp"], {})[o["variable"]] = o["value"]
        times = sorted(by_time)
        if len(times) < 30:
            raise HTTPException(status_code=502, detail="insufficient live history for features")
        T = times[-1]
        idx = times.index(T)
        series = [by_time[t].get("precipitation") for t in times]
        row = dict(temporal_features(datetime.fromisoformat(T)))
        for L in (1, 3, 6, 12, 24):
            row[f"rain_lag_{L}h"] = series[idx - L]
        for W in (3, 6, 12, 24):
            window = series[idx - W:idx]
            row[f"rain_roll_{W}h"] = sum(window) if all(v is not None for v in window) else None
        cur = by_time[T]
        row.update({"temperature": cur.get("temperature_2m"), "humidity": cur.get("relative_humidity_2m"),
                    "pressure": cur.get("pressure_msl"), "wind_speed": cur.get("wind_speed_10m"),
                    "wind_direction": cur.get("wind_direction_10m"),
                    "elevation": None, "latitude": lat, "longitude": lon,
                    "rainfall_obs_state": "OBSERVED", "gfs_state": "UNAVAILABLE",
                    "satellite_state": "UNAVAILABLE", "radar_state": "UNAVAILABLE",
                    "terrain_state": "MISSING"})
        if any(row[c] is None for c in MODEL_FEATURES if c != "elevation"):
            raise HTTPException(status_code=502, detail="live feature gap — refusing to predict on imputed inputs")
        return {"timestamp": T, "latitude": lat, "longitude": lon,
                **inference.predict_with_model(MODEL_FOR_HORIZON[horizon_h], row)}
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001 — provider failure → structured, not fake
        raise HTTPException(status_code=502, detail=f"prediction unavailable: {exc}") from exc
