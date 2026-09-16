"""Early Warning Engine: AI + weather + thresholds + soil + satellite +
terrain + history + field reports -> WATCH | ALERT | WARNING | CRITICAL.

Language is decision-support only ("Predicted risk", "Requires field
verification") — never a deterministic disaster claim. Thresholds are
configurable via environment.
"""
from __future__ import annotations

import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from ml.inference import REGISTRY  # noqa: E402
from ml.schemas import LandslideFeatures  # noqa: E402

from ..db import SessionLocal, get_db
from ..models import platform as m
from ..services import spatial
from ..services.security import require_perm
from .terrain import analyze as terrain_analyze
from .weather import get_weather, threshold_state

router = APIRouter(prefix="/api/v1/warnings", tags=["warnings"])

W_PROB_CRIT = float(os.getenv("WARN_PROB_CRIT", "0.75"))
W_PROB_WARN = float(os.getenv("WARN_PROB_WARN", "0.5"))
W_PROB_ALERT = float(os.getenv("WARN_PROB_ALERT", "0.25"))


class WarnRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    soil_moisture: float = 55.0
    satellite_change: float = 2.0
    field_reports: int = 0


def _level(prob: float, rain_state: str, soil: float) -> str:
    if prob >= W_PROB_CRIT or (prob >= W_PROB_WARN and rain_state == "CRITICAL"):
        return "CRITICAL"
    if prob >= W_PROB_WARN or rain_state == "CRITICAL" or soil >= 90:
        return "WARNING"
    if prob >= W_PROB_ALERT or rain_state == "WARNING":
        return "ALERT"
    return "WATCH"


@router.post("/evaluate")
def evaluate(req: WarnRequest, db: Session = Depends(get_db),
             ident=Depends(require_perm("read"))):
    _ = ident
    wx = get_weather(req.lat, req.lon)
    rain_state = threshold_state(float(wx.get("rain_24h", 0))) \
        if "error" not in wx else "UNKNOWN"
    terr = terrain_analyze(req.lat, req.lon)
    feats = LandslideFeatures(
        rainfall_24h=float(wx.get("rain_24h", 0)),
        rainfall_72h=float(wx.get("rain_72h", 0)),
        rainfall_1h=float(wx.get("rain_1h", 0)),
        soil_moisture=req.soil_moisture, slope=terr["slope_deg"],
        elevation=terr["elevation_m"], satellite_change=req.satellite_change,
        hill_cutting_indicator=terr["hill_cutting"])
    pred = REGISTRY.predict(req.lat, req.lon, feats)
    places = [{"id": p.id, "kind": p.kind, "name": p.name, "lat": p.lat,
               "lon": p.lon} for p in db.query(m.Place).all()]
    roads = [{"id": r.id, "name": r.name, "lat": r.lat, "lon": r.lon,
              "status": r.status} for r in db.query(m.Road).all()]
    villages = spatial.within_radius(
        [p for p in places if p["kind"] == "village"], req.lat, req.lon, 10)
    roads_near = spatial.roads_in_zone(roads, req.lat, req.lon, 10)
    level = _level(pred.landslide_probability, rain_state, req.soil_moisture)
    wid = "wrn-" + uuid.uuid4().hex[:8]
    reasons = [
        f"AI predicted risk {pred.landslide_probability:.0%} "
        f"({pred.model_version}{' DEMO' if pred.simulated else ''})",
        f"24h rainfall {wx.get('rain_24h', '?')}mm [{rain_state}] "
        f"via {wx.get('source', '?')}",
        f"Soil moisture {req.soil_moisture}% | slope {terr['slope_deg']}° "
        f"| satellite Δ {req.satellite_change}%",
    ]
    if req.field_reports:
        reasons.append(f"{req.field_reports} nearby field report(s) raise concern")
    window = ("next 6-24h" if level in ("CRITICAL", "WARNING") else "next 24-72h")
    actions = {"WATCH": "Routine monitoring.",
               "ALERT": "Enhanced monitoring; verify sensors.",
               "WARNING": "Restrict heavy vehicles; alert residents; field team.",
               "CRITICAL": "Precautionary evacuation of exposed villages; "
                           "close high-risk road segments."}[level]
    try:
        db.add(m.Alert(id=wid, level=level, title=f"{level}: predicted risk "
                       f"near {req.lat:.2f},{req.lon:.2f}", lat=req.lat,
                       lon=req.lon,
                       source="DEMO" if pred.simulated else "MODEL"))
        db.commit()
    except Exception:
        pass
    return {
        "warning_id": wid, "level": level,
        "location": {"latitude": req.lat, "longitude": req.lon},
        "probability": pred.landslide_probability,
        "confidence": pred.confidence,
        "risk_level": pred.risk_level,
        "reasons": reasons,
        "expected_window": window + " (forecast window, not a fixed time)",
        "affected_villages": villages,
        "affected_roads": roads_near,
        "infrastructure": spatial.within_radius(
            [p for p in places if p["kind"] in ("hospital", "school", "bridge")],
            req.lat, req.lon, 10),
        "recommended_response": actions + " Requires field verification.",
        "source": "EarlyWarningEngine",
        "model_version": pred.model_version,
        "simulated": pred.simulated,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "disclaimer": "AI decision support — potential landslide, "
                      "not a certain event.",
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
    return {"prob_critical": W_PROB_CRIT, "prob_warning": W_PROB_WARN,
            "prob_alert": W_PROB_ALERT,
            "rain": "see /api/v1/weather/thresholds",
            "note": "Override via WARN_PROB_* env vars."}
