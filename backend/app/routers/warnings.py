"""Heavy-rainfall warning engine.

Deterministic screening only: live/forecast rainfall thresholds are evaluated
and provenance is returned. No landslide model, soil fallback or synthetic
probability is used.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import platform as m
from ..services.security import require_perm
from .weather import get_weather, threshold_state

router = APIRouter(prefix="/api/v1/warnings", tags=["warnings"])


class WarnRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    field_reports: int = Field(default=0, ge=0)


def _level(rain_state: str, forecast_24h: float) -> str:
    if rain_state == "CRITICAL" or forecast_24h >= 200:
        return "CRITICAL"
    if rain_state == "WARNING" or forecast_24h >= 120:
        return "WARNING"
    if forecast_24h >= 60:
        return "WATCH"
    return "NORMAL"


@router.post("/evaluate")
def evaluate(req: WarnRequest, db: Session = Depends(get_db),
             ident=Depends(require_perm("read"))):
    _ = ident
    wx = get_weather(req.lat, req.lon)
    if "error" in wx:
        return {
            "warning_id": None,
            "level": "NOT_AVAILABLE",
            "location": {"latitude": req.lat, "longitude": req.lon},
            "risk_score": None,
            "reasons": ["Live rainfall provider unavailable; no synthetic fallback is used."],
            "source": wx.get("source", "Open-Meteo"),
            "data_status": "UNAVAILABLE",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    rain24 = float(wx.get("rain_24h", 0.0))
    forecast24 = float(wx.get("forecast_24h", 0.0))
    rain_state = threshold_state(rain24)
    level = _level(rain_state, forecast24)
    score = round(min(100.0, max(rain24 / 200.0, forecast24 / 200.0) * 100.0), 1)
    wid = "wrn-" + uuid.uuid4().hex[:8]

    reasons = [
        f"Observed/available 24h rainfall: {rain24:.1f} mm [{rain_state}] via {wx.get('source', '?')}",
        f"Next-24h forecast rainfall: {forecast24:.1f} mm",
    ]
    if req.field_reports:
        reasons.append(f"{req.field_reports} nearby field report(s) require verification")

    try:
        db.add(m.Alert(id=wid, level=level, title=f"{level}: heavy-rainfall screening",
                       lat=req.lat, lon=req.lon, source="Open-Meteo"))
        db.commit()
    except Exception:
        pass

    return {
        "warning_id": wid,
        "level": level,
        "location": {"latitude": req.lat, "longitude": req.lon},
        "risk_score": score,
        "rain_24h_mm": rain24,
        "forecast_24h_mm": forecast24,
        "reasons": reasons,
        "source": wx.get("source", "Open-Meteo"),
        "data_status": wx.get("data_status", "UNKNOWN"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "disclaimer": "Deterministic heavy-rainfall screening; not an official government warning and not a validated ML probability.",
    }


@router.get("/active")
def active(db: Session = Depends(get_db)):
    rows = db.query(m.Alert).order_by(m.Alert.ts.desc()).limit(50).all()
    return {"count": len(rows), "alerts": [
        {"id": a.id, "level": a.level, "title": a.title, "lat": a.lat,
         "lon": a.lon, "source": a.source,
         "ts": a.ts.isoformat() if a.ts else None} for a in rows]}


@router.get("/config")
def config():
    return {
        "rain_24h_warn_mm": 120,
        "rain_24h_critical_mm": 200,
        "forecast_24h_watch_mm": 60,
        "forecast_24h_warn_mm": 120,
        "forecast_24h_critical_mm": 200,
        "note": "Thresholds are screening values and are not official IMD warning classifications.",
    }
