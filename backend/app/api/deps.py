"""Shared API dependencies (Step 3)."""

import os
from pathlib import Path

from app.core.cache import FileCache

CACHE_ROOT = Path(os.getenv("DRISHTI_CACHE_DIR", Path(__file__).resolve().parents[3] / "data" / ".cache"))


def get_cache() -> FileCache:
    return FileCache(CACHE_ROOT, default_ttl_s=int(os.getenv("DRISHTI_CACHE_TTL_S", "1800")))
