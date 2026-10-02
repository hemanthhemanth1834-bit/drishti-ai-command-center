"""Terrarium elevation-tile provider (Step 7). AWS Open Data terrain tiles
(Mapzen Terrarium encoding, SRTM/ETOPO-derived), no key, fair-use + caching.

Terrarium PNG decoding: elevation_m = R*256 + G + B/256 − 32768.
Tiles are Web-Mercator XYZ; georeferencing is recomputed per tile edge
(spherical-earth math, documented in processing/terrain.py).
"""

from __future__ import annotations

import hashlib
import io
import math

import httpx
import numpy as np
from PIL import Image

from app.core.cache import FileCache
from app.core.http import ProviderHttp
from app.core.provenance import make_provenance, new_run_id
from app.core.status import DataStatus
from app.services.providers.registry import BaseProvider, Capability, ProviderSpec

TILE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
LICENSE = "AWS Open Data / Mapzen Terrarium (SRTM-derived); attribution required"
TILE_PX = 256


def lonlat_to_tile(lon: float, lat: float, z: int) -> tuple[int, int]:
    n = 2 ** z
    xt = int((lon + 180.0) / 360.0 * n)
    lat_r = math.radians(max(min(lat, 85.0511), -85.0511))
    yt = int((1.0 - math.log(math.tan(lat_r) + 1.0 / math.cos(lat_r)) / math.pi) / 2.0 * n)
    return xt, yt


def tile_bounds(x: int, y: int, z: int) -> tuple[float, float, float, float]:
    """(west, south, east, north) in EPSG:4326 for an XYZ tile."""
    n = 2 ** z
    west = x / n * 360.0 - 180.0
    east = (x + 1) / n * 360.0 - 180.0
    north = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    south = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + 1) / n))))
    return west, south, east, north


def decode_terrarium(png_bytes: bytes) -> np.ndarray:
    """PNG → elevation metres. Raises ValueError on malformed input."""
    try:
        img = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    except Exception as exc:
        raise ValueError(f"malformed Terrarium PNG: {exc}") from exc
    a = np.asarray(img, dtype=np.float64)
    if a.shape[2] != 3:
        raise ValueError("malformed Terrarium PNG: expected RGB")
    return a[:, :, 0] * 256.0 + a[:, :, 1] + a[:, :, 2] / 256.0 - 32768.0


class TerrariumProvider(BaseProvider):
    source_id = "terrarium"

    def __init__(self, cache: FileCache | None = None, transport: httpx.BaseTransport | None = None):
        self.http = ProviderHttp(self.source_id, timeout_s=60.0, min_interval_s=0.2, transport=transport)
        self.cache = cache

    def metadata(self) -> dict:
        return {"source_id": self.source_id, "category": "terrain",
                "variables": ["elevation"], "encoding": "Terrarium PNG (R*256+G+B/256-32768)",
                "license": LICENSE, "authentication": "none (fair-use, cache aggressively)"}

    def availability(self) -> dict:
        return {"source_id": self.source_id, "ready": True, "needs_auth": False,
                "capabilities": ["elevation-tiles", "roi-grid"],
                "limits": "tile fair-use; tiles cached indefinitely (static terrain)"}

    def fetch_tile(self, z: int, x: int, y: int) -> np.ndarray:
        key = FileCache.make_key(self.source_id, str(z), str(x), str(y)) if self.cache else None
        if key and self.cache is not None:
            try:
                payload, _ = self.cache.get(key)
                return np.array(payload["grid"])
            except (KeyError, Exception):
                pass
        resp = self.http.get(TILE_URL.format(z=z, x=x, y=y))
        grid = decode_terrarium(resp.content)
        if key and self.cache is not None:
            self.cache.put(key, {"grid": grid.tolist()},
                           {"status": DataStatus.LIVE.value}, ttl_s=365 * 86400)
        return grid

    def fetch_latest(self, bbox: list[float], zoom: int = 12, **kwargs) -> dict:
        """Mosaic ROI grid over bbox [minlon,minlat,maxlon,maxlat]. Status LIVE
        (freshly fetched) with phenomenon: static noted — terrain does not change."""
        minlon, minlat, maxlon, maxlat = bbox
        if not (-180 <= minlon <= maxlon <= 180 and -90 <= minlat <= maxlat <= 90):
            raise ValueError(f"invalid bbox: {bbox}")
        xa, ya = lonlat_to_tile(minlon, maxlat, zoom)
        xb, yb = lonlat_to_tile(maxlon, minlat, zoom)
        x0, x1 = min(xa, xb), max(xa, xb)
        y0, y1 = min(ya, yb), max(ya, yb)  # y grows southward in XYZ
        if (x1 - x0 + 1) * (y1 - y0 + 1) > 64:
            raise ValueError("ROI spans >64 tiles — refine the region (fair-use)")
        run_id = new_run_id()
        rows = []
        for y in range(y0, y1 + 1):
            row = np.concatenate([self.fetch_tile(zoom, x, y) for x in range(x0, x1 + 1)], axis=1)
            rows.append(row)
        grid = np.concatenate(rows, axis=0)
        west, _, _, north = tile_bounds(x0, y0, zoom)  # y0 = northernmost row
        _, south, east, _ = tile_bounds(x1, y1, zoom)  # y1 = southernmost row
        sha = hashlib.sha256(grid.tobytes()).hexdigest()
        return {"source_id": self.source_id, "status": DataStatus.LIVE.value,
                "phenomenon": "static", "zoom": zoom,
                "tiles": {"x": [x0, x1], "y": [y0, y1], "count": (x1 - x0 + 1) * (y1 - y0 + 1)},
                "grid_shape": list(grid.shape), "grid": grid,
                "extent": [west, south, east, north], "crs": "EPSG:4326",
                "sha256": sha, "provenance_run_id": run_id,
                "provenance": make_provenance(
                    run_id=run_id, request={"bbox": bbox, "zoom": zoom},
                    code_ref="app/services/providers/terrain_tiles.py", config={}).model_dump(mode="json")}

    def fetch_historical(self, **kwargs) -> dict:
        return {"source_id": self.source_id, "status": DataStatus.UNAVAILABLE.value,
                "reason": "terrain tiles are a static epoch, not a time series",
                "fallback": "none needed — static terrain"}


SPEC = ProviderSpec(
    source_id="terrarium", category="terrain", license=LICENSE,
    authentication="none (fair-use)", adapter="terrain_tiles:TerrariumProvider",
    capabilities=Capability(variables=("elevation",), kinds=("elevation-tiles", "roi-grid")),
    fallback="srtm-point",
)
