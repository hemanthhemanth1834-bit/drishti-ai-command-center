"""Field/citizen incident reporting: geo-tagged photo/video + GPS + severity.

Reports appear on the GIS risk-map and authority queue. AI image analysis
is decision-support only — reports stay UNVERIFIED until a human verifies.
Uploads validated by type/size; files stored as metadata (object storage
wiring via STORAGE_* env is the documented next step).
"""
from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import platform as m
from ..services.security import (malware_scan_hook, require_perm,
                                 validate_upload)
from .vision import demo_classify

router = APIRouter(prefix="/api/v1/incidents", tags=["incidents"])

TYPES = ["crack", "slope_movement", "landslide", "road_blockage", "flood",
         "bridge_damage", "other"]


@router.post("")
async def create(lat: float = Form(...), lon: float = Form(...),
                 incident_type: str = Form("other"),
                 severity: str = Form("moderate"),
                 description: str = Form(""),
                 reporter_type: str = Form("citizen"),
                 media: List[UploadFile] = File(default=[]),
                 db: Session = Depends(get_db),
                 ident=Depends(require_perm("report"))):
    _ = ident
    if incident_type not in TYPES:
        raise HTTPException(status_code=400,
                            detail=f"type must be one of {TYPES}")
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="Invalid GPS")
    stored = []
    ai_notes = []
    for f in (media or [])[:4]:
        content = await f.read()
        validate_upload(f.filename or "file.bin", len(content))
        scan = malware_scan_hook(f.filename or "file.bin", content)
        stored.append(f"{f.filename}:{len(content)}b:{scan['scanned']}")
        if (f.filename or "").lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            cls = demo_classify(f.filename or "photo")
            ai_notes.append(f"{cls['label']} {cls['confidence']}% "
                            f"(demo — human verification required)")
    rid = "inc-" + uuid.uuid4().hex[:8]
    db.add(m.FieldReport(
        id=rid, incident_type=incident_type, severity=severity,
        description=description[:2000], lat=lat, lon=lon,
        reporter_type=reporter_type, media=";".join(stored)[:400],
        ai_suggestion=" | ".join(ai_notes)[:400], verified=False))
    db.commit()
    return {"ok": True, "id": rid, "verified": False,
            "ai_suggestion": ai_notes,
            "note": "Decision support only — needs human verification."}


@router.get("")
def list_incidents(verified: Optional[bool] = None, limit: int = 50,
                   db: Session = Depends(get_db)):
    q = db.query(m.FieldReport).order_by(m.FieldReport.ts.desc())
    if verified is not None:
        q = q.filter_by(verified=verified)
    rows = q.limit(min(limit, 200)).all()
    return {"count": len(rows), "incidents": [
        {"id": r.id, "type": r.incident_type, "severity": r.severity,
         "description": r.description, "lat": r.lat, "lon": r.lon,
         "reporter": r.reporter_type, "media": r.media,
         "ai_suggestion": r.ai_suggestion, "verified": r.verified}
        for r in rows]}


@router.get("/{rid}")
def detail(rid: str, db: Session = Depends(get_db)):
    r = db.get(m.FieldReport, rid)
    if not r:
        raise HTTPException(status_code=404, detail="Unknown incident")
    return {"id": r.id, "type": r.incident_type, "severity": r.severity,
            "description": r.description, "lat": r.lat, "lon": r.lon,
            "reporter": r.reporter_type, "media": r.media,
            "ai_suggestion": r.ai_suggestion, "verified": r.verified}


@router.post("/{rid}/verify")
def verify(rid: str, db: Session = Depends(get_db),
           ident=Depends(require_perm("verify"))):
    r = db.get(m.FieldReport, rid)
    if not r:
        raise HTTPException(status_code=404, detail="Unknown incident")
    r.verified = True
    db.add(m.AuditLog(actor=ident.get("sub", "?"), action="verify-incident",
                      detail=rid))
    db.commit()
    return {"ok": True, "id": rid, "verified": True}
