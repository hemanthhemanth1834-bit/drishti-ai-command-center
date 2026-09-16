"""Security: JWT-ready auth, roles, rate limiting, audit, upload guards.

- REST mutations accept either the legacy GATEWAY_KEY Bearer (backward
  compatible) or a JWT signed with JWT_SECRET when configured.
- No real user store is required: JWT payload {sub, role} is trusted only
  when JWT_SECRET is set; otherwise the gateway key maps to role "operator".
- Rate limiting is an in-memory token bucket (use Redis in production).
- Uploads: extension + size validation; malware-scan hook point.
"""
from __future__ import annotations

import os
import time
from typing import Dict, List, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..config import DEV_GATEWAY_KEY

security = HTTPBearer(auto_error=False)
JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALG = "HS256"

ROLE_PERMS: Dict[str, List[str]] = {
    "citizen": ["report", "read"],
    "public_user": ["report", "read"],
    "volunteer": ["report", "read"],
    "field_officer": ["report", "read", "verify"],
    "field_responder": ["report", "read", "verify"],
    "emergency_responder": ["report", "read", "verify", "alert"],
    "police": ["report", "read", "verify", "alert"],
    "fire_service": ["report", "read", "verify", "alert"],
    "healthcare": ["report", "read", "verify"],
    "municipal_operator": ["report", "read", "verify", "alert", "roads"],
    "district_operator": ["report", "read", "verify", "alert", "roads"],
    "district_admin": ["report", "read", "verify", "alert", "roads"],
    "state_operator": ["report", "read", "verify", "alert", "roads", "admin"],
    "state_admin": ["report", "read", "verify", "alert", "roads", "admin"],
    "admin": ["*"],
    "sys_admin": ["*"],
}

ALLOWED_MEDIA_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".webm"}
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "15"))

_rate: Dict[str, List[float]] = {}


def decode_token(token: str) -> Optional[Dict]:
    """Maintained-library JWT verification (PyJWT). HS256 only."""
    if not JWT_SECRET:
        return None
    try:
        import jwt
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG],
                             options={"require": ["exp"]})
        if not isinstance(payload, dict) or "sub" not in payload:
            return None
        return {"sub": str(payload["sub"]),
                "role": str(payload.get("role", "citizen"))}
    except Exception:
        return None


def mint_token(sub: str, role: str = "citizen", ttl_min: int = 720) -> Optional[str]:
    """Issue operator tokens (requires JWT_SECRET). No user store needed."""
    if not JWT_SECRET:
        return None
    import time as _time
    import jwt
    now = int(_time.time())
    return jwt.encode({"sub": sub, "role": role, "iat": now,
                       "exp": now + ttl_min * 60}, JWT_SECRET, algorithm=JWT_ALG)


def current_identity(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> Dict[str, str]:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Missing Bearer credentials")
    if JWT_SECRET:
        payload = decode_token(credentials.credentials)
        if payload and "sub" in payload:
            return {"sub": str(payload["sub"]),
                    "role": str(payload.get("role", "citizen"))}
    if credentials.credentials == DEV_GATEWAY_KEY:
        return {"sub": "gateway-operator", "role": "district_admin"}
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid credentials")


def require_perm(perm: str):
    def checker(ident: Dict[str, str] = Depends(current_identity)) -> Dict[str, str]:
        perms = ROLE_PERMS.get(ident.get("role", "citizen"), [])
        if "*" not in perms and perm not in perms:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail=f"Role '{ident.get('role')}' lacks '{perm}'")
        return ident
    return checker


def rate_limit(max_calls: int = 60, window_s: int = 60):
    """Auth-optional rate limit keyed by identity or client IP (open demo)."""
    def checker(request: Request,
                credentials: HTTPAuthorizationCredentials | None = Depends(security)):
        sub = "anon"
        if credentials:
            sub = credentials.credentials[:16]
        elif request and request.client:
            sub = request.client.host
        now = time.time()
        calls = [t for t in _rate.get(sub, []) if now - t < window_s]
        if len(calls) >= max_calls:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        calls.append(now)
        _rate[sub] = calls
    return checker


def validate_upload(filename: str, size_bytes: int) -> None:
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_MEDIA_EXTS:
        raise HTTPException(status_code=400,
                            detail=f"File type '{ext}' not allowed")
    if size_bytes > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=400,
                            detail=f"File exceeds {MAX_UPLOAD_MB} MB limit")


def malware_scan_hook(filename: str, content: bytes) -> Dict[str, str]:
    """Integration point: plug ClamAV / cloud scanner here. Default: pass."""
    _ = content[:0]
    return {"scanned": "deferred", "file": filename,
            "note": "Connect MALWARE_SCANNER_URL to enforce."}
