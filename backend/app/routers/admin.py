"""Admin: audit log viewer, roles, thresholds, model versions.

All responses carry Cache-Control: no-store — role-gated data must never
sit in edge caches where a later anonymous request could receive it.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import platform as m
from ..services.security import ROLE_PERMS, require_perm

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/audit")
def audit(response: Response, limit: int = 50, db: Session = Depends(get_db),
          ident=Depends(require_perm("admin"))):
    _ = ident
    response.headers["Cache-Control"] = "no-store"
    rows = db.query(m.AuditLog).order_by(m.AuditLog.id.desc()).limit(min(limit, 200)).all()
    return {"count": len(rows), "logs": [
        {"id": r.id, "actor": r.actor, "action": r.action, "detail": r.detail,
         "ts": r.ts.isoformat() if r.ts else None} for r in rows]}


@router.get("/roles")
def roles(response: Response, ident=Depends(require_perm("admin"))):
    _ = ident
    response.headers["Cache-Control"] = "no-store"
    return {"roles": [{"role": k, "permissions": v} for k, v in ROLE_PERMS.items()],
            "note": "JWT {sub, role} trusted only when JWT_SECRET is set; "
                    "otherwise gateway key maps to district_admin."}


@router.get("/models")
def models(response: Response, db: Session = Depends(get_db), ident=Depends(require_perm("admin"))):
    _ = ident
    response.headers["Cache-Control"] = "no-store"
    rows = db.query(m.ModelVersion).all()
    return {"count": len(rows), "versions": [
        {"version": r.version, "trained_at": r.trained_at,
         "data_kind": r.data_kind, "f1": r.f1, "roc_auc": r.roc_auc,
         "active": r.active} for r in rows]}
