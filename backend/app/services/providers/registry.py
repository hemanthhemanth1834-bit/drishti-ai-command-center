"""Provider interface + registry (Step 3). All 8 providers share this contract."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable


@dataclass(frozen=True)
class Capability:
    variables: tuple[str, ...] = ()
    kinds: tuple[str, ...] = ()  # forecast | historical | metadata | imagery-context | ...
    needs_auth: bool = False
    notes: str = ""


@dataclass(frozen=True)
class ProviderSpec:
    source_id: str
    category: str
    license: str
    authentication: str
    adapter: str  # module path fragment, e.g. "openmeteo:OpenMeteoProvider"
    capabilities: Capability = field(default_factory=Capability)
    fallback: str = ""


class BaseProvider:
    """RadarProvider-style interface every adapter implements."""

    source_id = "base"

    def metadata(self) -> dict:
        raise NotImplementedError

    def availability(self) -> dict:
        """Cheap, no-network (or cache-only) readiness report."""
        raise NotImplementedError

    def fetch_latest(self, **kwargs) -> dict:
        raise NotImplementedError

    def fetch_historical(self, **kwargs) -> dict:
        raise NotImplementedError


REGISTRY: dict[str, ProviderSpec] = {}


def register(spec: ProviderSpec) -> ProviderSpec:
    REGISTRY[spec.source_id] = spec
    return spec


def _specs() -> list[ProviderSpec]:
    from app.services.providers import (
        gibs,
        gfs,
        imerg,
        openmeteo,
        osm,
        radar,
        sentinel,
        srtm,
        terrain_tiles,
    )

    for mod in (openmeteo, gibs, srtm, osm, gfs, imerg, sentinel, radar, terrain_tiles):
        register(mod.SPEC)
    return list(REGISTRY.values())


def get_spec(source_id: str) -> ProviderSpec:
    if source_id not in REGISTRY:
        _specs()
    return REGISTRY[source_id]


def list_specs() -> list[ProviderSpec]:
    if not REGISTRY:
        _specs()
    return list(REGISTRY.values())


def make_adapter(source_id: str, **kwargs) -> BaseProvider:
    """Instantiate the adapter class named in the spec (lazy import)."""
    spec = get_spec(source_id)
    module_name, class_name = spec.adapter.split(":")
    import importlib

    module = importlib.import_module(f"app.services.providers.{module_name}")
    factory: Callable[..., BaseProvider] = getattr(module, class_name)
    return factory(**kwargs)
