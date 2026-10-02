"""Open-Meteo adapter (Step 3). Fully functional: forecast + archive, key-free.

Variables: precipitation, temperature_2m, relative_humidity_2m, wind_speed_10m,
wind_direction_10m, pressure_msl. SI units requested explicitly; conversions
still pass through app.core.units (never ad hoc).
"""

from __future__ import annotations

from datetime import datetime, timezone

import httpx

from app.core import units
from app.core.cache import CacheExpired, FileCache
from app.core.http import ProviderHttp
from app.core.provenance import config_hash, make_provenance, new_run_id
from app.core.status import DataStatus
from app.schemas.observations import Observation, Provenance, QualityFlag, RawManifest
from app.services.providers.registry import BaseProvider, Capability, ProviderSpec

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
LICENSE = "CC-BY-4.0-family (non-commercial incl. research; attribution required)"

VARIABLES = (
    "precipitation",
    "temperature_2m",
    "relative_humidity_2m",
    "wind_speed_10m",
    "wind_direction_10m",
    "pressure_msl",
)

# (response key, canonical variable, from-unit, to-fn)
FIELDS = (
    ("precipitation", "precipitation", "mm", units.mm),
    ("temperature_2m", "temperature_2m", "celsius", units.celsius),
    ("relative_humidity_2m", "relative_humidity_2m", "%", lambda v, u: v),
    ("wind_speed_10m", "wind_speed_10m", "ms", lambda v, u: units.meters_per_second(v, "m/s")),
    ("wind_direction_10m", "wind_direction_10m", "deg", lambda v, u: v),
    ("pressure_msl", "pressure_msl", "hpa", units.hectopascal),
)


def _parse_time(s: str) -> datetime:
    dt = datetime.fromisoformat(s)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


