"""Road connectivity intelligence: 5 statuses, blockage reports, impact."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import platform as m
from ..services import spatial
from ..services.security import require_perm

router = APIRouter(prefix="/api/v1/roads", tags=["roads"])

STATUSES = ["OPEN", "PARTIALLY_BLOCKED", "BLOCKED", "HIGH RISK", "UNKNOWN"]


class BlockageReport(BaseModel):
    road_id: str
    status: str
    cause: str = ""
    severity: str = "moderate"
    alternate_route: str = ""
    bridge_status: str = "UNKNOWN"
    eta_clearance_min: int = 0


@router.get("")
def list_roads(status: str = "", db: Session = Depends(get_db)):
    q = db.query(m.Road)
    if status:
        q = q.filter_by(status=status)
    rows = q.all()
    return {"count": len(rows), "statuses": STATUSES, "roads": [
        {"id": r.id, "name": r.name, "status": r.status, "cause": r.cause,
         "severity": r.severity, "alternate_route": r.alternate_route,
         "bridge_status": r.bridge_status,
         "eta_clearance_min": r.eta_clearance_min, "lat": r.lat, "lon": r.lon}
        for r in rows]}


@router.post("/blockage")
def report_blockage(rep: BlockageReport, db: Session = Depends(get_db),
                    ident=Depends(require_perm("roads"))):
    _ = ident
    if rep.status not in STATUSES:
        raise HTTPException(status_code=400,
                            detail=f"status must be one of {STATUSES}")
    road = db.get(m.Road, rep.road_id)
    if not road:
        road = m.Road(id=rep.road_id, name=rep.road_id)
        db.add(road)
    road.status = rep.status
    road.cause = rep.cause[:200]
    road.severity = rep.severity
    road.alternate_route = rep.alternate_route[:200]
    road.bridge_status = rep.bridge_status
    road.eta_clearance_min = rep.eta_clearance_min
    db.commit()
    return {"ok": True, "road_id": road.id, "status": road.status}


@router.get("/{road_id}/impact")
def impact(road_id: str, db: Session = Depends(get_db)):
    road = db.get(m.Road, road_id)
    if not road:
        raise HTTPException(status_code=404, detail="Unknown road")
    villages = [{"id": p.id, "name": p.name, "lat": p.lat, "lon": p.lon}
                for p in db.query(m.Place).filter_by(kind="village").all()]
    units = [{"id": u.id, "kind": u.kind, "lat": u.lat, "lon": u.lon}
             for u in db.query(m.ResponseUnit).all()]
    affected = spatial.within_radius(villages, road.lat, road.lon, 15)
    nearest_units = spatial.nearest(units, road.lat, road.lon, 2)
    return {"road_id": road.id, "status": road.status,
            "affected_villages": affected,
            "nearest_response_units": nearest_units,
            "data_status": "DEMO"}
