"""Lightweight observability: errors, provider failures, latency, inference time,
queue/sync status, notification failures, DB health. In-memory (open/self-hostable);
promote to Prometheus/Valkey in production. No commercial monitoring.
"""
from __future__ import annotations

import time
from collections import Counter
from typing import Dict, List

from fastapi import APIRouter
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

router = APIRouter(prefix="/api/v1/ops", tags=["ops"])

_stats: Dict = {
    "started_at": time.time(),
    "requests": 0,
    "errors_5xx": 0,
    "errors_4xx": 0,
    "provider_failures": Counter(),
    "latency_ms": [],
    "inference_ms": [],
    "notify_failures": Counter(),
    "sync_accepted": 0,
    "sync_rejected": 0,
}


def record_provider_failure(provider: str) -> None:
    _stats["provider_failures"][provider] += 1


def record_inference_ms(ms: float) -> None:
    _stats["inference_ms"].append(ms)
    if len(_stats["inference_ms"]) > 200:
        _stats["inference_ms"] = _stats["inference_ms"][-200:]


def record_notify_failure(channel: str) -> None:
    _stats["notify_failures"][channel] += 1


def record_sync(accepted: int, rejected: int) -> None:
    _stats["sync_accepted"] += accepted
    _stats["sync_rejected"] += rejected


class OpsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        t0 = time.perf_counter()
        try:
            resp = await call_next(request)
        except Exception:
            _stats["errors_5xx"] += 1
            raise
        ms = (time.perf_counter() - t0) * 1000
        _stats["requests"] += 1
        if resp.status_code >= 500:
            _stats["errors_5xx"] += 1
        elif resp.status_code >= 400:
            _stats["errors_4xx"] += 1
        _stats["latency_ms"].append(ms)
        if len(_stats["latency_ms"]) > 200:
            _stats["latency_ms"] = _stats["latency_ms"][-200:]
        return resp


def _pct(vals: List[float], p: float):
    if not vals:
        return None
    s = sorted(vals)
    return round(s[min(len(s) - 1, int(len(s) * p / 100))], 2)


@router.get("/health")
def health():
    lat = _stats["latency_ms"]
    inf = _stats["inference_ms"]
    db_status = "UNKNOWN"
    try:
        from ..db import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            db_status = "OK"
        finally:
            db.close()
    except Exception as e:
        db_status = f"DOWN: {type(e).__name__}"
    return {
        "uptime_s": round(time.time() - _stats["started_at"], 1),
        "requests": _stats["requests"],
        "errors": {"4xx": _stats["errors_4xx"], "5xx": _stats["errors_5xx"]},
        "latency_ms": {"p50": _pct(lat, 50), "p95": _pct(lat, 95), "n": len(lat)},
        "inference_ms": {"p50": _pct(inf, 50), "p95": _pct(inf, 95), "n": len(inf)},
        "provider_failures": dict(_stats["provider_failures"]),
        "notify_failures": dict(_stats["notify_failures"]),
        "sync": {"accepted": _stats["sync_accepted"],
                 "rejected": _stats["sync_rejected"]},
        "database": db_status,
        "data_status": "LIVE",
    }
