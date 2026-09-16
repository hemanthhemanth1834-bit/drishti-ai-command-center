"""Free geo providers: Nominatim geocoding (cached+throttled) + OSRM routing.

No paid map dependency. Respect public-API limits: 1 req/s Nominatim,
identifying User-Agent, short TTL cache. Fallbacks never fake precision.
"""
from __future__ import annotations

import json as jsonlib
import time
import urllib.parse
import urllib.request
from typing import Dict, List, Optional

_cache: Dict[str, tuple] = {}  # key -> (expires_at, value)
_last_call = {"nominatim": 0.0, "osrm": 0.0}
CACHE_TTL_S = 3600


def _get_json(url: str, domain: str, timeout: int = 10) -> dict:
    now = time.time()
    gap = 1.1 - (now - _last_call.get(domain, 0.0))
    if gap > 0:
        time.sleep(gap)
    hit = _cache.get(url)
    if hit and hit[0] > now:
        return {"cached": True, "data": hit[1]}
    req = urllib.request.Request(url, headers={"User-Agent": "drishti-x/1.0 (contact: admin@localhost)"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = jsonlib.loads(r.read().decode())
    _cache[url] = (now + CACHE_TTL_S, data)
    _last_call[domain] = time.time()
    return {"cached": False, "data": data}


class GeocodingProvider:
    name = "base"

    def search(self, query: str, limit: int = 5) -> Dict:
        raise NotImplementedError


class NominatimGeocoder(GeocodingProvider):
    name = "Nominatim (OSM, free, 1 req/s)"

    def search(self, query: str, limit: int = 5) -> Dict:
        url = ("https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
            {"q": query, "format": "jsonv2", "limit": max(1, min(limit, 10)),
             "countrycodes": "in"}))
        try:
            out = _get_json(url, "nominatim")
            rows = out["data"] if isinstance(out["data"], list) else []
            return {"results": [
                {"name": r.get("display_name", ""), "lat": float(r.get("lat", 0)),
                 "lon": float(r.get("lon", 0)), "type": r.get("type", ""),
                 "importance": r.get("importance", 0)} for r in rows],
                "cached": out["cached"], "source": "LIVE:Nominatim",
                "data_status": "CACHED" if out["cached"] else "LIVE"}
        except Exception as e:
            return {"results": [], "error": f"Nominatim unreachable: {type(e).__name__}",
                    "source": "Nominatim", "data_status": "UNAVAILABLE"}


class RoutingProvider:
    name = "base"

    def route(self, frm: tuple, to: tuple) -> Dict:
        raise NotImplementedError


class OSRMRouter(RoutingProvider):
    name = "OSRM demo server (free)"

    def route(self, frm: tuple, to: tuple) -> Dict:
        url = (f"https://router.project-osrm.org/route/v1/driving/"
               f"{frm[1]},{frm[0]};{to[1]},{to[0]}?overview=false")
        try:
            out = _get_json(url, "osrm")
            routes = out["data"].get("routes", [])
            if not routes:
                raise ValueError("no route")
            r0 = routes[0]
            return {"distance_km": round(r0["distance"] / 1000, 1),
                    "duration_min": round(r0["duration"] / 60),
                    "cached": out["cached"], "source": "LIVE:OSRM",
                    "data_status": "CACHED" if out["cached"] else "LIVE",
                    "note": "Demo-server route — not an officially approved evacuation route."}
        except Exception as e:
            from .spatial import haversine_km
            straight = haversine_km(frm[0], frm[1], to[0], to[1])
            return {"distance_km": round(straight * 1.35, 1),
                    "duration_min": round(straight * 1.35 / 30 * 60),
                    "source": "FALLBACK:straight-line×1.35",
                    "data_status": "DEMO",
                    "note": f"OSRM unreachable ({type(e).__name__}); rough estimate only."}
