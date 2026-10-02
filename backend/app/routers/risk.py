"""Flood/heavy-rain risk screening.

This endpoint is deterministic decision support, not a trained prediction model.
It never fabricates rainfall, soil or ML values when an upstream provider is
unavailable.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..services.security import rate_limit
from ..routers.terrain import analyze as terrain_analyze
from ..routers.weather import get_weather

router = APIRouter(prefix="/api/v1/risk", tags=["risk"])

WEIGHTS = {"rainfall_24h": 0.60, "forecast_24h": 0.25, "low_slope_exposure": 0.15}


class RiskRequest(BaseModel):
    lat: float
    lon: float


def _level(score: float) -> str:
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "WARNING"
    if score >= 35:
        return "WATCH"
    return "NORMAL"


@router.post("/assess")
def assess(req: RiskRequest, _=Depends(rate_limit(120))):
    wx = get_weather(req.lat, req.lon)
    if "error" in wx:
        return {
            "score": None,
            "probability": None,
            "risk_level": "NOT_AVAILABLE",
            "weights": WEIGHTS,
            "parts": {},
            "contributions": [],
            "provenance": {"weather": wx.get("source", "Open-Meteo")},
            "data_status": "UNAVAILABLE",
            "note": "No synthetic rainfall or ML fallback is used.",
        }

    terr = terrain_analyze(req.lat, req.lon)
    rain24 = float(wx.get("rain_24h", 0.0))
    forecast24 = float(wx.get("forecast_24h", 0.0))
    slope = float(terr.get("slope_deg", 0.0))
    low_slope = max(0.0, min(100.0, 100.0 - slope / 45.0 * 100.0))
    parts = {
        "rainfall_24h": min(100.0, rain24 / 200.0 * 100.0),
        "forecast_24h": min(100.0, forecast24 / 200.0 * 100.0),
        "low_slope_exposure": low_slope,
    }
    score = round(sum(parts[k] * WEIGHTS[k] for k in parts), 1)
    return {
        "score": score,
        "probability": round(score / 100.0, 4),
        "risk_level": _level(score),
        "weights": WEIGHTS,
        "parts": {k: round(v, 1) for k, v in parts.items()},
        "contributions": [
            {"feature": k, "contribution_pct": round(parts[k] * WEIGHTS[k] / max(score, 0.01) * 100.0, 1)}
            for k in sorted(parts, key=parts.get, reverse=True)
        ],
        "provenance": {
            "weather": wx.get("source", "Open-Meteo"),
            "terrain": terr.get("source", "terrain"),
        },
        "data_status": wx.get("data_status", "UNKNOWN"),
        "note": "Deterministic heavy-rain/flood screening score; not a validated ML probability.",
    }
