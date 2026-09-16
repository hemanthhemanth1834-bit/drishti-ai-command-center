"""Transparent rule-based risk engine (deterministic, DEMO-labeled).

This is NOT the ML model — it is the auditable fallback/partner engine:
fixed weights, no training, every output shows its arithmetic. The ML
probability (when available) is reported alongside, never mixed silently.
"""
from __future__ import annotations

import sys
from pathlib import Path

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from ml.inference import REGISTRY, level_for  # noqa: E402
from ml.schemas import LandslideFeatures  # noqa: E402

from ..db import get_db
from ..services.providers import soil_moisture
from ..services.security import rate_limit
from ..routers.terrain import analyze as terrain_analyze
from ..routers.weather import get_weather

router = APIRouter(prefix="/api/v1/risk", tags=["risk"])

WEIGHTS = {"rainfall": 0.30, "soil": 0.25, "slope": 0.20,
           "history": 0.10, "satellite": 0.10, "roads": 0.05}


class RiskRequest(BaseModel):
    lat: float
    lon: float
    soil_moisture: float = 55.0
    satellite_change: float = 2.0
    history_count: int = 0
    road_exposure: float = 0.5


@router.post("/assess")
def assess(req: RiskRequest, _=Depends(rate_limit(120)),
           db: Session = Depends(get_db)):
    wx = get_weather(req.lat, req.lon)
    rain = float(wx.get("rain_24h", 0)) if "error" not in wx else 0.0
    terr = terrain_analyze(req.lat, req.lon)
    soil = soil_moisture(req.lat, req.lon)
    soil_pct = float(soil.get("soil_moisture_pct",
                              req.soil_moisture if "error" in soil
                              else req.soil_moisture))
    parts = {
        "rainfall": min(1.0, rain / 250) * 100,
        "soil": min(1.0, soil_pct / 100) * 100,
        "slope": min(1.0, terr["slope_deg"] / 45) * 100,
        "history": min(1.0, req.history_count / 5) * 100,
        "satellite": min(1.0, req.satellite_change / 25) * 100,
        "roads": req.road_exposure * 100,
    }
    score = round(sum(parts[k] * WEIGHTS[k] for k in parts), 1)
    prob = round(score / 100, 4)
    ml_prob = None
    try:
        feats = LandslideFeatures(rainfall_24h=rain, soil_moisture=soil_pct,
                                  slope=terr["slope_deg"],
                                  elevation=terr["elevation_m"],
                                  satellite_change=req.satellite_change)
        ml = REGISTRY.predict(req.lat, req.lon, feats)
        ml_prob = {"probability": ml.landslide_probability,
                   "model_version": ml.model_version,
                   "simulated": ml.simulated}
    except Exception:
        pass
    contribs = sorted(
        ({"feature": k, "contribution_pct": round(parts[k] * WEIGHTS[k] / max(score, 0.01) * 100, 1)}
         for k in parts), key=lambda c: c["contribution_pct"], reverse=True)
    return {
        "score": score, "probability": prob, "risk_level": level_for(prob),
        "weights": WEIGHTS, "parts": {k: round(v, 1) for k, v in parts.items()},
        "contributions": contribs,
        "ml alongside": ml_prob,
        "provenance": {
            "rainfall": wx.get("source", "?"),
            "soil": soil.get("source", "?"),
            "terrain": terr.get("source", "?"),
        },
        "data_status": "DEMO",
        "note": "Deterministic fallback engine — auditable arithmetic, "
                "not a trained model.",
    }
