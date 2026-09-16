"""Rainfall intelligence: 1h/6h/24h/72h, accumulation, anomaly, thresholds."""
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
    hourly = p.get("hourly_next_mm", []) or []
    daily = p.get("daily_sum_mm", []) or []
    r1 = hourly[0] if hourly else p.get("rain_1h", 0.0)
    return {
        "lat": lat, "lon": lon,
        "rain_1h_mm": r1,
        "rain_6h_mm": round(sum(hourly[:6]), 2),
        "rain_24h_mm": round(sum(hourly[:24]), 2) if hourly else p.get("rain_24h", 0.0),
        "rain_72h_mm": round(sum(hourly[:72]), 2) if hourly else None,
        "daily_sum_mm": daily,
        "source": p.get("source"), "data_status": p.get("data_status"),
        "fallback_chain": p.get("fallback_chain", []),
        "updated": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/anomaly")
def anomaly(lat: float, lon: float, climatology_24h: float = 40.0):
    p = precipitation(lat, lon)
    hourly = p.get("hourly_next_mm", []) or []
    r24 = round(sum(hourly[:24]), 2) if hourly else float(p.get("rain_24h", 0))
    anom = round((r24 - climatology_24h) / max(climatology_24h, 1) * 100, 1)
    return {"rain_24h_mm": r24, "climatology_24h_mm": climatology_24h,
            "anomaly_pct": anom,
            "antecedent_note": "antecedent = 72h minus 24h (see /current)",
            "source": p.get("source"), "data_status": p.get("data_status")}
