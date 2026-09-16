"""Notification router: warning -> audience -> channel provider.

Credentials via env only. Missing provider config returns an honest
"Provider not configured" — never a fake delivery receipt.
"""
from __future__ import annotations

import os
from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import platform as m
from ..services.security import require_perm

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])

CHANNELS = ["sms", "push", "web", "email"]
AUDIENCES = ["citizen", "field_officer", "district_officer", "state_officer"]

TEMPLATES = {
    "landslide_watch": {
        "en": "DRISHTI-X WATCH: Predicted landslide risk near {place}. Probability {prob}. Requires field verification. Helpline 1078.",
        "hi": "DRISHTI-X निगरानी: {place} के पास संभावित भूस्खलन जोखिम {prob}। क्षेत्रीय सत्यापन आवश्यक। हेल्पलाइन 1078।",
    },
    "landslide_critical": {
        "en": "DRISHTI-X CRITICAL: High predicted landslide risk near {place} ({prob}). Move to safe ground. Follow official orders. Helpline 1078.",
        "hi": "DRISHTI-X गंभीर: {place} के पास उच्च संभावित भूस्खलन जोखिम ({prob})। सुरक्षित स्थान पर जाएं। आधिकारिक आदेशों का पालन करें। हेल्पलाइन 1078।",
    },
}


class SendRequest(BaseModel):
    channel: str
    audience: str = "citizen"
    template: str = "landslide_watch"
    place: str = "your area"
    prob: str = "50%"
    lang: str = "en"
    to: str = ""


def provider_status() -> List[dict]:
    return [
        {"channel": "sms",
         "status": "READY" if os.getenv("SMS_PROVIDER_KEY") else "NOT_CONFIGURED",
         "needs": "SMS_PROVIDER_KEY (+ SMS_PROVIDER_URL)"},
        {"channel": "push",
         "status": "READY" if os.getenv("PUSH_PROVIDER_KEY") else "NOT_CONFIGURED",
         "needs": "PUSH_PROVIDER_KEY"},
        {"channel": "web", "status": "READY (in-app queue)", "needs": None},
        {"channel": "email",
         "status": "READY" if os.getenv("SMTP_HOST") else "NOT_CONFIGURED",
         "needs": "SMTP_HOST (+ SMTP_USER/SMTP_PASS)"},
    ]


@router.get("/channels")
def channels():
    from ..services.providers import EmailProvider, WebPushProvider
    base = provider_status()
    return {"channels": base,
            "web_push": WebPushProvider().status(),
            "email": EmailProvider().status(),
            "note": "SMS/push/email need credentials (see .env.example). "
                    "Web + in-app queue always work."}


@router.get("/templates")
def templates():
    return {"templates": list(TEMPLATES.keys()), "langs": ["en", "hi"],
            "note": "Critical alerts use reviewed templates only. "
                    "Full 9-language packs live in the frontend "
                    "src/platform/alertTemplates.ts."}


@router.post("/send")
def send(req: SendRequest, db: Session = Depends(get_db),
         ident=Depends(require_perm("alert"))):
    _ = ident
    if req.channel not in CHANNELS:
        return {"ok": False, "error": f"Unknown channel {req.channel}"}
    tpl = TEMPLATES.get(req.template, TEMPLATES["landslide_watch"])
    text = tpl.get(req.lang, tpl["en"]).format(place=req.place, prob=req.prob)
    configured = {"web": True, "sms": bool(os.getenv("SMS_PROVIDER_KEY")),
                  "push": bool(os.getenv("PUSH_PROVIDER_KEY")),
                  "email": bool(os.getenv("SMTP_HOST"))}
    if not configured[req.channel]:
        db.add(m.Notification(channel=req.channel, audience=req.audience,
                              title=text[:200], status="provider_not_configured"))
        db.commit()
        return {"ok": False, "status": "Provider not configured",
                "channel": req.channel,
                "needs": [p["needs"] for p in provider_status()
                          if p["channel"] == req.channel][0]}
    db.add(m.Notification(channel=req.channel, audience=req.audience,
                          title=text[:200], status="queued"))
    db.commit()
    return {"ok": True, "status": "queued", "channel": req.channel,
            "audience": req.audience, "preview": text[:160]}
