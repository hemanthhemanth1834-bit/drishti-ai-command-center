"""Sentinel adapter (Step 3). CDSE STAC search works key-free (verified Step 2);
downloads need a free CDSE account and return UNAVAILABLE-with-reason until
Step 4 wires token auth. S1 → flood validation later; S2 → optical context.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone

import httpx

from app.core.cache import CacheExpired, FileCache
from app.core.http import ProviderHttp
from app.core.provenance import make_provenance, new_run_id
from app.core.status import DataStatus
from app.services.providers.registry import BaseProvider, Capability, ProviderSpec

STAC = "https://stac.dataspace.copernicus.eu/v1/search"
LICENSE = "Copernicus open; attribution"
COLLECTIONS = {"S1": "sentinel-1-grd", "S2": "sentinel-2-l2a"}


class SentinelProvider(BaseProvider):
    source_id = "sentinel-cdse"

    def __init__(self, token: str | None = None, cache: FileCache | None = None,
                 transport: httpx.BaseTransport | None = None):
        self.token = token or os.getenv("CDSE_TOKEN", "")
        self.http = ProviderHttp(self.source_id, timeout_s=45.0, min_interval_s=1.0, transport=transport)
        self.cache = cache

    def metadata(self) -> dict:
        return {"source_id": self.source_id, "category": "satellite",
                "collections": COLLECTIONS, "license": LICENSE,
                "authentication": "none for STAC search; free CDSE account for download"}

    def availability(self) -> dict:
        return {"source_id": self.source_id, "ready": True, "needs_auth": False,
                "capabilities": ["stac-search"],
                "download": "configured" if self.token else "AUTH REQUIRED (free CDSE account)",
                "fallback": "public flood products"}

    def fetch_latest(self, mission: str, bbox: list[float], start: str, end: str,
                     max_cloud: float = 20.0, limit: int = 10, **kwargs) -> dict:
        """STAC search → normalized item metadata (HISTORICAL catalogue state)."""
        if mission not in COLLECTIONS:
            raise ValueError(f"mission must be one of {sorted(COLLECTIONS)}")
        body = {"collections": [COLLECTIONS[mission]], "bbox": bbox,
                "datetime": f"{start}T00:00:00Z/{end}T00:00:00Z", "limit": limit}
        key = FileCache.make_key(self.source_id, mission, repr(bbox), start, end)
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
            resp = self.http.client.post(STAC, json=body)
            resp.raise_for_status()
            try:
                features = resp.json()["features"]
            except (ValueError, KeyError, TypeError) as exc:
                raise ValueError(f"malformed STAC response: {exc}") from exc
            payload = {"items": [
                {"id": f.get("id"), "datetime": f.get("properties", {}).get("datetime"),
                 "cloud_cover": (f.get("properties", {}).get("eo:cloud_cover")),
                 "assets": list((f.get("assets") or {}).keys())}
                for f in features
                if mission == "S1" or (f.get("properties", {}).get("eo:cloud_cover") or 100.0) < max_cloud
            ]}
            if self.cache is not None:
                self.cache.put(key, payload, {"status": DataStatus.HISTORICAL.value}, ttl_s=86400)
        self_log = {"mission": mission, "bbox": bbox, "items": len(payload["items"])}
        return {"source_id": self.source_id, "collection": COLLECTIONS[mission],
                "status": DataStatus.HISTORICAL.value, "items": payload["items"],
                "count": len(payload["items"]), "cache_hit": cache_hit,
                "download": "AUTH REQUIRED — free CDSE account (Step 4)" if not self.token else "token configured",
                "provenance_run_id": run_id,
                "provenance": make_provenance(run_id=run_id, request=self_log,
                                              code_ref="app/services/providers/sentinel.py",
                                              config={}).model_dump(mode="json")}

    def fetch_historical(self, **kwargs) -> dict:
        return self.fetch_latest(**kwargs)

    def download(self, item_id: str) -> dict:
        if not self.token:
            return {"source_id": self.source_id, "status": DataStatus.UNAVAILABLE.value,
                    "reason": "CDSE download needs a free account token — refusing to bypass or fake bytes",
                    "setup": ["register at dataspace.copernicus.eu (free)",
                              "export CDSE_TOKEN (env only, never git)"],
                    "item_id": item_id, "timestamp": datetime.now(timezone.utc).isoformat(),
                    "fallback": "STAC metadata only"}
        return {"source_id": self.source_id, "status": DataStatus.UNAVAILABLE.value,
                "reason": "token download executes in Step 4", "item_id": item_id}


SPEC = ProviderSpec(
    source_id="sentinel-cdse", category="satellite", license=LICENSE,
    authentication="none (search); free account (download)", adapter="sentinel:SentinelProvider",
    capabilities=Capability(variables=("backscatter", "reflectance"), kinds=("stac-search",)),
    fallback="public flood products",
)
