"""Radar adapter (Step 3). Interface only — Step 2 proved no free quantitative
NRT radar feed. No fake responses, no GIF-as-data. All fetches return
UNAVAILABLE with reason + checked sources + fallback (satellite + observations).
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.core.status import DataStatus
from app.schemas.observations import ProviderUnavailable
from app.services.providers.registry import BaseProvider, Capability, ProviderSpec

CHECKED = ["imd-web-gif (view-only, non-quantitative)", "imd-api-radar (access TBD)",
           "mosdac-dwr-catalogue (registration, 3-day general latency)"]
FALLBACK = "satellite (IMERG/GIBS-context) + weather observations (Open-Meteo)"


class RadarProvider(BaseProvider):
    """RadarProvider interface: metadata / availability / fetch_latest / fetch_historical."""

    source_id = "radar"

    def metadata(self) -> dict:
        return {"source_id": self.source_id, "category": "radar",
                "variables": ["reflectivity (dBZ) — when a feed is established"],
                "license": "per-feed government terms", "authentication": "per-feed TBD"}

    def availability(self) -> dict:
        return {"source_id": self.source_id, "ready": False, "needs_auth": True,
                "quantitative_nrt_feed": None, "checked_sources": CHECKED,
                "fallback": FALLBACK}

    def _unavailable(self) -> dict:
        return ProviderUnavailable(
            source_id=self.source_id,
            reason="no programmatically usable free quantitative NRT radar feed verified",
            checked_sources=CHECKED, fallback=FALLBACK,
        ).model_dump(mode="json")

    def fetch_latest(self, **kwargs) -> dict:
        return self._unavailable()

    def fetch_historical(self, **kwargs) -> dict:
        return self._unavailable() | {"note": "historical radar likewise unavailable free; use IMERG Final + gauges"}

    @staticmethod
    def imd_imagery_note() -> dict:
        """View-only context pointer. Explicitly NOT quantitative data."""
        return {"kind": "RADAR_IMAGERY_CONTEXT (not measurements)",
                "source": "mausam.imd.gov.in public station pages (e.g. Delhi MAX(Z)/PPI/SRI/PAC)",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "warning": "GIF pixels must never enter quantitative pipelines"}


SPEC = ProviderSpec(
    source_id="radar", category="radar", license="per-feed government terms",
    authentication="per-feed TBD", adapter="radar:RadarProvider",
    capabilities=Capability(variables=(), kinds=("interface-only",),
                            notes="UNAVAILABLE until a quantitative feed is verified"),
    fallback="satellite + observations",
)
