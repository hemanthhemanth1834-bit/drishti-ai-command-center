"""Terrain adapter (Step 3). Primary: SRTM via OpenTopoData point queries (verified,
rate-limited) + Earthdata bulk-tile path (free account). Region-of-interest only —
never global downloads. Slope/flow products arrive in Step 10; this adapter stores
raw DEM + processed DEM + metadata.
"""

from __future__ import annotations

import httpx

from app.core import units
from app.core.cache import CacheExpired, FileCache
from app.core.http import ProviderHttp
from app.core.provenance import make_provenance, new_run_id
from app.core.status import DataStatus
from app.schemas.observations import Observation, QualityFlag
from app.services.providers.registry import BaseProvider, Capability, ProviderSpec

POINT_URL = "https://api.opentopodata.org/v1/srtm30m"
LICENSE = "SRTM: US public domain; cite version. OpenTopoData: 1000 calls/day free."


def tile_name(lat: float, lon: float) -> str:
    """SRTM .hgt tile name for a point, e.g. N28E077."""
    ns = "N" if lat >= 0 else "S"
    ew = "E" if lon >= 0 else "W"
    return f"{ns}{abs(int(lat)):02d}{ew}{abs(int(lon)):03d}"


def tiles_for_bbox(bbox: list[float]) -> list[str]:
    """ROI tile list for [minlon, minlat, maxlon, maxlat] (1° SRTM tiles)."""
    minlon, minlat, maxlon, maxlat = bbox
    if not (-180 <= minlon <= 180 and -180 <= maxlon <= 180 and -90 <= minlat <= 90 and -90 <= maxlat <= 90):
        raise ValueError(f"invalid bbox: {bbox}")
    if minlon > maxlon or minlat > maxlat:
        raise ValueError(f"inverted bbox: {bbox}")
    tiles = set()
    lat = int(minlat)
    while lat <= int(maxlat):
        lon = int(minlon)
        while lon <= int(maxlon):
            tiles.add(tile_name(lat + 0.5, lon + 0.5))
            lon += 1
        lat += 1
    if len(tiles) > 36:
        raise ValueError(f"bbox spans {len(tiles)} tiles — refine the region of interest (max 36)")
    return sorted(tiles)


class SrtmProvider(BaseProvider):
    source_id = "srtm"

    def __init__(self, cache: FileCache | None = None, transport: httpx.BaseTransport | None = None):
        self.http = ProviderHttp(self.source_id, timeout_s=30.0, min_interval_s=1.0, transport=transport)
        self.cache = cache

    def metadata(self) -> dict:
        return {"source_id": self.source_id, "category": "terrain",
                "variables": ["elevation"], "unit": "m",
                "license": LICENSE, "authentication": "none for point API; free Earthdata for bulk tiles"}

    def availability(self) -> dict:
        return {"source_id": self.source_id, "ready": True, "needs_auth": False,
                "capabilities": ["elevation-point", "tile-list"],
                "limits": "OpenTopoData 1000 calls/day; bulk tiles via Earthdata (Step 3: URL builder only)"}

    def fetch_latest(self, lat: float, lon: float, **kwargs) -> dict:
        """Point elevation (LIVE when freshly queried)."""
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            raise ValueError(f"invalid coordinates: {lat}, {lon}")
        key = FileCache.make_key(self.source_id, "elevation-point", str(lat), str(lon))
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
            resp = self.http.get(POINT_URL, params={"locations": f"{lat},{lon}"})
            try:
                result = resp.json()["results"][0]
                elev = float(result["elevation"])
            except (KeyError, IndexError, TypeError, ValueError) as exc:
                raise ValueError(f"malformed elevation response: {exc}") from exc
            payload = {"elevation_m": elev, "dataset": "srtm30m", "tile": tile_name(lat, lon)}
            if self.cache is not None:
                self.cache.put(key, payload, {"status": DataStatus.LIVE.value}, ttl_s=30 * 86400)
        obs = Observation(
            source_id=self.source_id, product_id="srtm30m", timestamp=_now(), valid_time=_now(),
            latitude=lat, longitude=lon, variable="elevation", value=payload["elevation_m"], unit="m",
            spatial_resolution="30m", temporal_resolution="static",
            quality_flag=QualityFlag(units.check_range("elevation", payload["elevation_m"])),
            processing_version="ingest-srtm@v0.3", status=DataStatus.LIVE, license=LICENSE,
            provenance=make_provenance(run_id=run_id, request={"lat": lat, "lon": lon},
                                       code_ref="app/services/providers/srtm.py", config={}),
            region_id=kwargs.get("region_id", "TO_BE_CONFIGURED"),
        )
        return {"source_id": self.source_id, "status": DataStatus.LIVE.value,
                "observations": [obs.model_dump(mode="json")], "tile": payload["tile"],
                "cache_hit": cache_hit, "provenance_run_id": run_id}

    def fetch_historical(self, **kwargs) -> dict:
        return {"source_id": self.source_id, "status": DataStatus.UNAVAILABLE.value,
                "reason": "SRTM is a single-epoch (2000) static DEM; no historical series exists",
                "fallback": "none needed — static terrain"}


def _now():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc)


SPEC = ProviderSpec(
    source_id="srtm", category="terrain", license=LICENSE,
    authentication="none (point API); free Earthdata (bulk)", adapter="srtm:SrtmProvider",
    capabilities=Capability(variables=("elevation",), kinds=("terrain-point", "tile-list")),
    fallback="bhuvan-cartodem",
)
