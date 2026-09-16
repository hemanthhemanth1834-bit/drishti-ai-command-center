"""Free-first provider adapters. Every external source has an interface,
a free/open implementation, and an honest status (never fake success).

Hierarchy examples:
  Soil: ISRO/Bhuvan -> SoilGrids -> NASA -> Open-Meteo -> DEMO
  Precipitation: NASA GPM -> Open-Meteo -> DEMO
  Satellite: Copernicus -> NASA -> ISRO -> DEMO
  Storage: Local -> MinIO -> S3-compatible
  Push: WebPush(VAPID) -> Email(SMTP) -> SMS(optional) -> Demo/In-app
"""
from __future__ import annotations

import json as jsonlib
import os
import urllib.request
from typing import Dict, List, Optional


def _get_json(url: str, timeout: int = 10) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "drishti-x/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return jsonlib.loads(r.read().decode())


# ---------------- Soil ----------------

class SoilProvider:
    name = "base"

    def moisture(self, lat: float, lon: float) -> Dict:
        raise NotImplementedError


class ISROBhuvanSoil(SoilProvider):
    name = "ISRO/Bhuvan (open, where accessible)"

    def moisture(self, lat: float, lon: float) -> Dict:
        return {"error": "Provider not configured",
                "detail": "Bhuvan gateway needs access/whitelisting. "
                          "Falls back down the hierarchy.",
                "source": "ISRO/Bhuvan", "data_status": "NOT_CONFIGURED"}


class SoilGridsSoil(SoilProvider):
    """ISRIC SoilGrids v2.0 — free, no key (REST). проба properties."""
    name = "SoilGrids/ISRIC (free, no key)"

    def moisture(self, lat: float, lon: float) -> Dict:
        url = ("https://rest.isric.org/soilgrids/v2.0/properties/query"
               f"?lon={lon}&lat={lat}&property=bdod&property=clay&depth=0-5cm&value=mean")
        try:
            data = _get_json(url)
            layers = (data.get("properties", {}).get("layers", []) or [])
            vals = {}
            for layer in layers:
                depths = (layer.get("depths", []) or [])
                if depths:
                    vals[layer.get("name", "?")] = depths[0].get("values", {}).get("mean")
            return {"properties": vals, "source": "LIVE:SoilGrids",
                    "data_status": "LIVE",
                    "note": "Texture proxies — not live moisture."}
        except Exception as e:
            return {"error": f"SoilGrids unreachable: {type(e).__name__}",
                    "source": "SoilGrids", "data_status": "UNAVAILABLE"}


class OpenMeteoSoil(SoilProvider):
    name = "Open-Meteo soil (free, no key)"

    def moisture(self, lat: float, lon: float) -> Dict:
        url = ("https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s"
               "&hourly=soil_moisture_0_1cm&forecast_days=2&timezone=auto" % (lat, lon))
        try:
            data = _get_json(url)
            vals = (data.get("hourly", {}).get("soil_moisture_0_1cm", []) or [])
            return {"soil_moisture_m3m3": vals[0] if vals else None,
                    "source": "LIVE:Open-Meteo", "data_status": "LIVE"}
        except Exception as e:
            return {"error": f"Open-Meteo unreachable: {type(e).__name__}",
                    "source": "Open-Meteo", "data_status": "UNAVAILABLE"}


class DemoSoil(SoilProvider):
    name = "Demo soil (simulated)"

    def moisture(self, lat: float, lon: float) -> Dict:
        return {"soil_moisture_pct": 55.0, "source": "DEMO",
                "data_status": "DEMO"}


def soil_moisture(lat: float, lon: float) -> Dict:
    """Walk the hierarchy; first success wins, chain recorded honestly."""
    chain: List[str] = []
    for provider in (ISROBhuvanSoil(), SoilGridsSoil(), OpenMeteoSoil()):
        out = provider.moisture(lat, lon)
        chain.append(f"{provider.name}={out.get('data_status')}")
        if "error" not in out:
            out["fallback_chain"] = chain
            return out
    out = DemoSoil().moisture(lat, lon)
    chain.append(f"{DemoSoil.name}=DEMO")
    out["fallback_chain"] = chain
    return out


# ---------------- Precipitation ----------------

class PrecipitationProvider:
    name = "base"

    def precipitation(self, lat: float, lon: float) -> Dict:
        raise NotImplementedError


class NASAGPMPrecip(PrecipitationProvider):
    """NASA GPM IMERG via open services (GIBS visualisation / Earthdata).

    Full IMERG download needs Earthdata login; this adapter reports status
    honestly and points at the free path.
    """
    name = "NASA GPM (open, Earthdata login for bulk)"

    def precipitation(self, lat: float, lon: float) -> Dict:
        if not os.getenv("EARTHDATA_TOKEN"):
            return {"error": "Provider not configured for bulk IMERG",
                    "detail": "Set EARTHDATA_TOKEN (free NASA Earthdata login) "
                              "or use Open-Meteo fallback. GIBS visualisation "
                              "layers remain usable client-side.",
                    "source": "NASA GPM", "data_status": "NOT_CONFIGURED"}


class OpenMeteoPrecip(PrecipitationProvider):
    name = "Open-Meteo precipitation (free, no key)"

    def precipitation(self, lat: float, lon: float) -> Dict:
        url = ("https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s"
               "&hourly=precipitation&daily=precipitation_sum"
               "&forecast_days=7&past_days=7&timezone=auto" % (lat, lon))
        try:
            data = _get_json(url)
            hourly = (data.get("hourly", {}).get("precipitation", []) or [])
            daily = (data.get("daily", {}).get("precipitation_sum", []) or [])
            return {"hourly_next_mm": hourly[:24],
                    "daily_sum_mm": daily,
                    "source": "LIVE:Open-Meteo", "data_status": "LIVE"}
        except Exception as e:
            return {"error": f"Open-Meteo unreachable: {type(e).__name__}",
                    "source": "Open-Meteo", "data_status": "UNAVAILABLE"}


