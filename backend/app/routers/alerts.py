"""Alert engine API: list/active/ack + multilingual rendering."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import platform as m
from ..services.security import require_perm

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])

LEVELS = ["INFO", "ADVISORY", "WATCH", "ALERT", "WARNING", "EMERGENCY", "CRITICAL"]

# Reviewed short templates (operator-facing). Life-safety wording per locale
# ships in frontend src/platform/alertTemplates.ts (9 languages).
TITLES = {
    "INFO": {"en": "Info: situation update", "hi": "जानकारी: स्थिति अद्यतन", "te": "సమాచారం: పరిస్థితి నవీకరణ"},
    "ADVISORY": {"en": "Advisory: be prepared", "hi": "परामर्श: तैयार रहें", "te": "సూచన: సిద్ధంగా ఉండండి"},
    "WATCH": {"en": "Watch: conditions being monitored", "hi": "निगरानी: स्थिति पर नज़र", "te": "నిఘా: పరిస్థితిని గమనిస్తున్నాం"},
    "ALERT": {"en": "Alert: heightened risk — stay informed", "hi": "अलर्ट: बढ़ा जोखिम — सतर्क रहें", "te": "హెచ్చరిక: ప్రమాదం పెరిగింది — అప్రమత్తంగా ఉండండి"},
    "WARNING": {"en": "Warning: dangerous conditions likely", "hi": "चेतावनी: खतरनाक स्थिति संभावित", "te": "హెచ్చరిక: ప్రమాదకర పరిస్థితులు రావచ్చు"},
    "EMERGENCY": {"en": "EMERGENCY: follow official orders now", "hi": "आपातकाल: अभी आधिकारिक आदेश मानें", "te": "అత్యవసరం: ఇప్పుడే అధికారిక ఆదేశాలు పాటించండి"},
    "CRITICAL": {"en": "CRITICAL: act now per official orders", "hi": "गंभीर: आधिकारिक आदेशों का पालन करें", "te": "తీవ్రం: అధికారిక ఆదేశాల ప్రకారం వెంటనే చర్య తీసుకోండి"},
}


class AlertIn(BaseModel):
    level: str
    title: str
    lat: float = 0.0
    lon: float = 0.0


@router.get("")
def list_alerts(level: str = "", limit: int = 50,
                db: Session = Depends(get_db)):
    q = db.query(m.Alert).order_by(m.Alert.ts.desc())
    if level:
        q = q.filter_by(level=level)
    rows = q.limit(min(limit, 200)).all()
    return {"count": len(rows), "levels": LEVELS, "alerts": [
        {"id": a.id, "level": a.level, "title": a.title, "lat": a.lat,
         "lon": a.lon, "source": a.source,
         "ts": a.ts.isoformat() if a.ts else None} for a in rows]}


@router.post("")
def create_alert(body: AlertIn, db: Session = Depends(get_db),
                 ident=Depends(require_perm("alert"))):
    if body.level not in LEVELS:
        raise HTTPException(status_code=400, detail=f"level in {LEVELS}")
    import uuid
    aid = "al-" + uuid.uuid4().hex[:8]
    db.add(m.Alert(id=aid, level=body.level, title=body.title[:200],
                   lat=body.lat, lon=body.lon, source="OPERATOR"))
    db.add(m.AuditLog(actor=ident.get("sub", "?"), action="create-alert",
                      detail=aid))
    db.commit()
    return {"ok": True, "id": aid}


@router.post("/{aid}/ack")
def ack(aid: str, db: Session = Depends(get_db),
        ident=Depends(require_perm("read"))):
    a = db.get(m.Alert, aid)
    if not a:
        raise HTTPException(status_code=404, detail="Unknown alert")
    db.add(m.AuditLog(actor=ident.get("sub", "?"), action="ack-alert",
                      detail=aid))
    db.commit()
    return {"ok": True, "id": aid, "acked_by": ident.get("sub"),
            "ts": datetime.now(timezone.utc).isoformat()}


@router.get("/render")
def render(level: str, lang: str = "en"):
    t = TITLES.get(level.upper(), TITLES["WATCH"])
    return {"level": level.upper(), "lang": lang,
            "text": t.get(lang, t["en"]),
            "langs_available": sorted({l for v in TITLES.values() for l in v})}
