"""Admin: audit log viewer, roles, thresholds, model versions."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import platform as m
from ..services.security import ROLE_PERMS, require_perm

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/audit")
def audit(limit: int = 50, db: Session = Depends(get_db),
          ident=Depends(require_perm("admin"))):
    _ = ident
    rows = db.query(m.AuditLog).order_by(m.AuditLog.id.desc()).limit(min(limit, 200)).all()
    return {"count": len(rows), "logs": [
        {"id": r.id, "actor": r.actor, "action": r.action, "detail": r.detail,
         "ts": r.ts.isoformat() if r.ts else None} for r in rows]}


@router.get("/roles")
def roles():
    return {"roles": [{"role": k, "permissions": v} for k, v in ROLE_PERMS.items()],
            "note": "JWT {sub, role} trusted only when JWT_SECRET is set; "
                    "otherwise gateway key maps to district_admin."}


@router.get("/models")
def models(db: Session = Depends(get_db), ident=Depends(require_perm("admin"))):
    _ = ident
    rows = db.query(m.ModelVersion).all()
    return {"count": len(rows), "versions": [
        {"version": r.version, "trained_at": r.trained_at,
         "data_kind": r.data_kind, "f1": r.f1, "roc_auc": r.roc_auc,
         "active": r.active} for r in rows]}