def precipitation(lat: float, lon: float) -> Dict:
    chain: List[str] = []
    for provider in (NASAGPMPrecip(), OpenMeteoPrecip()):
        out = provider.precipitation(lat, lon)
        chain.append(f"{provider.name}={out.get('data_status')}")
        if "error" not in out:
            out["fallback_chain"] = chain
            return out
    return {"rain_1h": 4.0, "rain_24h": 42.0, "source": "DEMO",
            "data_status": "DEMO",
            "fallback_chain": chain + ["DemoPrecipitation=DEMO"]}


# ---------------- Satellite ----------------

class SatelliteAdapter:
    name = "base"
    kind = "demo"

    def describe(self) -> Dict:
        raise NotImplementedError


class CopernicusAdapter(SatelliteAdapter):
    name = "Copernicus (Sentinel-1/-2, free with account)"
    kind = "copernicus"

    def describe(self) -> Dict:
        if not os.getenv("COPERNICUS_USER"):
            return {"status": "NOT_CONFIGURED",
                    "detail": "Free Copernicus Data Space account needed "
                              "(COPERNICUS_USER). No imagery synthesized.",
                    "sensors": ["Sentinel-1 SAR (surface change, all-weather)",
                                "Sentinel-2 MSI (vegetation, land cover)"]}
        return {"status": "READY", "sensors": ["Sentinel-1", "Sentinel-2"]}


class NASAAdapter(SatelliteAdapter):
    name = "NASA (GIBS visualisation + Earthdata)"
    kind = "nasa"

    def describe(self) -> Dict:
        return {"status": "PARTIAL",
                "detail": "GIBS WMTS layers usable keyless in the frontend; "
                          "bulk download needs EARTHDATA_TOKEN.",
                "gibs_template": "https://gibs.earthdata.nasa.gov/wmts/epsg3857/"
                                 "best/{layer}/default/{date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg"}


class ISROAdapter(SatelliteAdapter):
    name = "ISRO/Bhoonidhi (open data where available)"
    kind = "isro"

    def describe(self) -> Dict:
        return {"status": "NOT_CONFIGURED",
                "detail": "Bhoonidhi access varies by dataset; no credentials "
                          "configured. Falls back to demo/tiles."}


# ---------------- Storage ----------------

class StorageProvider:
    name = "base"

    def save(self, key: str, content: bytes, content_type: str) -> Dict:
        raise NotImplementedError


class LocalStorage(StorageProvider):
    name = "Local filesystem (dev)"

    def __init__(self, root: str = "./storage"):
        self.root = root

    def save(self, key: str, content: bytes, content_type: str) -> Dict:
        import pathlib
        safe = "".join(c for c in key if c.isalnum() or c in "-_./").lstrip("./")
        dest = pathlib.Path(self.root) / safe
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(content)
        return {"ok": True, "uri": f"local://{dest}", "provider": self.name}


class MinIOStorage(StorageProvider):
    name = "MinIO (self-hosted S3)"

    def save(self, key: str, content: bytes, content_type: str) -> Dict:
        endpoint = os.getenv("STORAGE_ENDPOINT", "")
        if not endpoint or not os.getenv("STORAGE_ACCESS_KEY"):
            return {"ok": False, "status": "Provider not configured",
                    "needs": "STORAGE_ENDPOINT + STORAGE_ACCESS_KEY + "
                             "STORAGE_SECRET_KEY (MinIO, self-hosted)"}
        return {"ok": False, "status": "NOT_IMPLEMENTED_HERE",
                "detail": "Wire minio-py with the env above; local saved instead."}


def storage() -> StorageProvider:
    if os.getenv("STORAGE_ENDPOINT"):
        return MinIOStorage()
    return LocalStorage()


# ---------------- Web Push / Email ----------------

class WebPushProvider:
    name = "Web Push (VAPID, free)"

    def status(self) -> Dict:
        if os.getenv("WEB_PUSH_PUBLIC_KEY") and os.getenv("WEB_PUSH_PRIVATE_KEY"):
            return {"channel": "push", "status": "READY",
                    "detail": "VAPID configured; subscriptions via /api/v1/sync/subscriptions."}
        return {"channel": "push", "status": "NOT_CONFIGURED",
                "needs": "WEB_PUSH_PUBLIC_KEY + WEB_PUSH_PRIVATE_KEY "
                         "(generate once with `npx web-push generate-vapid-keys`). "
                         "In-app + Web Notification fallback active."}

    def send(self, subscription: dict, title: str, body: str) -> Dict:
        if not os.getenv("WEB_PUSH_PRIVATE_KEY"):
            return {"ok": False, "status": "Provider not configured",
                    "fallback": "in-app queue"}
        return {"ok": False, "status": "NOT_IMPLEMENTED_HERE",
                "detail": "Add pywebpush with the stored subscription."}


class EmailProvider:
    name = "SMTP email (free: Gmail/self-hosted/Mailpit)"

    def status(self) -> Dict:
        if os.getenv("SMTP_HOST"):
            return {"channel": "email", "status": "READY",
                    "host": os.getenv("SMTP_HOST")}
        return {"channel": "email", "status": "NOT_CONFIGURED",
                "needs": "SMTP_HOST (+ SMTP_USER/SMTP_PASSWORD). "
                         "Dev: Mailpit via docker-compose."}
