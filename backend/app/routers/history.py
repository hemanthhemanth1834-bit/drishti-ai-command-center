"""Historical landslide database: schema + CSV ingest + labeled demo records.

No verified disaster statistics are fabricated: seeded rows are synthetic
(source=DEMO, verification=demo). Import real records via CSV upload —
required columns are documented and validated.
"""
from __future__ import annotations

import csv
import io
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import platform as m

router = APIRouter(prefix="/api/v1/history", tags=["history"])

CSV_COLUMNS = ["date", "lat", "lon", "rainfall_mm", "slope_deg", "severity",
               "casualties", "damage", "road_status", "source"]


@router.get("/schema")
def schema():
    return {"columns": CSV_COLUMNS,
            "notes": "casualties: use official figures only, else 'unknown'. "
                     "severity: low|moderate|high|critical."}


@router.post("/import")
async def import_csv(file: UploadFile = File(...),
                     db: Session = Depends(get_db)):
    name = file.filename or "upload.csv"
    if not name.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv accepted")
    raw = (await file.read())[:2_000_000]
    try:
        rows = list(csv.DictReader(io.StringIO(raw.decode("utf-8"))))
    except Exception:
        raise HTTPException(status_code=400, detail="Unparseable CSV")
    missing = [c for c in CSV_COLUMNS if c not in (rows[0].keys() if rows else [])]
    if missing:
        raise HTTPException(status_code=400,
                            detail=f"Missing columns: {missing}")
    n = 0
    for r in rows[:2000]:
        try:
            db.add(m.HistoricalIncident(
                id=f"IMP-{uuid.uuid4().hex[:8]}", date=r.get("date", ""),
                lat=float(r.get("lat", 0)), lon=float(r.get("lon", 0)),
                rainfall_mm=float(r.get("rainfall_mm", 0)),
                slope_deg=float(r.get("slope_deg", 0)),
                severity=r.get("severity", "moderate"),
                casualties=r.get("casualties", "unknown"),
                damage=r.get("damage", "")[:200],
                road_status=r.get("road_status", "UNKNOWN"),
                source=r.get("source", "csv-import"),
                verification="unverified"))
            n += 1
        except (ValueError, TypeError):
            continue
    db.commit()
    return {"ok": True, "imported": n, "verification": "unverified"}


@router.get("/incidents")
def incidents(severity: str = "", limit: int = 100,
              db: Session = Depends(get_db)):
    q = db.query(m.HistoricalIncident)
    if severity:
        q = q.filter_by(severity=severity)
    rows = q.limit(min(limit, 500)).all()
    return {"count": len(rows), "incidents": [
        {"id": r.id, "date": r.date, "lat": r.lat, "lon": r.lon,
         "rainfall_mm": r.rainfall_mm, "slope_deg": r.slope_deg,
         "severity": r.severity, "casualties": r.casualties,
         "damage": r.damage, "road_status": r.road_status,
         "source": r.source, "verification": r.verification} for r in rows]}


@router.get("/trends")
def trends(db: Session = Depends(get_db)):
    rows = db.query(m.HistoricalIncident).all()
    by_year: dict = {}
    by_sev: dict = {}
    rain_by_sev: dict = {}
    for r in rows:
        y = (r.date or "")[:4] or "unknown"
        by_year[y] = by_year.get(y, 0) + 1
        by_sev[r.severity] = by_sev.get(r.severity, 0) + 1
        rain_by_sev.setdefault(r.severity, []).append(r.rainfall_mm)
    avg_rain = {k: round(sum(v) / len(v), 1) for k, v in rain_by_sev.items()}
    hotspots = sorted(
        ({"lat": r.lat, "lon": r.lon, "severity": r.severity, "id": r.id}
         for r in rows if r.severity in ("high", "critical")),
        key=lambda x: 0)
    demo_only = all(r.verification == "demo" for r in rows) if rows else True
    return {"yearly": by_year, "by_severity": by_sev,
            "avg_rainfall_by_severity_mm": avg_rain,
            "hotspots": hotspots[:50],
            "data_status": "DEMO" if demo_only else "MIXED",
            "note": "Demo records only — import verified CSV for real trends."}
