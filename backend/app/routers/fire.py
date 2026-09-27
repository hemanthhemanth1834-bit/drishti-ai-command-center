"""Active-fire proxy: NASA FIRMS via a server-held MAP_KEY.

Browser code must never see the key, so the engine calls this proxy instead
of FIRMS directly:
- GET /api/v1/fire/status -> {configured: bool, ...} (public, no secrets)
- GET /api/v1/fire/active?bbox=&days=&source= -> 503 when FIRMS_MAP_KEY is
  unset; otherwise fetches the FIRMS area CSV server-side and returns
  normalized detections shaped for adaptFirmsFires. The key never appears in
  URLs returned, logs, or error details.
"""
from __future__ import annotations

import csv
import io
import os
import urllib.error
import urllib.request

from fastapi import APIRouter, Depends, HTTPException, Query

from ..services.security import rate_limit

router = APIRouter(prefix="/api/v1/fire", tags=["fire"])

FIRMS_BASE = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
SOURCES = {
    "VIIRS_SNPP_NRT", "VIIRS_SNPP_SP",
    "VIIRS_NOAA20_NRT", "VIIRS_NOAA20_SP",
    "VIIRS_NOAA21_NRT", "VIIRS_NOAA21_SP",
    "MODIS_NRT", "MODIS_SP", "LANDSAT_NRT",
}
DEFAULT_SOURCE = "VIIRS_SNPP_NRT"
DEFAULT_BBOX = "68,6,98,38"  # India focus; callers may override worldwide
MAX_ROWS = 500


def _key() -> str:
    return os.getenv("FIRMS_MAP_KEY", "")


def _parse_bbox(bbox: str) -> str:
    if bbox.strip().lower() == "world":
        return "world"
    try:
        parts = [float(x) for x in bbox.split(",")]
    except ValueError:
        raise HTTPException(status_code=400, detail="bbox must be world or w,s,e,n numbers")
    if len(parts) != 4:
        raise HTTPException(status_code=400, detail="bbox must be world or w,s,e,n numbers")
    w, s, e, n = parts
    if not (-180 <= w <= 180 and -180 <= e <= 180 and -90 <= s <= 90 and -90 <= n <= 90):
        raise HTTPException(status_code=400, detail="bbox coordinates out of range")
    if w >= e or s >= n:
        raise HTTPException(status_code=400, detail="bbox must satisfy w<e and s<n")
    return ",".join(str(x) for x in parts)


def fetch_firms_csv(url: str) -> str:
    """Separated for tests: real network lives only here."""
    req = urllib.request.Request(url, headers={"User-Agent": "drishti-x/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", "ignore")


@router.get("/status")
def status():
    return {"configured": bool(_key()), "source": "NASA FIRMS",
            "note": "Free MAP_KEY stays server-side; unset keeps fire data NOT_CONFIGURED."}


@router.get("/active")
def active(
    bbox: str = Query(DEFAULT_BBOX),
    days: int = Query(1, ge=1, le=5),
    source: str = Query(DEFAULT_SOURCE),
    _rl=Depends(rate_limit(20, 600)),
):
    key = _key()
    if not key:
        raise HTTPException(status_code=503, detail="FIRMS MAP_KEY not configured")
    if source not in SOURCES:
        raise HTTPException(status_code=400, detail="unknown FIRMS source")
    area = _parse_bbox(bbox)
    url = f"{FIRMS_BASE}/{key}/{source}/{area}/{days}"
    try:
        text = fetch_firms_csv(url)
    except urllib.error.HTTPError as e:
        if e.code in (400, 401, 403):
            raise HTTPException(status_code=502, detail="FIRMS rejected the request (check server MAP_KEY)")
        if e.code == 429:
            raise HTTPException(status_code=429, detail="FIRMS rate limit reached; retry later")
        raise HTTPException(status_code=502, detail="FIRMS upstream error")
    except Exception:
        raise HTTPException(status_code=502, detail="FIRMS unreachable")
    try:
        rows = list(csv.DictReader(io.StringIO(text)))
    except Exception:
        raise HTTPException(status_code=502, detail="FIRMS returned unparseable data")
    detections = []
    for r in rows[:MAX_ROWS]:
        try:
            lat = float(r.get("latitude", ""))
            lon = float(r.get("longitude", ""))
        except (TypeError, ValueError):
            continue
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            continue
        detections.append({
            "latitude": lat, "longitude": lon,
            "acq_date": r.get("acq_date"), "acq_time": r.get("acq_time"),
            "confidence": r.get("confidence"), "satellite": r.get("satellite"),
            "instrument": r.get("instrument"), "bright_t31": r.get("bright_t31"),
            "frp": r.get("frp"), "daynight": r.get("daynight"),
            "version": r.get("version"),
        })
    return {"provider": "NASA FIRMS", "source": source, "bbox": area,
            "day_range": days, "count": len(detections),
            "truncated": len(rows) > MAX_ROWS, "detections": detections}
