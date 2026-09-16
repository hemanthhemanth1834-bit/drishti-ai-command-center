"""Model monitoring: honest health + data-drift (PSI) over recent inputs.

Every metric is either computed from real artifacts/inputs or reported as
NOT AVAILABLE. Nothing is invented.
"""
from __future__ import annotations

from typing import Dict, List, Optional

from .inference import ModelRegistry
from .schemas import FEATURE_ORDER


def _psi(expected: List[float], actual: List[float], bins: int = 8) -> float:
    if not expected or not actual:
        return 0.0
    lo = min(min(expected), min(actual))
    hi = max(max(expected), max(actual))
    if hi <= lo:
        return 0.0
    width = (hi - lo) / bins or 1.0
    psi = 0.0
    n_e, n_a = len(expected), len(actual)
    for b in range(bins):
        e = sum(1 for v in expected if lo + b * width <= v < lo + (b + 1) * width) or 0.5
        a = sum(1 for v in actual if lo + b * width <= v < lo + (b + 1) * width) or 0.5
        e, a = e / n_e, a / n_a
        import math
        psi += (a - e) * math.log(a / e)
    return round(psi, 4)


def health(registry: ModelRegistry) -> Dict:
    m = registry.metrics
    if not registry.trained or not m:
        return {
            "status": "NOT_TRAINED",
            "model_version": "untrained",
            "accuracy": "NOT AVAILABLE",
            "precision": "NOT AVAILABLE",
            "recall": "NOT AVAILABLE",
            "f1": "NOT AVAILABLE",
            "roc_auc": "NOT AVAILABLE",
            "training_samples": "NOT AVAILABLE",
            "validation_samples": "NOT AVAILABLE",
            "last_trained": "NOT AVAILABLE",
            "data_drift_psi": "NOT AVAILABLE",
            "note": "Run: cd backend && python -m ml.train",
        }
    recent = registry.recent_vectors()
    if len(recent) >= 20:
        cols = list(zip(*recent))
        spread = {f: round(float(max(c) - min(c)), 3) for f, c in
                  zip(FEATURE_ORDER[:8], cols)}
        drift: Dict[str, object] = {
            "psi": "NOT AVAILABLE (no stored training baseline)",
            "recent_spread": spread,
            "n_recent": len(recent),
            "note": "Persist training feature quantiles to enable PSI drift.",
        }
    else:
        drift = {"psi": "NOT AVAILABLE",
                 "note": f"Need >=20 recent predictions, have {len(recent)}."}
    return {
        "status": "HEALTHY" if m else "UNKNOWN",
        "model_version": registry.version,
        "accuracy": m.get("accuracy"),
        "precision": m.get("precision"),
        "recall": m.get("recall"),
        "f1": m.get("f1"),
        "roc_auc": m.get("roc_auc"),
        "training_samples": m.get("n_train"),
        "validation_samples": m.get("n_test"),
        "last_trained": m.get("trained_at"),
        "data_kind": m.get("data_kind"),
        "confusion_matrix": m.get("confusion_matrix"),
        "feature_importance": m.get("feature_importance"),
        "data_drift": drift,
    }
