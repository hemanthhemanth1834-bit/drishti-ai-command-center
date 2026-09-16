"""Universal geography API: countries/states/districts/cities + geocode + route."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import geo as g
from ..services.geo_providers import NominatimGeocoder, OSRMRouter

router = APIRouter(prefix="/api/regions", tags=["regions"])


def _row(o, *fields):
    return {f: getattr(o, f) for f in fields}


@router.get("/countries")
def countries(db: Session = Depends(get_db)):
    rows = db.query(g.Country).all()
    return {"count": len(rows),
            "countries": [_row(c, "code", "name", "bbox", "source") for c in rows]}


@router.get("/states")
def states(country: str = "IN", db: Session = Depends(get_db)):
    rows = db.query(g.State).filter_by(country_code=country).all()
    return {"country": country, "count": len(rows),
            "states": [_row(s, "code", "name", "kind", "source") for s in rows]}


@router.get("/districts")
def districts(state: str, db: Session = Depends(get_db)):
    rows = db.query(g.District).filter_by(state_code=state).all()
    if not rows:
        raise HTTPException(status_code=404, detail=f"Unknown state {state}")
    return {"state": state, "count": len(rows),
            "districts": [_row(d, "code", "name", "source") for d in rows]}


@router.get("/cities")
def cities(district: str = "", state: str = "", db: Session = Depends(get_db)):
    q = db.query(g.City)
    if district:
        q = q.filter_by(district_code=district)
    elif state:
        codes = [d.code for d in db.query(g.District).filter_by(state_code=state).all()]
        q = q.filter(g.City.district_code.in_(codes)) if codes else q.filter(False)
    rows = q.all()
    return {"count": len(rows), "cities": [
        {"code": c.code, "name": c.name, "kind": c.kind, "district": c.district_code,
         "lat": c.lat if c.has_coords else None,
         "lon": c.lon if c.has_coords else None,
         "coastal": c.coastal, "source": c.source} for c in rows]}


@router.get("/localities")
def localities(city: str, db: Session = Depends(get_db)):
    rows = db.query(g.Locality).filter_by(city_code=city).all()
    return {"city": city, "count": len(rows),
            "localities": [_row(l, "code", "name", "kind") for l in rows],
            "note": "Seed with verified mandal/ward lists to extend."}


@router.get("/disasters")
def disasters(sector: str = "", db: Session = Depends(get_db)):
    q = db.query(g.DisasterType)
    if sector:
        q = q.filter_by(sector=sector)
    return {"count": q.count(),
            "disasters": [{"code": d.code, "sector": d.sector,
                           "name_en": d.name_en, "name_te": d.name_te}
                          for d in q.all()]}


@router.get("/sectors")
def sectors(db: Session = Depends(get_db)):
    return {"sectors": [{"code": s.code, "name_en": s.name_en, "name_te": s.name_te}
                        for s in db.query(g.Sector).all()]}


@router.get("/agencies")
def agencies(scope: str = "", db: Session = Depends(get_db)):
    q = db.query(g.Agency)
    if scope:
        q = q.filter_by(scope=scope)
    return {"count": q.count(), "agencies": [
        {"code": a.code, "name": a.name, "kind": a.kind,
         "scope": a.scope, "contact": a.contact} for a in q.all()]}


@router.get("/geocode")
def geocode(q: str):
    if len(q.strip()) < 3:
        raise HTTPException(status_code=400, detail="Query too short")
    return NominatimGeocoder().search(q)


@router.get("/route")
def route(from_lat: float, from_lon: float, to_lat: float, to_lon: float):
    for v, n in ((from_lat, "from_lat"), (from_lon, "from_lon"),
                 (to_lat, "to_lat"), (to_lon, "to_lon")):
        if not isinstance(v, (int, float)):
            raise HTTPException(status_code=400, detail=f"Bad {n}")
    return OSRMRouter().route((from_lat, from_lon), (to_lat, to_lon))
