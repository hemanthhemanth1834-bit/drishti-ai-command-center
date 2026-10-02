"""OSM/Overpass adapter (Step 3). Roads, buildings, waterways, rivers, bridges,
hospitals, schools, emergency infrastructure. Fair-use: caching (7 d), timeout,
retry, query logging, ODbL attribution on every result.
"""

from __future__ import annotations

import httpx

from app.core.cache import CacheExpired, FileCache
from app.core.http import ProviderHttp
from app.core.provenance import make_provenance, new_run_id
from app.core.status import DataStatus
from app.services.providers.registry import BaseProvider, Capability, ProviderSpec

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
ATTRIBUTION = "© OpenStreetMap contributors (ODbL)"
LICENSE = "Open Database License (ODbL) 1.0 — share-alike; attribution required"

CATEGORIES = {
    "roads": 'way["highway"]({bbox});',
    "buildings": 'way["building"]({bbox});',
    "waterways": 'way["waterway"]({bbox});',
    "rivers": 'way["waterway"="river"]({bbox});',
    "bridges": 'way["bridge"="yes"]({bbox});',
    "hospitals": 'node["amenity"="hospital"]({bbox});',
    "schools": 'node["amenity"="school"]({bbox});',
    "emergency": 'node["emergency"]({bbox});',
}


def build_query(category: str, bbox: list[float]) -> str:
    """Overpass QL for a category + [south,west,north,east] bbox. Logged per request."""
    if category not in CATEGORIES:
        raise ValueError(f"unknown OSM category: {category!r} (choose {sorted(CATEGORIES)})")
    if len(bbox) != 4:
        raise ValueError(f"bbox must be [minlon,minlat,maxlon,maxlat], got {bbox}")
    minlon, minlat, maxlon, maxlat = bbox
    if not (-180 <= minlon <= maxlon <= 180 and -90 <= minlat <= maxlat <= 90):
        raise ValueError(f"invalid bbox: {bbox}")
    s, w, n, e = minlat, minlon, maxlat, maxlon
    # out geom (not body): ways must carry geometry or downstream validation
    # cannot distinguish a real line from an ID-only stub.
    return f"[out:json][timeout:60];({CATEGORIES[category].format(bbox=f'{s},{w},{n},{e}')});out geom;"


class OsmProvider(BaseProvider):
    source_id = "osm"

    def __init__(self, cache: FileCache | None = None, transport: httpx.BaseTransport | None = None):
        self.http = ProviderHttp(self.source_id, timeout_s=90.0, min_interval_s=2.0, transport=transport)
        self.cache = cache
        self.query_log: list[dict] = []

    def metadata(self) -> dict:
        return {"source_id": self.source_id, "category": "gis",
                "categories": sorted(CATEGORIES), "license": LICENSE,
                "attribution": ATTRIBUTION, "authentication": "none (fair-use quotas)"}

    def availability(self) -> dict:
        return {"source_id": self.source_id, "ready": True, "needs_auth": False,
                "capabilities": ["vector-features"],
                "limits": "shared fair-use; cached 7 d; small bboxes only"}

    def fetch_latest(self, category: str, bbox: list[float], limit: int | None = 500,
                     **kwargs) -> dict:
        """Serve up to `limit` elements (default 500 for API safety). limit=None
        serves the full cached/fetched set — for batch analytics only (Step 11
        risk), never for API responses. Truncation is always reported."""
        query = build_query(category, bbox)
        key = FileCache.make_key(self.source_id, category, repr(bbox), query)
        run_id = new_run_id()
        cache_hit = False
        payload = None
        if self.cache is not None:
            try:
                payload, _ = self.cache.get(key)
                cache_hit = True
            except KeyError:
                pass
            except CacheExpired:
                payload = None
        if payload is None:
            resp = self.http.post(OVERPASS_URL, data={"data": query})
            try:
                payload = resp.json()
                elements = payload["elements"]
            except (ValueError, KeyError, TypeError) as exc:
                raise ValueError(f"malformed Overpass response: {exc}") from exc
            self.query_log.append({"category": category, "bbox": bbox, "run_id": run_id,
                                   "elements": len(elements)})
            if self.cache is not None:
                self.cache.put(key, payload, {"status": DataStatus.LIVE.value}, ttl_s=7 * 86400)
        all_elements = payload.get("elements", [])
        served = all_elements if limit is None else all_elements[:limit]
        return {
            "source_id": self.source_id, "category": category,
            "status": DataStatus.LIVE.value, "attribution": ATTRIBUTION, "license": LICENSE,
            "count": len(all_elements), "elements": served,
            "truncated": len(all_elements) > len(served),
            "cache_hit": cache_hit, "provenance_run_id": run_id,
            "provenance": make_provenance(run_id=run_id, request={"query": query},
                                          code_ref="app/services/providers/osm.py",
                                          config={"bbox": bbox, "limit": limit}).model_dump(mode="json"),
        }

    def fetch_historical(self, **kwargs) -> dict:
        return {"source_id": self.source_id, "status": DataStatus.UNAVAILABLE.value,
                "reason": "adapter serves current OSM state; full history needs planet extracts (Step 10+)",
                "fallback": "current snapshot"}


SPEC = ProviderSpec(
    source_id="osm", category="gis", license=LICENSE,
    authentication="none (fair-use)", adapter="osm:OsmProvider",
    capabilities=Capability(variables=tuple(CATEGORIES), kinds=("vector-features",),
                            notes="ODbL share-alike; attribution mandatory"),
    fallback="bhuvan-gis",
)
