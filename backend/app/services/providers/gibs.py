"""NASA GIBS adapter (Step 3). Imagery/context ONLY — never precipitation input.

Provides: capabilities catalogue (cached), layer search, WMTS tile-URL builder.
The type system enforces the boundary: GIBS results carry kind
SATELLITE_CONTEXT and provides_precipitation=False, so the fusion layer
cannot accidentally consume imagery as rainfall.
"""

from __future__ import annotations

import re
import xml.etree.ElementTree as ET

import httpx

from app.core.cache import FileCache
from app.core.http import ProviderHttp
from app.core.provenance import make_provenance, new_run_id
from app.core.status import DataStatus
from app.services.providers.registry import BaseProvider, Capability, ProviderSpec

CAPABILITIES_URL = "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi"
LICENSE = "NASA open imagery; attribution required"
KIND = "SATELLITE_CONTEXT"  # hard boundary — see module docstring


class GibsProvider(BaseProvider):
    source_id = "nasa-gibs"
    provides_precipitation = False

    def __init__(self, cache: FileCache | None = None, transport: httpx.BaseTransport | None = None):
        self.http = ProviderHttp(self.source_id, timeout_s=60.0, min_interval_s=1.0, transport=transport)
        self.cache = cache

    def metadata(self) -> dict:
        return {
            "source_id": self.source_id, "category": "satellite",
            "kind": KIND, "provides_precipitation": False,
            "variables": ["imagery-rgb (context only)"],
            "license": LICENSE, "authentication": "none",
        }

    def availability(self) -> dict:
        return {"source_id": self.source_id, "ready": True, "needs_auth": False,
                "capabilities": ["imagery-context", "tile-urls"],
                "warning": "context only — not a rainfall measurement"}

    def fetch_latest(self, **kwargs) -> dict:
        """Capabilities catalogue snapshot (status LIVE when freshly fetched)."""
        key = FileCache.make_key(self.source_id, "wmts-capabilities")
        run_id = new_run_id()
        cache_hit = False
        if self.cache is not None:
            try:
                payload, _ = self.cache.get(key)
                cache_hit = True
            except Exception:  # KeyError or CacheExpired → refetch, never serve stale as current
                payload = None
        else:
            payload = None
        if payload is None:
            resp = self.http.get(CAPABILITIES_URL, params={"SERVICE": "WMTS", "REQUEST": "GetCapabilities"})
            layers = self.parse_layers(resp.text)
            payload = {"layer_count": len(layers), "layers": layers[:200],
                       "truncated": len(layers) > 200}
            if self.cache is not None:
                self.cache.put(key, payload, {"status": DataStatus.LIVE.value}, ttl_s=86400)
        return {
            "source_id": self.source_id, "kind": KIND, "provides_precipitation": False,
            "status": DataStatus.LIVE.value, "cache_hit": cache_hit,
            "provenance_run_id": run_id, "capabilities": payload,
        }

    def fetch_historical(self, **kwargs) -> dict:
        return {"source_id": self.source_id, "status": DataStatus.UNAVAILABLE.value,
                "reason": "GIBS historical archiving is per-layer and rolling; use time-aware tile URLs",
                "fallback": "cdse-browser-quicklooks"}

    @staticmethod
    def parse_layers(xml_text: str) -> list[dict]:
        """Parse WMTS capabilities → [{identifier, title, formats}]. Raises on malformed XML."""
        try:
            root = ET.fromstring(xml_text)
        except ET.ParseError as exc:
            raise ValueError(f"malformed GIBS capabilities XML: {exc}") from exc
        ns = {"wmts": "http://www.opengis.net/wmts/1.0", "ows": "http://www.opengis.net/ows/1.1"}
        layers = []
        for layer in root.findall(".//wmts:Layer", ns):
            ident = layer.findtext("ows:Identifier", namespaces=ns)
            title = layer.findtext("ows:Title", namespaces=ns)
            if ident:
                layers.append({"identifier": ident, "title": title or ident})
        if not layers:
            raise ValueError("malformed GIBS capabilities XML: no layers found")
        return layers

    @staticmethod
    def tile_url(layer: str, time: str, z: int, x: int, y: int,
                 fmt: str = "png", tilematrixset: str = "GoogleMapsCompatible_Level9") -> dict:
        """Build a WMTS KVP tile URL (DEMO template — context only, not data)."""
        if not re.fullmatch(r"[A-Za-z0-9_.\-]+", layer):
            raise ValueError(f"invalid layer identifier: {layer!r}")
        url = (f"{CAPABILITIES_URL}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0"
               f"&LAYER={layer}&STYLE=default&TILEMATRIXSET={tilematrixset}"
               f"&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&TIME={time}&FORMAT=image/{fmt}")
        return {"url": url, "kind": KIND, "provides_precipitation": False,
                "status": DataStatus.DEMO.value,
                "note": "URL template for map context; fetch tiles client-side with attribution"}


SPEC = ProviderSpec(
    source_id="nasa-gibs", category="satellite", license=LICENSE,
    authentication="none", adapter="gibs:GibsProvider",
    capabilities=Capability(variables=("imagery-rgb",), kinds=("imagery-context",),
                            notes="context only; provides_precipitation=False"),
    fallback="cdse-browser-quicklooks",
)
