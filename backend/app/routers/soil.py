"""Soil intelligence: live provider-chain status.

Thin read-only surface over services.providers.soil_moisture
(ISRO/Bhuvan -> SoilGrids -> Open-Meteo -> DEMO). No secrets involved;
data_status comes straight from the winning provider — never hardcoded.
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..services.providers import soil_moisture

router = APIRouter(prefix="/api/v1/soil", tags=["soil"])


@router.get("/status")
def status(lat: float = 16.5, lon: float = 80.6,
           db: Session = Depends(get_db)):
    _ = db
    out = soil_moisture(lat, lon)
    return {
        "lat": lat,
        "lon": lon,
        "source": out.get("source", "UNKNOWN"),
        "data_status": out.get("data_status", "UNKNOWN"),
        "updated": datetime.now(timezone.utc).isoformat(),
        "detail": out.get("note") or out.get("detail") or out.get("error"),
        "moisture": out.get("soil_moisture_pct", out.get("soil_moisture_m3m3")),
        "fallback_chain": out.get("fallback_chain", []),
    }
