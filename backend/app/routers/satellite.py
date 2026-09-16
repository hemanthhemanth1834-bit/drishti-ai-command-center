"""Satellite intelligence: provider abstraction + honest provenance.

Every observation carries SOURCE / TIMESTAMP / DATA TYPE / RESOLUTION /
LIVE-DEMO-EXTERNAL. Gallery/placeholder imagery is never presented as a
live observation.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import platform as m

router = APIRouter(prefix="/api/v1/satellite", tags=["satellite"])


class SatelliteProvider:
    name = "base"

    def latest(self, lat: float, lon: float) -> dict:
        raise NotImplementedError


class DemoSatelliteProvider(SatelliteProvider):
    name = "Simulated observation (demo)"

    def latest(self, lat: float, lon: float) -> dict:
        seed = abs(hash((round(lat, 2), round(lon, 2)))) % 1000
        return {
            "lat": lat, "lon": lon,
            "change_pct": round(2 + (seed % 140) / 10, 2),
            "vegetation_delta": round(-((seed % 60) / 10), 2),
            "resolution_m": "30m", "data_type": "optical-demo",
            "source": "SIMULATED", "data_status": "DEMO",
            "captured_at": datetime.now(timezone.utc).isoformat(),
        }


class OpenTileProvider(SatelliteProvider):
    """EXTERNAL open tiles (Esri/OSM) for context — not tasking, not analysis."""
    name = "Open tile context (external)"

    def latest(self, lat: float, lon: float) -> dict:
        return {"lat": lat, "lon": lon, "source": "EXTERNAL:Esri-World-Imagery",
                "data_status": "EXTERNAL", "resolution_m": "varies",
                "data_type": "basemap-context",
                "note": "Context imagery only — not a tasked observation."}


class ObsIn(BaseModel):
    lat: float
    lon: float
    change_pct: float = 0.0
    vegetation_delta: float = 0.0
    resolution_m: str = "30m"
    data_type: str = "optical-demo"
    source: str = "SIMULATED"


@router.get("/latest")
def latest(lat: float, lon: float, provider: str = "demo"):
    if provider == "external":
        return OpenTileProvider().latest(lat, lon)
    return DemoSatelliteProvider().latest(lat, lon)


@router.post("/observations")
def add_obs(obs: ObsIn, db: Session = Depends(get_db)):
    row = m.SatelliteObs(lat=obs.lat, lon=obs.lon, change_pct=obs.change_pct,
                         vegetation_delta=obs.vegetation_delta,
                         resolution_m=obs.resolution_m,
                         data_type=obs.data_type, source=obs.source)
    db.add(row)
    db.commit()
    return {"ok": True, "id": row.id}


@router.get("/observations")
def list_obs(limit: int = 20, db: Session = Depends(get_db)):
    rows = (db.query(m.SatelliteObs).order_by(m.SatelliteObs.id.desc())
            .limit(min(limit, 100)).all())
    return {"count": len(rows), "observations": [
        {"id": r.id, "lat": r.lat, "lon": r.lon, "change_pct": r.change_pct,
         "vegetation_delta": r.vegetation_delta, "resolution_m": r.resolution_m,
         "data_type": r.data_type, "source": r.source,
         "captured_at": r.captured_at.isoformat() if r.captured_at else None}
        for r in rows]}


@router.get("/change")
def change(lat: float, lon: float, db: Session = Depends(get_db)):
    """Change detection between the two newest stored obs near a point."""
    rows = db.query(m.SatelliteObs).all()
    near = sorted(rows, key=lambda r: abs(r.lat - lat) + abs(r.lon - lon))[:2]
    if len(near) < 2:
        return {"status": "INSUFFICIENT_DATA",
                "note": "Need >=2 observations near this point.",
                "data_status": "DEMO"}
    a, b = near[0], near[1]
    return {"status": "OK", "delta_change_pct": round(a.change_pct - b.change_pct, 2),
            "delta_vegetation": round(a.vegetation_delta - b.vegetation_delta, 2),
            "from": b.captured_at.isoformat() if b.captured_at else None,
            "to": a.captured_at.isoformat() if a.captured_at else None,
            "data_status": "DEMO" if a.source == "SIMULATED" else a.source}
