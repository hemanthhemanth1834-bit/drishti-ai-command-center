"""Core API v1 health endpoint.

Legacy drone, sensor and telemetry endpoints were removed from the 26071-focused
project so no simulated operational stream is exposed.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["v1"])


@router.get("/health")
def health_v1():
    return {"ok": True, "service": "drishti-x", "api": "v1"}
