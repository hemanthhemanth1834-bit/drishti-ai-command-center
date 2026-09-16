"""Sector impact: one disaster -> per-sector impact rows.

Statuses: LIVE (measured), CALCULATED (derived from live/demo inputs),
DEMO (synthetic), NOT_AVAILABLE. Never invents impact numbers — every row
shows its derivation.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import geo as g
from ..services import spatial

router = APIRouter(prefix="/api/v1/sectors", tags=["sectors"])

SECTOR_OF = {
    "flood": ["agri", "transport", "health", "urban", "infrastructure"],
    "flash_flood": ["urban", "transport", "health", "infrastructure"],
    "cyclone": ["coastal", "agri", "transport", "health", "infrastructure"],
    "landslide": ["transport", "infrastructure", "health"],
    "fire": ["urban", "health", "infrastructure"],
    "heatwave": ["health", "agri"],
    "drought": ["agri", "health"],
    "earthquake": ["urban", "health", "infrastructure", "transport"],
}


@router.get("/impact")
def impact(disaster: str, lat: float, lon: float,
           probability: float = 0.5, db: Session = Depends(get_db)):
    sectors = SECTOR_OF.get(disaster, ["urban", "health"])
    from ..models import platform as m
    places = [{"lat": p.lat, "lon": p.lon, "name": p.name, "kind": p.kind}
              for p in db.query(m.Place).all()]
    roads = [{"lat": r.lat, "lon": r.lon, "name": r.name, "status": r.status}
             for r in db.query(m.Road).all()]
    near_places = spatial.within_radius(places, lat, lon, 15)
    near_roads = spatial.roads_in_zone(roads, lat, lon, 15)
    blocked = [r for r in near_roads if r.get("status") in ("BLOCKED", "HIGH RISK")]
    rows = []
    for s in sectors:
        if s == "transport":
            detail = f"{len(blocked)} of {len(near_roads)} nearby segments blocked/high-risk"
        elif s in ("health", "urban", "infrastructure"):
            detail = f"{len(near_places)} exposed places within 15 km"
        elif s == "agri":
            detail = f"cropland exposure estimated from {len(near_places)} rural places (coarse)"
        elif s == "coastal":
            detail = "storm-surge exposure requires surge model — NOT_AVAILABLE"
        else:
            detail = f"{len(near_places)} places in footprint"
        status = ("NOT_AVAILABLE" if s == "coastal"
                  else "CALCULATED")
        rows.append({"sector": s, "detail": detail, "status": status,
                     "inputs": {"probability": probability,
                                "places_15km": len(near_places),
                                "roads_15km": len(near_roads)}})
    return {"disaster": disaster, "lat": lat, "lon": lon,
            "impacts": rows,
            "note": "Derived from registry geometry + caller probability — "
                    "field verification required."}
