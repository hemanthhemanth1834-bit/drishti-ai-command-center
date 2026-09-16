"""Operator authentication: bootstrap-token exchange, no fake credentials.

Real flows only:
- Present a valid gateway Bearer key -> short-lived JWT (bootstrap).
- OR present username + operator secret matching server-side OPERATOR_KEYS.
- Without JWT_SECRET configured -> 503 NOT_CONFIGURED (never fake success).
- No user store, no password DB, no recovery flow (documented, not faked).
"""
from __future__ import annotations

import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config import DEV_GATEWAY_KEY
from ..db import get_db
from ..models import platform as m
from ..services import security as sec
from ..services.security import rate_limit

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
bearer = HTTPBearer(auto_error=False)


def _operator_map() -> dict:
    """OPERATOR_KEYS='alice:district_admin:s3cret,bob:field_officer:s3cret2'."""
    out = {}
    for entry in os.getenv("OPERATOR_KEYS", "").split(","):
        parts = entry.strip().split(":")
        if len(parts) == 3 and all(parts):
            out[parts[0]] = {"role": parts[1], "secret": parts[2]}
    return out


class TokenRequest(BaseModel):
    username: str = ""
    secret: str = ""


@router.post("/token")
def token(body: TokenRequest,
          credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
          db: Session = Depends(get_db),
          _rl=Depends(rate_limit(10, 60))):
    if not sec.JWT_SECRET:
        raise HTTPException(status_code=503,
                            detail="Authentication not configured (JWT_SECRET missing)")
    identity = None
    method = ""
    if credentials and credentials.credentials == DEV_GATEWAY_KEY:
        identity = {"sub": "gateway-operator", "role": "district_admin"}
        method = "gateway-bootstrap"
    elif body.username and body.secret:
        rec = _operator_map().get(body.username)
        if rec and rec["secret"] == body.secret and rec["role"] in sec.ROLE_PERMS:
            identity = {"sub": body.username, "role": rec["role"]}
            method = "operator-key"
    if not identity:
        try:
            db.add(m.AuditLog(actor=body.username or "anonymous",
                              action="auth-failed", detail="token denied"))
            db.commit()
        except Exception:
            pass
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid email or password.")
    tok = sec.mint_token(identity["sub"], identity["role"])
    try:
        db.add(m.AuditLog(actor=identity["sub"], action="auth-token",
                          detail=method))
        db.commit()
    except Exception:
        pass
    return {"access_token": tok, "token_type": "Bearer",
            "role": identity["role"], "sub": identity["sub"],
            "expires_min": 720, "method": method}


@router.get("/me")
def me(ident=Depends(sec.current_identity)):
    return {"sub": ident.get("sub"), "role": ident.get("role"),
            "permissions": sec.ROLE_PERMS.get(ident.get("role", ""), []),
            "ts": datetime.now(timezone.utc).isoformat()}


@router.post("/logout")
def logout(ident=Depends(sec.current_identity),
           db: Session = Depends(get_db)):
    try:
        db.add(m.AuditLog(actor=ident.get("sub", "?"), action="auth-logout",
                          detail="client cleared token"))
        db.commit()
    except Exception:
        pass
    return {"ok": True,
            "note": "Token is stateless JWT — client must discard it. "
                    "Short expiry (12h) bounds misuse."}
