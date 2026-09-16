"""Dedicated model-health endpoint (spec path /api/v1/model-health)."""
from __future__ import annotations

import sys
from pathlib import Path

from fastapi import APIRouter

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from ml.inference import REGISTRY  # noqa: E402
from ml.monitoring import health as model_health  # noqa: E402

router = APIRouter(prefix="/api/v1/model-health", tags=["model-health"])


@router.get("")
def health():
    return model_health(REGISTRY)
