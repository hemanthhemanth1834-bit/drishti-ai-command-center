"""GFS adapter (Step 3). Free/public path only: NOMADS GRIB-filter + AWS mirror.

Step-3 scope: run discovery (latest available cycle via cheap HEAD probes),
single-variable ROI subset download (raw GRIB2 bytes + manifest, status FORECAST).
GRIB2 decoding (xarray/cfgrib) is explicitly Step-4 work — payloads record
decoded:false and must not be presented as parsed fields. Never labelled obs.
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone

import httpx

from app.core.cache import FileCache
from app.core.http import ProviderHttp
from app.core.provenance import make_provenance, new_run_id
from app.core.status import DataStatus
from app.schemas.observations import RawManifest
from app.services.providers.registry import BaseProvider, Capability, ProviderSpec

NOMADS = "https://nomads.ncep.noaa.gov"
LICENSE = "NOAA open (attribution requested; no endorsement claims)"

# First variable: precipitation. Design allows appending (var, level) pairs later.
VARIABLES = {"precipitation": ("var_APCP", "lev_surface")}
EXTRA_VARIABLES_PLANNED = ("temperature_2m", "wind_10m", "pressure_msl", "humidity_2m")


def _cycle_candidates(now: datetime | None = None) -> list[tuple[str, str]]:
    base = now or datetime.now(timezone.utc)
    cands: list[tuple[str, str]] = []
    for day_off in (0, 1):
        day = (base - timedelta(days=day_off)).strftime("%Y%m%d")
        for cyc in ("18", "12", "06", "00"):
            cands.append((day, cyc))
    return cands


class GfsProvider(BaseProvider):
    source_id = "gfs-0p25"

    def __init__(self, transport: httpx.BaseTransport | None = None):
        self.http = ProviderHttp(self.source_id, timeout_s=60.0, min_interval_s=2.0, transport=transport)

    def metadata(self) -> dict:
        return {"source_id": self.source_id, "category": "nwp",
                "variables": ["precipitation"] + [f"{v} (planned)" for v in EXTRA_VARIABLES_PLANNED],
                "grid": "0.25°, 0–16 d", "license": LICENSE, "authentication": "none"}

    def availability(self) -> dict:
        return {"source_id": self.source_id, "ready": True, "needs_auth": False,
                "capabilities": ["run-discovery", "roi-subset-bytes"],
                "limits": "GRIB2 decode arrives Step 4 (decoded:false until then)"}

    def fetch_latest(self, **kwargs) -> dict:
        """Latest available run descriptor (FORECAST catalogue state, no bulk download)."""
        run = self.discover_run()
        run_id = new_run_id()
        return {"source_id": self.source_id, "status": DataStatus.FORECAST.value,
                "latest_run": run, "provenance_run_id": run_id,
                "note": "run descriptor only; call fetch_subset for ROI bytes"}

    def fetch_historical(self, **kwargs) -> dict:
        return {"source_id": self.source_id, "status": DataStatus.UNAVAILABLE.value,
                "reason": "NOMADS keeps ~10 d rolling; AWS mirror ~30 d — archive ingestion is Step 4+",
                "fallback": "open-meteo-archive"}

    def discover_run(self) -> dict:
        """Probe NOMADS for the newest published 0.25° cycle (HEAD = bytes-free)."""
        for date, cyc in _cycle_candidates():
            url = (f"{NOMADS}/pub/data/nccf/com/gfs/prod/gfs.{date}/{cyc}/atmos/"
                   f"gfs.t{cyc}z.pgrb2.0p25.f000")
            try:
                resp = self.http.client.head(url)
                if resp.status_code == 200:
                    return {"date": date, "cycle": cyc, "hour": "f000",
                            "dir": f"gfs.{date}/{cyc}/atmos", "checked_at": _iso_now()}
            except (httpx.TimeoutException, httpx.TransportError):
                continue
        raise ConnectionError("gfs: no published cycle found (NOMADS unreachable or lagging)")

    def subset_url(self, date: str, cycle: str, hour: str, variable: str,
                   bbox: list[float]) -> str:
        """Build a NOMADS GRIB-filter URL for one variable over an ROI bbox."""
        if variable not in VARIABLES:
            raise ValueError(f"unsupported variable: {variable!r} (Step 3: {sorted(VARIABLES)})")
        minlon, minlat, maxlon, maxlat = bbox
        if not (-180 <= minlon <= maxlon <= 180 and -90 <= minlat <= maxlat <= 90):
            raise ValueError(f"invalid bbox: {bbox}")
        if abs(maxlon - minlon) * abs(maxlat - minlat) > 2500:
            raise ValueError("ROI too large for subset smoke path (max ~2500 deg²)")
        var, lev = VARIABLES[variable]
        return (
            f"{NOMADS}/cgi-bin/filter_gfs_0p25.pl?file=gfs.t{cycle}z.pgrb2.0p25.{hour}"
            f"&{lev}=on&{var}=on&subregion=&leftlon={minlon}&rightlon={maxlon}"
            f"&toplat={maxlat}&bottomlat={minlat}&dir=%2Fgfs.{date}%2F{cycle}%2Fatmos"
        )

    def fetch_subset(self, variable: str, bbox: list[float], hour: str = "f006",
                     region_id: str = "TO_BE_CONFIGURED") -> dict:
        """Download ROI GRIB2 bytes + manifest. Decoded:false — Step 4 decodes."""
        run = self.discover_run()
        url = self.subset_url(run["date"], run["cycle"], hour, variable, bbox)
        run_id = new_run_id()
        resp = self.http.get(url)
        if not resp.content or len(resp.content) < 100:
            raise ValueError("gfs: empty subset response (cycle may still be publishing)")
        manifest = RawManifest(
            source_id=self.source_id, product_id=f"gfs-0p25-{hour}-{variable}",
            url=url, time_range={"run": run, "hour": hour}, bbox=bbox,
            sha256=hashlib.sha256(resp.content).hexdigest(), size_bytes=len(resp.content),
            status=DataStatus.FORECAST, license=LICENSE, pipeline_run_id=run_id,
        )
        return {"source_id": self.source_id, "status": DataStatus.FORECAST.value,
                "variable": variable, "run": run, "hour": hour, "decoded": False,
                "decode_note": "GRIB2 decoding (xarray/cfgrib) arrives Step 4",
                "manifest": manifest.model_dump(mode="json"),
                "provenance": make_provenance(run_id=run_id, request={"url": url},
                                              code_ref="app/services/providers/gfs.py",
                                              config={"bbox": bbox}).model_dump(mode="json")}


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


SPEC = ProviderSpec(
    source_id="gfs-0p25", category="nwp", license=LICENSE,
    authentication="none", adapter="gfs:GfsProvider",
    capabilities=Capability(variables=("precipitation",), kinds=("forecast",),
                            notes="Step 3: bytes+manifest; decode Step 4"),
    fallback="ecmwf-open",
)
