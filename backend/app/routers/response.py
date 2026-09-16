"""Emergency response prioritisation: transparent P1..Pn scoring with WHY."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import platform as m
from ..services import spatial

router = APIRouter(prefix="/api/v1/response", tags=["response"])


class PriorityRequest(BaseModel):
    lat: float
    lon: float
    probability: float = 0.5
    exposed_population: int = 500
    road_access: float = 0.5  # 0= cut off .. 1 = open
    infra_weight: float = 0.5
    shelter_capacity: int = 200
    unit_dist_km: float = 12.0
    rain_24h: float = 60.0
    severity: str = "moderate"


SEV_W = {"low": 0.1, "moderate": 0.4, "high": 0.7, "critical": 1.0}


def score(req: PriorityRequest) -> dict:
    parts = {
        "ai_probability": req.probability * 0.25,
        "exposed_population": min(1.0, req.exposed_population / 2000) * 0.2,
        "road_cutoff": (1 - req.road_access) * 0.15,
        "infrastructure": req.infra_weight * 0.1,
        "shelter_gap": max(0.0, 1 - req.shelter_capacity / max(req.exposed_population, 1)) * 0.1,
        "unit_distance": min(1.0, req.unit_dist_km / 50) * 0.05,
        "rain": min(1.0, req.rain_24h / 250) * 0.1,
        "severity": SEV_W.get(req.severity, 0.4) * 0.05,
    }
    total = round(sum(parts.values()) * 100, 1)
    band = "P1" if total >= 70 else "P2" if total >= 45 else "P3" if total >= 25 else "P4"
    why = [f"{k}: +{round(v * 100, 1)} pts" for k, v in
           sorted(parts.items(), key=lambda kv: kv[1], reverse=True) if v > 0.005]
    return {"score": total, "band": band, "why": why, "parts": parts}


@router.post("/prioritize")
def prioritize(req: PriorityRequest):
    return {"inputs": req.model_dump(), **score(req),
            "note": "Transparent triage aid — commander decides."}


@router.get("/queue")
def queue(db: Session = Depends(get_db)):
    alerts = db.query(m.Alert).order_by(m.Alert.ts.desc()).limit(20).all()
    units = [{"id": u.id, "lat": u.lat, "lon": u.lon}
             for u in db.query(m.ResponseUnit).all()]
    shelters = [{"capacity": p.capacity} for p in
                db.query(m.Place).filter_by(kind="shelter").all()]
    cap = sum(s["capacity"] for s in shelters)
    items = []
    for a in alerts:
        near = spatial.nearest(units, a.lat, a.lon, 1)
        sc = score(PriorityRequest(
            lat=a.lat, lon=a.lon,
            probability=0.8 if a.level == "CRITICAL" else 0.5,
            exposed_population=800, road_access=0.5, infra_weight=0.5,
            shelter_capacity=cap, unit_dist_km=near[0]["dist_km"] if near else 25,
            severity="critical" if a.level == "CRITICAL" else "moderate"))
        items.append({"alert_id": a.id, "level": a.level, "title": a.title,
                      **sc})
    items.sort(key=lambda x: x["score"], reverse=True)
    return {"count": len(items), "queue": items}