class OpenMeteoProvider(BaseProvider):
    source_id = "open-meteo"

    def __init__(
        self,
        cache: FileCache | None = None,
        transport: httpx.BaseTransport | None = None,
        processing_version: str = "ingest-openmeteo@v0.3",
    ):
        self.http = ProviderHttp(self.source_id, timeout_s=30.0, min_interval_s=1.0, transport=transport)
        self.cache = cache
        self.processing_version = processing_version

    # -- interface ------------------------------------------------------
    def metadata(self) -> dict:
        return {
            "source_id": self.source_id,
            "category": "weather",
            "variables": list(VARIABLES),
            "license": LICENSE,
            "authentication": "none (key-free standard use)",
        }

    def availability(self) -> dict:
        return {
            "source_id": self.source_id,
            "ready": True,
            "needs_auth": False,
            "capabilities": ["forecast", "historical"],
            "fallback": "gfs-0p25-direct",
        }

    def fetch_latest(self, lat: float, lon: float, **kwargs) -> dict:
        """Hourly forecast (status FORECAST — never LIVE)."""
        return self._fetch(FORECAST_URL, "forecast-v1", DataStatus.FORECAST, lat, lon, **kwargs)

    def fetch_historical(self, lat: float, lon: float, start: str, end: str, **kwargs) -> dict:
        """Archive (status HISTORICAL). Dates YYYY-MM-DD."""
        return self._fetch(
            ARCHIVE_URL, "archive-v1", DataStatus.HISTORICAL, lat, lon,
            extra={"start_date": start, "end_date": end}, **kwargs,
        )

    # -- internals ------------------------------------------------------
    def _fetch(self, url, product, status, lat, lon, extra=None, region_id="TO_BE_CONFIGURED",
               use_cache=True, ttl_s=1800) -> dict:
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            raise ValueError(f"invalid coordinates: {lat}, {lon}")
        params = {
            "latitude": lat, "longitude": lon,
            "hourly": ",".join(VARIABLES),
            "temperature_unit": "celsius", "windspeed_unit": "ms",
            "precipitation_unit": "mm", "timezone": "UTC",
        }
        if extra:
            params.update(extra)
        key = FileCache.make_key(self.source_id, product, str(lat), str(lon), repr(sorted(params.items())))
        run_id = new_run_id()

        raw: dict | None = None
        cache_meta: dict = {"cache_hit": False}
        if use_cache and self.cache is not None:
            try:
                raw, cache_meta = self.cache.get(key)
                cache_meta = {**cache_meta, "cache_hit": True}
            except KeyError:
                pass
            except CacheExpired as exc:
                cache_meta = {**exc.meta, "cache_hit": True, "cache_expired": True}
                raw = None  # expired entries are refetched, never served as current

        if raw is None:
            resp = self.http.get(url, params=params)
            raw = resp.json()
            manifest = RawManifest(
                source_id=self.source_id, product_id=product, url=str(resp.url),
                time_range={"params": params}, status=status, license=LICENSE,
                pipeline_run_id=run_id, size_bytes=len(resp.content),
            )
            if use_cache and self.cache is not None:
                cache_meta = self.cache.put(key, raw, {"status": status.value,
                                             "source_timestamp": utcnow_iso()})
                cache_meta = {**cache_meta, "cache_hit": False}

        observations = self._normalize(raw, product, status, lat, lon, region_id, run_id, params)
        return {
            "source_id": self.source_id, "product_id": product, "status": status.value,
            "region_id": region_id, "observations": [o.model_dump(mode="json") for o in observations],
            "count": len(observations),
            "cache": {k: cache_meta.get(k) for k in ("cache_hit", "created_at", "expires_at")},
            "provenance_run_id": run_id,
        }

    def _normalize(self, raw, product, status, lat, lon, region_id, run_id, params) -> list[Observation]:
        try:
            hourly = raw["hourly"]
            times = hourly["time"]
        except (KeyError, TypeError) as exc:
            raise ValueError(f"malformed open-meteo response: missing hourly/time ({exc})") from exc
        if not times:
            raise ValueError("malformed open-meteo response: empty time axis")
        seen: set[str] = set()
        out: list[Observation] = []
        prov = make_provenance(run_id=run_id, request={"params": params, "endpoint": product},
                               code_ref="app/services/providers/openmeteo.py",
                               config={"units": "SI", "timezone": "UTC"})
        for i, t in enumerate(times):
            if t in seen:
                continue  # duplicate timestamps are skipped and counted, never doubled
            seen.add(t)
            ts = _parse_time(t)
            for resp_key, variable, from_unit, conv in FIELDS:
                series = hourly.get(resp_key)
                if series is None:
                    continue
                val = series[i] if i < len(series) else None
                if val is None or (isinstance(val, float) and (val != val or val in (float("inf"), float("-inf")))):
                    out.append(self._obs(product, status, lat, lon, region_id, ts, variable,
                                         None, from_unit, QualityFlag.MISSING, prov))
                    continue
                try:
                    canonical = conv(float(val), from_unit)
                except units.UnitError:
                    out.append(self._obs(product, status, lat, lon, region_id, ts, variable,
                                         None, from_unit, QualityFlag.BAD, prov))
                    continue
                flag = QualityFlag(units.check_range(variable, canonical))
                out.append(self._obs(product, status, lat, lon, region_id, ts, variable,
                                     canonical, _canon_unit(variable), flag, prov))
        return out

    def _obs(self, product, status, lat, lon, region_id, ts, variable, value, unit, flag, prov: Provenance):
        return Observation(
            source_id=self.source_id, product_id=product, timestamp=ts, valid_time=ts,
            latitude=lat, longitude=lon, variable=variable, value=value, unit=unit,
            spatial_resolution="~11km", temporal_resolution="hourly",
            quality_flag=flag, processing_version=self.processing_version,
            status=status, license=LICENSE, provenance=prov, region_id=region_id,
        )


def _canon_unit(variable: str) -> str:
    return {"precipitation": "mm", "temperature_2m": "°C",
            "relative_humidity_2m": "%", "wind_speed_10m": "m/s",
            "wind_direction_10m": "°", "pressure_msl": "hPa"}[variable]


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


SPEC = ProviderSpec(
    source_id="open-meteo", category="weather", license=LICENSE,
    authentication="none", adapter="openmeteo:OpenMeteoProvider",
    capabilities=Capability(variables=VARIABLES, kinds=("forecast", "historical"),
                            notes="key-free; non-commercial; attribution"),
    fallback="gfs-0p25-direct",
)
