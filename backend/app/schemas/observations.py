"""DRISHTI-X common data envelope (Step 3). Single schema for all ingested observations.

Implements docs/DATA-MODEL.md §1. No second incompatible schema exists.
"""

from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field, field_validator

from app.core.status import DataStatus


class QualityFlag(str, Enum):
    """Step-4 vocabulary. VALID supersedes GOOD (kept for Step-3 compat)."""

    GOOD = "GOOD"  # legacy alias of VALID — do not use in new code
    VALID = "VALID"
    SUSPECT = "SUSPECT"
    BAD = "BAD"  # legacy severe flag — prefer INVALID/OUTLIER in new code
    OUTLIER = "OUTLIER"  # extreme-but-possible, flagged not deleted
    DUPLICATE = "DUPLICATE"  # collapsed repeat, counted
    INVALID = "INVALID"  # physically impossible or structurally broken
    MISSING = "MISSING"
    STALE = "STALE"  # expired cache / outdated feed served only with this flag
    UNCHECKED = "UNCHECKED"


class MissingState(str, Enum):
    """Missing-data policy states (docs/DATA-PROCESSING-PIPELINE.md)."""

    AVAILABLE = "AVAILABLE"
    MISSING = "MISSING"
    INTERPOLATED = "INTERPOLATED"  # derived + method recorded
    IMPUTED = "IMPUTED"  # derived + method recorded
    STALE = "STALE"
    UNAVAILABLE = "UNAVAILABLE"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Provenance(BaseModel):
    """docs/PROVENANCE.md lineage hop."""

    pipeline_run_id: str
    parent_ids: list[str] = Field(default_factory=list)
    code_ref: str = ""
    config_hash: str = ""
    request: dict = Field(default_factory=dict)


class Observation(BaseModel):
    """One normalized observation. Grids use asset pointers in `value_meta`."""

    source_id: str
    product_id: str
    timestamp: datetime
    valid_time: datetime
    ingestion_time: datetime = Field(default_factory=utcnow)
    latitude: float | None = None
    longitude: float | None = None
    variable: str
    value: float | None = None
    value_meta: dict = Field(default_factory=dict)
    unit: str
    spatial_resolution: str = ""
    temporal_resolution: str = ""
    quality_flag: QualityFlag = QualityFlag.UNCHECKED
    processing_version: str = "ingest@v0.3"
    status: DataStatus
    license: str = ""
    provenance: Provenance
    region_id: str = "TO_BE_CONFIGURED"

    @field_validator("latitude")
    @classmethod
    def _lat(cls, v: float | None) -> float | None:
        if v is not None and not -90.0 <= v <= 90.0:
            raise ValueError(f"latitude out of range: {v}")
        return v

    @field_validator("longitude")
    @classmethod
    def _lon(cls, v: float | None) -> float | None:
        if v is not None and not -180.0 <= v <= 180.0:
            raise ValueError(f"longitude out of range: {v}")
        return v


class RawManifest(BaseModel):
    """Manifest describing one raw download (data/metadata/, never the data)."""

    source_id: str
    product_id: str
    url: str
    access_method: str = "https"
    downloaded_at: datetime = Field(default_factory=utcnow)
    sha256: str = ""
    size_bytes: int = 0
    time_range: dict = Field(default_factory=dict)
    bbox: list[float] = Field(default_factory=list)
    status: DataStatus = DataStatus.UNAVAILABLE
    license: str = ""
    pipeline_run_id: str = ""


class ProviderUnavailable(BaseModel):
    """Honest UNAVAILABLE payload — never a fabricated substitute."""

    source_id: str
    status: DataStatus = DataStatus.UNAVAILABLE
    reason: str
    checked_sources: list[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=utcnow)
    fallback: str = ""
