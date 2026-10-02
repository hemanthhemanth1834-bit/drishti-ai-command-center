"""Local JSON model registry (Step 5). No paid ML platform: registry.json lives in
models/ (committed, KBs); artifacts (*.joblib) live in models/artifacts/
(git-ignored). No artifact exists without provenance; only registry paths load.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

REGISTRY_PATH = Path(__file__).resolve().parents[2] / "models" / "registry.json"
# Repo root (ml/registry/registry.py → parents[2] == repo root). Used to resolve
# repo-relative artifact paths and to contain legacy absolute-path lookups.
REPO_ROOT = Path(__file__).resolve().parents[2]


def _load() -> dict:
    if REGISTRY_PATH.exists():
        return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    return {"models": []}


def _save(db: dict) -> None:
    REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    REGISTRY_PATH.write_text(json.dumps(db, indent=2), encoding="utf-8")


def sha256_file(path: str | Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def register(entry: dict) -> dict:
    db = _load()
    db["models"] = [m for m in db["models"]
                    if not (m["model_id"] == entry["model_id"] and m["version"] == entry["version"])]
    db["models"].append(entry)
    _save(db)
    return entry


def list_models() -> list[dict]:
    return _load()["models"]


def _version_key(v: str) -> tuple:
    """Natural version ordering: v0.9 < v0.10 (lexicographic sort breaks this)."""
    import re
    parts = re.findall(r"\d+|[a-zA-Z]+", str(v))
    return tuple(int(p) if p.isdigit() else p for p in parts)


def get(model_id: str, version: str | None = None) -> dict:
    cands = [m for m in _load()["models"] if m["model_id"] == model_id]
    if not cands:
        raise KeyError(f"model not registered: {model_id}")
    if version is None:
        return sorted(cands, key=lambda m: _version_key(m["version"]))[-1]
    for m in cands:
        if m["version"] == version:
            return m
    raise KeyError(f"version {version} not registered for {model_id}")


def check_compatible(entry: dict, feature_schema_version: str, dataset_id: str | None = None) -> None:
    if entry["feature_schema_version"] != feature_schema_version:
        raise ValueError(f"schema mismatch: model {entry['feature_schema_version']} "
                         f"vs requested {feature_schema_version}")
    if dataset_id and entry["training_dataset_id"] != dataset_id:
        raise ValueError("dataset mismatch")
