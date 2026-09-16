"""Terrain intelligence: elevation/slope/aspect/curvature/drainage/roughness.

Procedural DEM (demo) with honest provenance. Swap `elevation_at` for a
real DEM source (SRTM/Copernicus) without changing the API or UI.
Feeds the ML pipeline (slope/elevation/roughness) and the 3D twin params.
"""
from __future__ import annotations

import math

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import platform as m

router = APIRouter(prefix="/api/v1/terrain", tags=["terrain"])


def elevation_at(lat: float, lon: float) -> float:
    """Himalayan-scale procedural DEM — DEMO, not survey data.

    Wavelengths ~4-15 km with 250-500 m relief give 5-40° slopes.
    Replace with SRTM/Copernicus reader for production.
    """
    return (900 + 500 * math.sin(lat * 150.0) * math.cos(lon * 170.0)
            + 250 * math.sin(lat * 47.0 + 1.0) * math.cos(lon * 53.0))


def analyze(lat: float, lon: float) -> dict:
    e = 0.005  # degrees (~550 m) — resolves the ~4 km relief wavelength
    m_per_deg = 111000.0
    z = elevation_at(lat, lon)
    zx1, zx2 = elevation_at(lat, lon - e), elevation_at(lat, lon + e)
    zy1, zy2 = elevation_at(lat - e, lon), elevation_at(lat + e, lon)
    dx = 2 * e * m_per_deg * math.cos(math.radians(lat))
    dy = 2 * e * m_per_deg
    # dimensionless gradients (metres per metre)
    dzdx = (zx2 - zx1) / dx
    dzdy = (zy2 - zy1) / dy
    grad = math.hypot(dzdx, dzdy)
    slope = round(math.degrees(math.atan(grad)), 2)
    aspect = round((math.degrees(math.atan2(dzdx, -dzdy)) + 360) % 360, 1)
    d2x = (zx2 - 2 * z + zx1) / (dx / 2) ** 2
    d2y = (zy2 - 2 * z + zy1) / (dy / 2) ** 2
    curvature = round(d2x + d2y, 6)
    roughness = round(min(2.5, abs(curvature) * 40000 + grad * 0.5), 3)
    drainage = round(max(0.0, min(1.0, 0.55 - grad * 0.4)), 3)
    hill_cut = 1.0 if (slope > 32 and drainage < 0.3) else 0.0
    risk = "high" if slope >= 35 else "moderate" if slope >= 25 else "low"
    return {"lat": lat, "lon": lon, "elevation_m": round(z, 1),
            "slope_deg": slope, "aspect_deg": aspect, "curvature": curvature,
            "roughness": roughness, "drainage": drainage,
            "hill_cutting": hill_cut, "terrain_risk": risk,
            "source": "Procedural DEM (demo)", "data_status": "DEMO"}


@router.get("/analyze")
def analyze_point(lat: float, lon: float, db: Session = Depends(get_db)):
    out = analyze(lat, lon)
    try:
        db.add(m.TerrainFeature(lat=lat, lon=lon, elevation_m=out["elevation_m"],
                                slope_deg=out["slope_deg"],
                                aspect_deg=out["aspect_deg"],
                                curvature=out["curvature"],
                                roughness=out["roughness"],
                                drainage=out["drainage"],
                                hill_cutting=out["hill_cutting"]))
        db.commit()
    except Exception:
        pass
    return out


@router.get("/twin-params")
def twin_params(lat: float, lon: float):
    """Parameters consumed by the Three.js Digital Twin scenario simulator."""
    t = analyze(lat, lon)
    return {"elevation_m": t["elevation_m"], "slope_deg": t["slope_deg"],
            "roughness": t["roughness"], "drainage": t["drainage"],
            "data_status": "DEMO",
            "note": "Procedural twin params — replace elevation_at() with SRTM."}
