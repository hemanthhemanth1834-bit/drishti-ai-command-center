"""Rainfall intelligence: observed vs forecast, accumulation, anomaly."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy.orm import Session
from fastapi import Depends

from ..db import get_db
from ..services.providers import precipitation

router = APIRouter(prefix="/api/v1/rainfall", tags=["rainfall"])


@router.get("/current")
def current(lat: float, lon: float):
    p = precipitation(lat, lon)
    obs = p.get("hourly_observed_mm", []) or []
    fc = p.get("hourly_forecast_mm", []) or []
    daily = p.get("daily_sum_mm", []) or []
    if obs or fc:
        r1 = (fc[0] if fc else obs[-1]) if (fc or obs) else 0.0
        return {
            "lat": lat, "lon": lon,
            # OBSERVED (measured past hours)
            "observed": {
                "rain_1h_mm": round(obs[-1], 2) if obs else 0.0,
                "rain_6h_mm": round(sum(obs[-6:]), 2),
                "rain_24h_mm": round(sum(obs[-24:]), 2),
                "rain_72h_mm": round(sum(obs[-72:]), 2),
                "rain_7d_mm": round(sum(obs[-168:]), 2),
            },
            # FORECAST (model output, not measurements)
            "forecast": {
                "rain_6h_mm": round(sum(fc[:6]), 2),
                "rain_24h_mm": round(sum(fc[:24]), 2),
            },
            "rain_1h_mm": round(obs[-1], 2) if obs else 0.0,
            "rain_6h_mm": round(sum(obs[-6:]), 2),
            "rain_24h_mm": round(sum(obs[-24:]), 2),
            "rain_72h_mm": round(sum(obs[-72:]), 2),
            "rain_7d_mm": round(sum(obs[-168:]), 2),
            "daily_sum_mm": daily,
            "source": p.get("source"), "data_status": p.get("data_status"),
            "fallback_chain": p.get("fallback_chain", []),
            "updated": datetime.now(timezone.utc).isoformat(),
        }
    return {
        "lat": lat, "lon": lon,
        "rain_1h_mm": p.get("rain_1h", 0.0),
        "rain_24h_mm": p.get("rain_24h", 0.0),
        "daily_sum_mm": daily,
        "source": p.get("source"), "data_status": p.get("data_status"),
        "fallback_chain": p.get("fallback_chain", []),
        "updated": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/anomaly")
def anomaly(lat: float, lon: float, climatology_24h: float = 40.0):
    p = precipitation(lat, lon)
    obs = p.get("hourly_observed_mm", []) or []
    r24 = round(sum(obs[-24:]), 2) if obs else float(p.get("rain_24h", 0))
    anom = round((r24 - climatology_24h) / max(climatology_24h, 1) * 100, 1)
    return {"rain_24h_mm": r24, "climatology_24h_mm": climatology_24h,
            "anomaly_pct": anom, "basis": "OBSERVED" if obs else "DEMO",
            "antecedent_note": "antecedent = 72h minus 24h (see /current)",
            "source": p.get("source"), "data_status": p.get("data_status")}
