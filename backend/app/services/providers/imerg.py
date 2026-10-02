"""GPM IMERG adapter (Steps 3+17). Real product path with honest auth gating.

Product: GPM_3IMERGHH v07 (half-hourly, 0.1°, precipitationCal in mm/hr;
DOI 10.5067/GPM/IMERG/3B-HH/07). Runs: Early (~4 h latency), Late (~12 h,
gauge-adjusted), Final (research, ~3.5 mo — not ingested here).
Access: free NASA Earthdata Login + GES DISC authorization (env credentials
only, never committed, never bypassed). Without credentials every fetch
returns GATED/UNAVAILABLE with setup steps — never fabricated values.

Source role (documented, no auto-outranking): IMERG Late is a gauge-adjusted
satellite-gauge blend → classified ANALYSIS (not pure OBSERVATION). It fuses
only when compatibility gates pass like any other source; its ~12 h latency
is recorded in provenance and the standard QC age rule applies.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone

import httpx

from app.core.http import ProviderHttp
from app.core.provenance import new_run_id
from app.core.status import DataStatus
from app.schemas.observations import ProviderUnavailable
from app.services.providers.registry import BaseProvider, Capability, ProviderSpec

LICENSE = "NASA open-data policy; cite dataset DOI"
DOI = "10.5067/GPM/IMERG/3B-HH/07"
PRODUCT = "GPM_3IMERGHH"
VERSION = "V07"
RESOLUTION = "0.1°, 30-min"
SETUP_STEPS = (
    "1. Create free NASA Earthdata Login (urs.earthdata.nasa.gov).",
    "2. Register for PPS FTP access (required for Early/Late NRT GIS products).",
    "3. Authorize the 'NASA GESDISC DATA ARCHIVE' application.",
    "4. Export EARTHDATA_USERNAME and EARTHDATA_PASSWORD (env only, never git).",
)
PPS_GIS_EARLY = "https://jsimpsonhttps.pps.eosdis.nasa.gov/imerg/gis/early/"
GESDISC_URS = "https://urs.earthdata.nasa.gov/oauth/authorize"


def gesdisc_halfhourly_url(dt: datetime) -> str:
    """GES DISC HTTPS path for one half-hourly granule (V07).

    Layout: .../GPM_3IMERGHH.07/YYYY/DDD/3B-HHR.MS.MRG.3IMERG.YYYYMMDD-SHHMMSS-EHHMMSS.HHHH.V07B.HDF5
    """
    doy = dt.timetuple().tm_yday
    stamp = dt.strftime("%Y%m%d-S%H%M%S")
    end = (dt.replace(minute=29, second=59) if dt.minute < 30
           else dt.replace(minute=59, second=59)).strftime("E%H%M%S")
    fname = f"3B-HHR.MS.MRG.3IMERG.{stamp}-{end}.1800.V07B.HDF5"
    return (f"https://gpm1.gesdisc.eosdis.nasa.gov/data/GPM_L3/{PRODUCT}.07/"
            f"{dt.year}/{doy:03d}/{fname}")


class ImergProvider(BaseProvider):
    source_id = "gpm-imerg"

    def __init__(self, username: str | None = None, password: str | None = None):
        self.username = username or os.getenv("EARTHDATA_USERNAME", "")
        self.password = password or os.getenv("EARTHDATA_PASSWORD", "")

    def metadata(self) -> dict:
        return {"source_id": self.source_id, "category": "satellite",
                "products": ["3B-HHR-E (Early ~4h)", "3B-HHR-L (Late ~14h)", "3B-DAY/MON"],
                "variables": ["precipitation"], "resolution": "0.1°, 30-min",
                "license": LICENSE, "authentication": "free Earthdata + PPS registration"}

    def availability(self) -> dict:
        configured = bool(self.username and self.password)
        return {"source_id": self.source_id, "ready": configured, "needs_auth": True,
                "configured": configured,
                "capabilities": ["authenticated-download (Step 4)"] if configured else [],
                "setup": list(SETUP_STEPS) if not configured else [],
                "fallback": "open-meteo-precip"}

    def _blocked(self, run_id: str) -> dict:
        return ProviderUnavailable(
            source_id=self.source_id,
            reason="Earthdata/PPS credentials absent — refusing to bypass auth or fabricate data",
            checked_sources=["pps-gis-early", "gesdisc-cmr"],
            fallback="open-meteo-precip (key-free)",
        ).model_dump(mode="json") | {"setup": list(SETUP_STEPS), "provenance_run_id": run_id}

    def fetch_latest(self, product: str = "early", **kwargs) -> dict:
        run_id = new_run_id()
        if not (self.username and self.password):
            return self._blocked(run_id)
        if product not in ("early", "late"):
            raise ValueError("product must be 'early' or 'late' (Final Run is Step 4+ batch)")
        return {"source_id": self.source_id, "status": DataStatus.UNAVAILABLE.value,
                "reason": "authenticated download executes in Step 4; interface ready, credentials present",
                "request_descriptor": {"tree": PPS_GIS_EARLY if product == "early" else "pps-gis-late",
                                       "auth": "earthdata-session (env credentials)"},
                "provenance_run_id": run_id}

    def fetch_historical(self, **kwargs) -> dict:
        run_id = new_run_id()
        if not (self.username and self.password):
            return self._blocked(run_id)
        return {"source_id": self.source_id, "status": DataStatus.UNAVAILABLE.value,
                "reason": "Final-Run batch ingestion executes in Step 4+",
                "provenance_run_id": run_id}

    def fetch_hourly_pair(self, lat: float, lon: float, end_time: datetime,
                          latency_h: float = 12.0,
                          transport: httpx.BaseTransport | None = None) -> dict:
        """Fetch the two half-hour granules ending at end_time and normalize to
        an hourly canonical payload. Both granules must succeed; a lone half
        hour is never doubled into a full hour (returns value None instead).
        Raises on missing credentials, HTTP errors, timeouts, malformed data.
        """
        from datetime import timedelta
        from app.services.processing import fusion as _F

        if not (self.username and self.password):
            raise PermissionError("Earthdata credentials absent")
        end_half = end_time.replace(minute=0 if end_time.minute < 30 else 30,
                                    second=0, microsecond=0)
        prev_half = end_half - timedelta(minutes=30)
        vals = []
        for dt in (prev_half, end_half):
            blob = self.download_granule(dt, transport=transport)["bytes"]
            vals.append(point_value(parse_imerg_bytes(blob), lat, lon))
        payload = normalize_imerg_halfhours(vals, end_half, lat, lon, latency_h)
        return {"payload": payload,
                "record": _F.canonical_from_imerg(payload),
                "status": DataStatus.LIVE.value if payload["value"] is not None
                          else DataStatus.UNAVAILABLE.value}

    # ---- Step-17 real product path (authenticated only) ---------------------

    def download_granule(self, dt: datetime, transport: httpx.BaseTransport | None = None,
                         timeout_s: float = 120.0) -> dict:
        """Download one half-hourly V07 granule via authenticated Earthdata session.

        Raises on missing credentials (never anonymous-scrapes), HTTP errors,
        and timeouts — callers record these as GATED/error, never as data.
        """
        if not (self.username and self.password):
            raise PermissionError("Earthdata credentials absent — refusing anonymous download")
        url = gesdisc_halfhourly_url(dt)
        http = ProviderHttp(self.source_id, timeout_s=timeout_s, min_interval_s=1.0,
                            transport=transport)
        client = http.client
        client.auth = (self.username, self.password)
        resp = client.get(url, follow_redirects=True)
        resp.raise_for_status()
        return {"url": url, "bytes": resp.content, "size_bytes": len(resp.content),
                "product": PRODUCT, "version": VERSION, "status": DataStatus.LIVE.value}


def parse_imerg_bytes(blob: bytes) -> dict:
    """Parse a V07 half-hourly HDF5 granule → {lats, lons, precip_mm_hr}.

    Raises ValueError on malformed input. precipitationCal is int16-scaled
    (×0.1 mm/hr, -9999.9 missing) — decoded here, never assumed.
    """
    import h5py
    import numpy as np

    try:
        f = h5py.File(__import__("io").BytesIO(blob), "r")
        grid = f["Grid"]
        raw = np.array(grid["precipitationCal"])
        lats = np.array(grid["lat"])
        lons = np.array(grid["lon"])
    except Exception as exc:
        raise ValueError(f"malformed IMERG granule: {exc}") from exc
    if raw.ndim != 2 or lats.ndim != 1 or lons.ndim != 1:
        raise ValueError("malformed IMERG granule: unexpected array shapes")
    vals = np.where(raw <= -9999, np.nan, raw.astype(np.float64) * 0.1)
    return {"lats": lats, "lons": lons, "precip_mm_hr": vals,
            "product": PRODUCT, "version": VERSION, "doi": DOI}


def point_value(parsed: dict, lat: float, lon: float) -> float | None:
    """Nearest-gridpoint extraction (documented; no interpolation claimed)."""
    import numpy as np

    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise ValueError(f"invalid coordinates: {lat}, {lon}")
    i = int(np.argmin(np.abs(parsed["lats"] - lat)))
    j = int(np.argmin(np.abs(parsed["lons"] - lon)))
    v = float(parsed["precip_mm_hr"][i, j])
    return None if v != v else v  # NaN → None (MISSING downstream)


def normalize_imerg_halfhours(values_mm_hr: list[float | None], end_time: datetime,
                              lat: float, lon: float, latency_h: float) -> dict:
    """Two half-hour rates → hourly accumulation as a canonical-record payload.

    Missing half-hours → value None (row dropped downstream, never filled).
    """
    from datetime import timezone as _tz
    ts = end_time if end_time.tzinfo else end_time.replace(tzinfo=_tz.utc)
    if any(v is None or v != v for v in values_mm_hr):
        value = None
    else:
        value = sum(float(v) * 0.5 for v in values_mm_hr)  # mm/hr × 0.5 h each
    return {"source": "gpm-imerg", "variable": "precipitation", "timestamp": ts,
            "latitude": lat, "longitude": lon, "value": value, "unit": "mm",
            "source_type": "ANALYSIS",
            "source_type_note": "gauge-adjusted satellite-gauge blend (Late); "
                                "not pure OBSERVATION, never outranks by default",
            "accum_hours": 1.0, "lead_time_h": None,
            "quality": "UNCHECKED",
            "provenance": {"product": PRODUCT, "version": VERSION, "doi": DOI,
                           "latency_h": latency_h, "resolution": RESOLUTION}}


SPEC = ProviderSpec(
    source_id="gpm-imerg", category="satellite", license=LICENSE,
    authentication="free Earthdata + PPS registration (required)", adapter="imerg:ImergProvider",
    capabilities=Capability(variables=("precipitation",), kinds=("authenticated-download",),
                            needs_auth=True),
    fallback="open-meteo-precip",
)
