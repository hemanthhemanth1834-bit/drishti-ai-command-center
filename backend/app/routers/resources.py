"""Resources + shelters API: units, capacity, occupancy, nearest-safe-shelter.

Occupancy/capacity are operator-updated or DEMO — never fabricated as live.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import geo as g
from ..services import spatial
from ..services.security import require_perm

router = APIRouter(prefix="/api/v1/resources", tags=["resources"])


@router.get("")
def list_resources(kind: str = "", region: str = "",
                   db: Session = Depends(get_db)):
    q = db.query(g.Resource)
    if kind:
        q = q.filter_by(kind=kind)
    if region:
        q = q.filter(g.Resource.region_code.like(f"{region}%"))
    rows = q.all()
    return {"count": len(rows), "resources": [
        {"id": r.id, "kind": r.kind, "name": r.name, "agency": r.agency_code,
         "region": r.region_code, "lat": r.lat, "lon": r.lon,
         "status": r.status, "capacity": r.capacity, "source": r.source}
        for r in rows]}


@router.get("/shelters")
def shelters(region: str = "", db: Session = Depends(get_db)):
    q = db.query(g.Shelter)
    if region:
        q = q.filter(g.Shelter.region_code.like(f"{region}%"))
    rows = q.all()
    return {"count": len(rows), "shelters": [
        {"id": s.id, "name": s.name, "region": s.region_code,
         "lat": s.lat, "lon": s.lon, "capacity": s.capacity,
         "occupancy": s.occupancy,
         "free": max(0, s.capacity - s.occupancy),
         "facilities": s.facilities, "accessible": s.accessible,
         "contact": s.contact, "agency": s.agency_code,
         "status": s.status, "source": s.source} for s in rows]}


class OccupancyIn(BaseModel):
    occupancy: int
    status: str = ""


@router.post("/shelters/{sid}/occupancy")
def set_occupancy(sid: str, body: OccupancyIn, db: Session = Depends(get_db),
                  ident=Depends(require_perm("verify"))):
    s = db.get(g.Shelter, sid)
    if not s:
        raise HTTPException(status_code=404, detail="Unknown shelter")
    if body.occupancy < 0 or body.occupancy > s.capacity * 2:
        raise HTTPException(status_code=400, detail="Implausible occupancy")
    s.occupancy = body.occupancy
    if body.status:
        s.status = body.status
    db.commit()
    return {"ok": True, "id": sid, "occupancy": s.occupancy,
            "free": max(0, s.capacity - s.occupancy),
            "updated_by": ident.get("sub")}


@router.get("/nearest-shelter")
def nearest_shelter(lat: float, lon: float, db: Session = Depends(get_db)):
    rows = [{"id": s.id, "name": s.name, "lat": s.lat, "lon": s.lon,
             "capacity": s.capacity, "occupancy": s.occupancy,
             "free": max(0, s.capacity - s.occupancy), "status": s.status}
            for s in db.query(g.Shelter).all()]
    near = spatial.nearest([r for r in rows if r["status"] == "open"
                            and r["free"] > 0], lat, lon, 3)
    return {"count": len(near), "shelters": near,
            "note": "Nearest OPEN shelter with free beds. Verify by phone before routing."}
