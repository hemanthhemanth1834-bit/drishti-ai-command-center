"""Spatial services — haversine math locally, PostGIS SQL when available.

Every function documents its PostGIS equivalent so the upgrade path is a
query swap, not a redesign. All demo coordinates are synthetic.
"""
from __future__ import annotations

import math
from typing import Dict, List

EARTH_KM = 6371.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_KM * math.asin(math.sqrt(a))


# POSTGIS: ST_DWithin(geog, ST_MakePoint(lon,lat)::geography, radius_m)
def within_radius(items: List[Dict], lat: float, lon: float,
                  radius_km: float) -> List[Dict]:
    out = []
    for it in items:
        d = haversine_km(lat, lon, float(it.get("lat", 0)), float(it.get("lon", 0)))
        if d <= radius_km:
            out.append({**it, "dist_km": round(d, 2)})
    return sorted(out, key=lambda x: x["dist_km"])


# POSTGIS: ORDER BY geog <-> point LIMIT n
def nearest(items: List[Dict], lat: float, lon: float, n: int = 3) -> List[Dict]:
    ranked = sorted(items, key=lambda it: haversine_km(
        lat, lon, float(it.get("lat", 0)), float(it.get("lon", 0))))
    out = []
    for it in ranked[:n]:
        d = haversine_km(lat, lon, float(it.get("lat", 0)), float(it.get("lon", 0)))
        out.append({**it, "dist_km": round(d, 2)})
    return out


# POSTGIS: ST_Intersects(road_geom, ST_Buffer(zone, r))
def roads_in_zone(roads: List[Dict], lat: float, lon: float,
                  radius_km: float) -> List[Dict]:
    return within_radius(roads, lat, lon, radius_km)
