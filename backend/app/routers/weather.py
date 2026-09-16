"""Weather intelligence: provider abstraction + thresholds.

- OpenMeteoProvider: FREE, no key, real observations (EXTERNAL/LIVE).
- IMDProvider: official integration point. Without credentials it reports
  "not configured" — NO fake IMD API is invented.
- FallbackDemoProvider: clearly-labelled simulation when offline/keyless.
"""
from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Dict, List, Optional

import urllib.request
import json as jsonlib

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import platform as m

router = APIRouter(prefix="/api/v1/weather", tags=["weather"])

RAIN_WARN_24H = float(os.getenv("RAIN_WARN_24H", "120"))
RAIN_CRIT_24H = float(os.getenv("RAIN_CRIT_24H", "200"))


class WeatherProvider:
    name = "base"

    def current(self, lat: float, lon: float) -> Dict:
        raise NotImplementedError


class OpenMeteoProvider(WeatherProvider):
    name = "Open-Meteo (free, no key)"

    def current(self, lat: float, lon: float) -> Dict:
        url = ("https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s"
               "&current=temperature_2m,relative_humidity_2m,precipitation,"
               "weather_code,wind_speed_10m&hourly=precipitation"
               "&forecast_days=3&timezone=auto" % (lat, lon))
        req = urllib.request.Request(url, headers={"User-Agent": "drishti-x/1.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = jsonlib.loads(r.read().decode())
        cur = data.get("current", {})
        hourly = data.get("hourly", {}).get("precipitation", [])[:72]
        return {
            "temp_c": cur.get("temperature_2m", 0.0),
            "humidity": cur.get("relative_humidity_2m", 0.0),
            "rain_1h": cur.get("precipitation", 0.0),
            "rain_24h": round(sum(hourly[:24]), 2),
            "rain_72h": round(sum(hourly), 2),
            "wind_kmh": cur.get("wind_speed_10m", 0.0),
            "forecast_24h": round(sum(hourly[24:48]), 2) if len(hourly) >= 48 else 0.0,
            "source": "LIVE:Open-Meteo", "data_status": "LIVE",
        }


class IMDProvider(WeatherProvider):
    """Official IMD integration point — requires IMD_API_KEY (not issued here)."""
    name = "IMD (official)"

    def current(self, lat: float, lon: float) -> Dict:
        _ = (lat, lon)
        if not os.getenv("IMD_API_KEY"):
            return {"error": "Provider not configured",
                    "detail": "Set IMD_API_KEY to enable official IMD feed. "
                              "No IMD data is synthesized.",
                    "source": "IMD", "data_status": "NOT_CONFIGURED"}
        raise NotImplementedError("IMD API mapping pending credentials")


class FallbackDemoProvider(WeatherProvider):
    name = "Demo weather (simulated)"

    def current(self, lat: float, lon: float) -> Dict:
        _ = (lat, lon)
        return {"temp_c": 24.0, "humidity": 88.0, "rain_1h": 6.0,
                "rain_24h": 64.0, "rain_72h": 150.0, "wind_kmh": 14.0,
                "forecast_24h": 72.0, "source": "DEMO",
                "data_status": "DEMO"}


def get_weather(lat: float, lon: float, provider: str = "auto") -> Dict:
    if provider == "imd":
        out = IMDProvider().current(lat, lon)
        if "error" not in out:
            return out
        return out
    if provider == "demo":
        return FallbackDemoProvider().current(lat, lon)
    try:
        return OpenMeteoProvider().current(lat, lon)
    except Exception as e:
        try:
            from .ops import record_provider_failure
            record_provider_failure("Open-Meteo")
        except Exception:
            pass
        out = FallbackDemoProvider().current(lat, lon)
        out["fallback_reason"] = f"Open-Meteo unreachable: {type(e).__name__}"
        return out


def threshold_state(rain_24h: float) -> str:
    if rain_24h >= RAIN_CRIT_24H:
        return "CRITICAL"
    if rain_24h >= RAIN_WARN_24H:
        return "WARNING"
    return "NORMAL"


class Thresholds(BaseModel):
    warn_24h: float = RAIN_WARN_24H
    crit_24h: float = RAIN_CRIT_24H


@router.get("/current")
def current(lat: float, lon: float, provider: str = "auto",
            db: Session = Depends(get_db)):
    out = get_weather(lat, lon, provider)
    out.update({"lat": lat, "lon": lon,
                "updated": datetime.now(timezone.utc).isoformat()})
    if "error" not in out:
        out["threshold"] = threshold_state(float(out.get("rain_24h", 0)))
        try:
            db.add(m.WeatherObs(lat=lat, lon=lon, rain_1h=out.get("rain_1h", 0),
                                rain_24h=out.get("rain_24h", 0),
                                temp_c=out.get("temp_c", 0),
                                source=out.get("source", "DEMO")))
            db.commit()
        except Exception:
            pass
    return out


@router.get("/thresholds")
def thresholds():
    return {"warn_24h_mm": RAIN_WARN_24H, "crit_24h_mm": RAIN_CRIT_24H,
            "source": "env: RAIN_WARN_24H / RAIN_CRIT_24H"}


@router.get("/providers")
def providers():
    imd = IMDProvider().current(0, 0)
    return {"providers": [
        {"name": OpenMeteoProvider.name, "status": "FREE/LIVE",
         "key_required": False},
        {"name": IMDProvider.name,
         "status": "NOT_CONFIGURED" if "error" in imd else "READY",
         "key_required": True, "detail": imd.get("detail", "")},
        {"name": FallbackDemoProvider.name, "status": "ALWAYS_AVAILABLE",
         "key_required": False}]}
