"""Spatial flood-risk grid endpoint.

The legacy grid generated synthetic rainfall/soil values and a landslide model
score. Those values are removed. A spatial rainfall/ML grid will only be
returned after a verified gridded provider/model is connected.
"""
from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/grid", tags=["grid"])


@router.get("/risk-cells")
def risk_cells(step: float = 1.0):
    _ = min(max(step, 0.25), 2.0)
    return {
        "count": 0,
        "bbox": None,
        "cells": [],
        "data_status": "NOT_CONFIGURED",
        "note": "No synthetic rainfall, soil, or landslide-model cells are generated. Connect a verified spatial rainfall/model source before exposing a risk grid.",
    }
