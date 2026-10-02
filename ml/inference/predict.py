"""Rainfall prediction contract (Step 5). Registry-gated loading only: artifacts
load exclusively from registry-recorded paths with checksum verification.
Uncertainty is NOT_IMPLEMENTED (returned explicitly, never invented).
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np

from ml.features.nowcast import intensity_category
from ml.features.rainfall import MODEL_FEATURES
from ml.registry import registry as registry_mod


def artifact_path(entry: dict) -> Path:
    """Resolve a registry artifact path robustly (production root cause fix).

    Contract (guaranteed for callers and tests):
    - the returned Path is ALWAYS absolute (never cwd-dependent);
    - relative registry entries ("models/artifacts/...") resolve from the
      repository root — NOT the current working directory;
    - legacy machine-absolute entries (e.g. C:\\Users\\...) are never trusted:
      the artifact is located by filename under the repo root / registry dir;
    - an ABSENT artifact still yields an absolute path (repo-root-anchored);
      absence is reported by .exists() == False, never by a fabricated path.
    """
    raw = str(entry["artifact"])
    if "\\" in raw or (len(raw) > 1 and raw[1] == ":"):
        # Legacy machine-absolute (Windows-style) entry: locate by filename
        # under known bases; never reconstruct the stored developer path.
        name = raw.replace("\\", "/").rstrip("/").split("/")[-1]
        for base in (registry_mod.REPO_ROOT, registry_mod.REGISTRY_PATH.parent):
            cand = base / name
            if cand.exists():
                return cand.resolve()
        raw = raw.replace("\\", "/")  # normalized below
    p = Path(raw)
    if p.is_absolute():
        return p
    for base in (registry_mod.REPO_ROOT, registry_mod.REGISTRY_PATH.parent):
        cand = base / p
        if cand.exists():
            return cand.resolve()
    # Absent artifact: repo-root-anchored ABSOLUTE path — honest missing-file
    # semantics on every OS (Path.is_absolute() is always True here).
    return (registry_mod.REPO_ROOT / p).resolve()


def predict_with_model(model_id: str, feature_row: dict, version: str | None = None) -> dict:
    entry = registry_mod.get(model_id, version)
    registry_mod.check_compatible(entry, entry["feature_schema_version"])
    artifact = artifact_path(entry)
    actual = registry_mod.sha256_file(artifact)
    if actual != entry["artifact_sha256"]:
        raise ValueError(f"artifact checksum mismatch for {model_id} — refusing to load")
    bundle = joblib.load(artifact)
    if not isinstance(bundle, dict) or "model" not in bundle:
        raise ValueError(f"unexpected artifact content for {model_id}")
    # None (explicitly-missing input, e.g. elevation) must become NaN so the
    # numeric array holds and training-median imputation below applies —
    # None in an np.array yields object dtype and crashes np.isnan.
    row_vals = [np.nan if feature_row.get(c, np.nan) is None else feature_row.get(c, np.nan)
                for c in bundle.get("features", MODEL_FEATURES)]
    x = np.array([row_vals], dtype=float)
    feature_names = list(bundle.get("features", MODEL_FEATURES))
    medians = np.asarray(bundle.get("medians", np.zeros(len(feature_names))), dtype=float)
    if medians.shape[0] != len(feature_names):
        raise ValueError(f"artifact medians length {medians.shape[0]} != features {len(feature_names)}")
    inds = np.where(np.isnan(x))
    x[inds] = np.take(medians, inds[1])
    if not np.all(np.isfinite(x)):
        raise ValueError("non-finite features after imputation — refusing to predict")
    value = float(bundle["model"].predict(x)[0])
    if not np.isfinite(value):
        raise ValueError("non-finite model output — refusing to serve prediction")
    value = max(0.0, value)  # rainfall cannot be negative
    width = entry.get("horizon_h") or 1
    try:
        intensity = intensity_category(value, int(width))
    except Exception:
        intensity = "UNAVAILABLE"
    return {
        "prediction_mm": value,
        "intensity_category": intensity,
        "intensity_note": "MODEL classes (display only), not official warning categories",
        "horizon_h": entry["horizon_h"], "model_id": entry["model_id"],
        "version": entry["version"], "feature_schema_version": entry["feature_schema_version"],
        "uncertainty": _uncertainty_for(entry, value),
        "source_states": {k: v for k, v in feature_row.items() if k.endswith("_state")},
        "provenance": {"training_dataset_id": entry["training_dataset_id"],
                       "code_commit": entry["code_commit"], "scope": entry.get("scope"),
                       "artifact_sha256": entry.get("artifact_sha256"),
                       "model_id": entry["model_id"], "version": entry["version"]},
    }


_uncertainty_cache: dict[str, dict | None] = {}


def _uncertainty_for(entry: dict, value: float) -> dict:
    """Calibrated 80% residual-quantile interval when its manifest ships
    (data/metadata/uncertainty-<model_id>-<version>.json, committed); honest
    NOT_IMPLEMENTED otherwise. Never a confidence percentage."""
    key = f"{entry['model_id']}-{entry['version']}"
    if key not in _uncertainty_cache:
        _uncertainty_cache[key] = None
        try:
            manifest_path = (registry_mod.REPO_ROOT / "data" / "metadata"
                             / f"uncertainty-{key}.json")
            if manifest_path.exists():
                _uncertainty_cache[key] = json.loads(manifest_path.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001 — corrupt manifest must not break inference
            _uncertainty_cache[key] = None
    manifest = _uncertainty_cache[key]
    if not manifest:
        return {"status": "NOT_IMPLEMENTED"}
    lo = max(0.0, value + float(manifest["residual_lo_q"]))
    hi = max(0.0, value + float(manifest["residual_hi_q"]))
    return {"status": "CALIBRATED",
            "method": manifest.get("method", "residual-quantile"),
            "level": manifest.get("level", 0.80),
            "interval_mm": [lo, hi],
            "coverage_test": manifest.get("coverage_test"),
            "n_test": manifest.get("n_test"),
            "validation_period": manifest.get("validation_period"),
            "note": manifest.get("note")}


def model_status() -> dict:
    models = registry_mod.list_models()
    rainfall = [m for m in models if m["model_id"].startswith("rainfall-")]
    if not rainfall:
        return {"trained": False, "status": "NOT_TRAINED",
                "reason": "no rainfall model registered — train via scripts/train_rainfall.py",
                "uncertainty": {"status": "NOT_IMPLEMENTED"}}
    # Registry entries ≠ deployed artifacts: container images ship the registry
    # only (artifacts come via releases/storage). Report availability honestly —
    # trained=true documents the registry, predict_ready=false means inference
    # is NOT operational in this environment until artifacts are provided.
    available = sum(1 for m in rainfall if artifact_path(m).exists())
    if available == len(rainfall):
        note = "all registered artifacts present — every horizon serves live predictions"
    else:
        # Name exactly which bundles serve and which stay GATED — a partial
        # deployment must never be described as "predict returns 502" when the
        # deployed horizons demonstrably serve (verified live in production).
        served = [m["model_id"] for m in rainfall if artifact_path(m).exists()]
        gated = [m["model_id"] for m in rainfall if not artifact_path(m).exists()]
        parts = []
        if served:
            parts.append("serving live predictions: " + ", ".join(served))
        parts.append(("artifacts not deployed in this environment (GATED, honest 503 — no fabrication): "
                      if not served else "not deployed in this environment (GATED, honest 503 — no fabrication): ")
                     + ", ".join(gated))
        note = f"{available}/{len(rainfall)} registered artifacts deployed: " + "; ".join(parts)
    return {"trained": True, "count": len(rainfall),
            "artifacts_available": available,
            "predict_ready": available == len(rainfall),
            "artifacts_available_note": note,
            "models": [{"model_id": m["model_id"], "version": m["version"],
                        "horizon_h": m["horizon_h"]} for m in rainfall]}
