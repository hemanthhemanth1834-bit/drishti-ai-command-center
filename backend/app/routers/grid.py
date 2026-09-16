"""NER spatial risk grid: cells with terrain + AI probability + exposure.

Grid covers the North Eastern Region bounding box at configurable
resolution. Each cell joins rainfall (demo), soil (demo), terrain,
history count, AI probability, nearby roads/places. Persisted to
risk_cells for the GIS risk-map.
"""
from __future__ import annotations

import sys
from pathlib import Path

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from ml.inference import REGISTRY  # noqa: E402
from ml.schemas import LandslideFeatures  # noqa: E402

from ..db import get_db
from ..models import platform as m
from ..services import spatial
from .terrain import analyze as terrain_analyze

router = APIRouter(prefix="/api/v1/grid", tags=["grid"])

NER_BBOX = {"min_lat": 21.5, "max_lat": 29.5, "min_lon": 88.0, "max_lon": 97.5}


@router.get("/risk-cells")
def risk_cells(step: float = 1.0, db: Session = Depends(get_db)):
    step = min(max(step, 0.25), 2.0)
    lats, rows = [], []
    lat = NER_BBOX["min_lat"]
    hist = db.query(m.HistoricalIncident).all()
    roads = [{"id": r.id, "name": r.name, "lat": r.lat, "lon": r.lon}
             for r in db.query(m.Road).all()]
    places = [{"id": p.id, "kind": p.kind, "name": p.name, "lat": p.lat,
               "lon": p.lon} for p in db.query(m.Place).all()]
    while lat <= NER_BBOX["max_lat"]:
        lon = NER_BBOX["min_lon"]
        while lon <= NER_BBOX["max_lon"]:
            t = terrain_analyze(round(lat, 3), round(lon, 3))
            feats = LandslideFeatures(slope=t["slope_deg"],
                                      elevation=t["elevation_m"])
            pred = REGISTRY.predict(round(lat, 3), round(lon, 3), feats)
            hist_n = len(spatial.within_radius(
                [{"lat": h.lat, "lon": h.lon} for h in hist], lat, lon, 60))
            cell_id = f"cell-{lat:.2f}-{lon:.2f}"
            rows.append({
                "id": cell_id, "lat": round(lat, 3), "lon": round(lon, 3),
                "rainfall_24h": 42.0, "soil_moisture": 55.0,
                "elevation_m": t["elevation_m"], "slope_deg": t["slope_deg"],
                "aspect_deg": t["aspect_deg"], "history_count": hist_n,
                "probability": pred.landslide_probability,
                "risk_level": pred.risk_level,
                "nearby_roads": len(spatial.roads_in_zone(roads, lat, lon, 60)),
                "nearby_places": len(spatial.within_radius(places, lat, lon, 60)),
                "simulated": pred.simulated,
            })
            try:
                existing = db.get(m.RiskCell, cell_id)
                if existing:
                    existing.probability = pred.landslide_probability
                    existing.risk_level = pred.risk_level
                else:
                    db.add(m.RiskCell(id=cell_id, lat=round(lat, 3),
                                      lon=round(lon, 3),
                                      probability=pred.landslide_probability,
                                      risk_level=pred.risk_level,
                                      source="DEMO" if pred.simulated else "MODEL"))
            except Exception:
                pass
            lon += step
        lat += step
    try:
        db.commit()
    except Exception:
        pass
    lats = rows
    return {"count": len(lats), "bbox": NER_BBOX, "cells": lats,
            "data_status": "DEMO" if any(c["simulated"] for c in lats) else "MODEL"}
