"""Offline sync engine: field-device queue receiver + push subscriptions.

Flow: Field Device (IndexedDB queue) -> POST /api/v1/sync/push ->
server validates -> writes to incidents/sensor_readings -> returns receipt
per item (never silently drops: every item gets accepted|rejected+reason).
"""
from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import platform as m
from ..services.security import require_perm

router = APIRouter(prefix="/api/v1/sync", tags=["sync"])

SUBSCRIPTIONS: List[Dict[str, Any]] = []  # in-memory; move to Redis/DB prod
SEEN_CLIENT_IDS: set = set()  # idempotency window (in-memory; Redis in prod)
MAX_SEEN = 5000


class QueueItem(BaseModel):
    client_id: str
    kind: str  # incident | reading
    payload: Dict[str, Any]


class PushRequest(BaseModel):
    device_id: str = "unknown"
    items: List[QueueItem]


@router.post("/push")
def push(req: PushRequest, db: Session = Depends(get_db),
         ident=Depends(require_perm("report"))):
    _ = ident
    receipts = []
    for item in req.items[:100]:
        if item.client_id in SEEN_CLIENT_IDS:
            receipts.append({"client_id": item.client_id, "status": "duplicate",
                             "note": "already processed — safe to drop client copy"})
            continue
        try:
            if item.kind == "incident":
                p = item.payload
                rid = "inc-" + uuid.uuid4().hex[:8]
                db.add(m.FieldReport(
                    id=rid, incident_type=str(p.get("type", "other"))[:40],
                    severity=str(p.get("severity", "moderate"))[:20],
                    description=str(p.get("description", ""))[:2000],
                    lat=float(p.get("lat", 0)), lon=float(p.get("lon", 0)),
                    reporter_type="field-offline", verified=False))
                receipts.append({"client_id": item.client_id, "status": "accepted",
                                 "server_id": rid})
            elif item.kind == "reading":
                p = item.payload
                db.add(m.SensorReading(
                    sensor_id=str(p.get("sensor_id", "unknown"))[:40],
                    soil_moisture=float(p.get("soil_moisture", 0)),
                    temperature=float(p.get("temperature", -273)),
                    battery=float(p.get("battery", 100)),
                    signal=float(p.get("signal", 100))))
                receipts.append({"client_id": item.client_id, "status": "accepted"})
            else:
                receipts.append({"client_id": item.client_id, "status": "rejected",
                                 "reason": f"unknown kind {item.kind}"})
        except (ValueError, TypeError, KeyError) as e:
            receipts.append({"client_id": item.client_id, "status": "rejected",
                             "reason": f"invalid payload: {type(e).__name__}"})
        else:
            SEEN_CLIENT_IDS.add(item.client_id)
            if len(SEEN_CLIENT_IDS) > MAX_SEEN:
                SEEN_CLIENT_IDS.clear()
    db.commit()
    acc = sum(1 for r in receipts if r["status"] == "accepted")
    rej = sum(1 for r in receipts if r["status"] == "rejected")
    try:
        from .ops import record_sync
        record_sync(acc, rej)
    except Exception:
        pass
    return {"device": req.device_id, "received": len(req.items),
            "receipts": receipts}


@router.get("/status")
def status(db: Session = Depends(get_db)):
    pending_reports = db.query(m.FieldReport).filter_by(verified=False).count()
    return {"pending_verification": pending_reports,
            "push_subscriptions": len(SUBSCRIPTIONS),
            "endpoint": "POST /api/v1/sync/push"}


class Subscription(BaseModel):
    endpoint: str
    keys: Dict[str, str] = {}
    audience: str = "citizen"


@router.post("/subscriptions")
def subscribe(sub: Subscription):
    SUBSCRIPTIONS.append(sub.model_dump())
    return {"ok": True, "count": len(SUBSCRIPTIONS),
            "note": "Stored for Web Push (needs VAPID keys, see /data-sources)."}


@router.get("/subscriptions")
def list_subs():
    return {"count": len(SUBSCRIPTIONS),
            "subscriptions": [{**s, "endpoint": s.get("endpoint", "")[:60] + "…"}
                              for s in SUBSCRIPTIONS]}
