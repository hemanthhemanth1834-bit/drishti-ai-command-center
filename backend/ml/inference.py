"""Inference registry: loads trained artifacts or serves labeled DEMO fallback."""
from __future__ import annotations

import json
import os
import uuid
from collections import deque
from datetime import timezone, datetime
from pathlib import Path
from threading import Lock
from typing import Dict, List, Optional

from .features import defaults_for_location, to_vector
from .schemas import FEATURE_ORDER, LandslideFeatures, PredictResponse

MODEL_DIR = Path(os.getenv("ML_MODEL_DIR", Path(__file__).parent / "artifacts"))

LEVELS = [(0.75, "CRITICAL"), (0.5, "HIGH"), (0.25, "MODERATE"), (0.0, "LOW")]


def level_for(p: float) -> str:
    for thresh, name in LEVELS:
        if p >= thresh:
            return name
    return "LOW"


class NotTrained(Exception):
    pass


class ModelRegistry:
    def __init__(self, model_dir: Path = MODEL_DIR):
        self.model_dir = model_dir
        self._model = None
        self._metrics: Optional[dict] = None
        self._version: str = "untrained"
        self._lock = Lock()
        self._recent: deque = deque(maxlen=200)  # recent input vectors (drift)
        self._store: Dict[str, dict] = {}  # prediction_id -> record
        self.reload()

    def reload(self) -> None:
        try:
            import joblib
            model_path = self.model_dir / "model.joblib"
            metrics_path = self.model_dir / "metrics.json"
            if model_path.exists() and metrics_path.exists():
                self._model = joblib.load(model_path)
                self._metrics = json.loads(metrics_path.read_text())
                self._version = str(self._metrics.get("model_name", "Landslide-RF-v1"))
                return
        except Exception:
            pass
        self._model = None
        self._metrics = None
        self._version = "untrained"

    @property
    def trained(self) -> bool:
        return self._model is not None

    @property
    def version(self) -> str:
        return self._version

    @property
    def metrics(self) -> Optional[dict]:
        return self._metrics

    def _contributions(self, vector: List[float]) -> List[dict]:
        importances = None
        if self._metrics and "feature_importance" in self._metrics:
            importances = [float(self._metrics["feature_importance"].get(f, 0.0))
                           for f in FEATURE_ORDER]
        else:  # transparent demo weights (documented, labeled)
            importances = [0.0] * len(FEATURE_ORDER)
            for f, w in {"rainfall_24h": .2, "soil_moisture": .18,
                         "slope": .15, "satellite_change": .1,
                         "historical_landslide_frequency": .08}.items():
                importances[FEATURE_ORDER.index(f)] = w
        rng_vals = {
            "rainfall_24h": 300, "soil_moisture": 100, "slope": 60,
            "satellite_change": 40, "elevation": 3000,
        }
        raw = []
        for f, v, w in zip(FEATURE_ORDER, vector, importances):
            norm = min(1.0, abs(v) / rng_vals.get(f, max(abs(v), 1.0)))
            raw.append(norm * w)
        total = sum(raw) or 1.0
        return [{"feature": f, "contribution_pct": round(v / total * 100, 1),
                 "value": vector[i]}
                for i, (f, v) in enumerate(zip(FEATURE_ORDER, raw))]

    def predict(self, lat: float, lon: float,
                features: Optional[LandslideFeatures]) -> PredictResponse:
        base = defaults_for_location(lat, lon)
        if features:
            base.update(features.model_dump(exclude_none=True))
        vector = to_vector(base)
        with self._lock:
            self._recent.append(vector)
        if self.trained:
            try:
                import pandas as pd
                frame = pd.DataFrame([vector], columns=FEATURE_ORDER)
                proba = float(self._model.predict_proba(frame)[0][1])
            except Exception:
                proba = float(self._model.predict_proba([vector])[0][1])
            simulated = False
            status = "MODEL"
            version = self._version
        else:
            # Transparent heuristic — same drivers as demo generator, LABELED.
            r = base["rainfall_24h"] / 300.0
            s = base["soil_moisture"] / 100.0
            sl = base["slope"] / 60.0
            proba = max(0.01, min(0.99, 0.06 + 0.5 * r + 0.25 * s + 0.2 * sl))
            simulated = True
            status = "DEMO"
            version = "DemoHeuristic-v0"
        level = level_for(proba)
        contribs = sorted(self._contributions(vector),
                          key=lambda c: c["contribution_pct"], reverse=True)
        top = {c["feature"]: f"{c['contribution_pct']}% (value {c['value']})"
               for c in contribs[:4]}
        pid = "pred-" + uuid.uuid4().hex[:10]
        resp = PredictResponse(
            prediction_id=pid,
            location={"latitude": lat, "longitude": lon},
            landslide_probability=round(proba, 4),
            risk_level=level,
            confidence=int(round(max(proba, 1 - proba) * 100)),
            model_version=version,
            timestamp=PredictResponse.now(),
            factors={
                "rainfall": top.get("rainfall_24h", "-"),
                "soil_moisture": top.get("soil_moisture", "-"),
                "slope": top.get("slope", "-"),
                "historical_risk": top.get("historical_landslide_frequency", "-"),
            },
            contributions=[{**c} for c in contribs[:8]],
            simulated=simulated,
            data_status=status,
        )
        with self._lock:
            self._store[pid] = {"response": resp.model_dump(), "vector": vector,
                                "features": base}
            if len(self._store) > 500:
                self._store.pop(next(iter(self._store)))
        return resp

    def explain(self, prediction_id: str) -> Optional[dict]:
        with self._lock:
            return self._store.get(prediction_id)

    def recent_vectors(self) -> List[List[float]]:
        with self._lock:
            return list(self._recent)


REGISTRY = ModelRegistry()
