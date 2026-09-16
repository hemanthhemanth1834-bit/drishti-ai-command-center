"""ML inference API — real model when trained, labeled DEMO fallback otherwise."""
from __future__ import annotations

import sys
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from ml.inference import REGISTRY  # noqa: E402
from ml.monitoring import health as model_health  # noqa: E402
from ml.schemas import (BatchPredictRequest, FEATURE_ORDER,  # noqa: E402
                        PredictRequest)

from ..db import SessionLocal
from ..models import platform as m
from ..services.security import rate_limit, require_perm

router = APIRouter(prefix="/api/v1/ml", tags=["ml"])


def _persist(resp) -> None:
    try:
        db = SessionLocal()
        db.add(m.Prediction(id=resp.prediction_id, lat=resp.location.latitude,
                            lon=resp.location.longitude,
                            probability=resp.landslide_probability,
                            risk_level=resp.risk_level,
                            model_version=resp.model_version,
                            simulated=resp.simulated))
        db.commit()
        db.close()
    except Exception:
        pass  # inference must survive DB outages


@router.post("/predict")
def predict(req: PredictRequest,
            _=Depends(rate_limit(120))):
    import time
    t0 = time.perf_counter()
    resp = REGISTRY.predict(req.location.latitude, req.location.longitude,
                            req.features)
    try:
        from .ops import record_inference_ms
        record_inference_ms((time.perf_counter() - t0) * 1000)
    except Exception:
        pass
    _persist(resp)
    return resp.model_dump()


@router.post("/batch-predict")
def batch_predict(req: BatchPredictRequest,
                  ident=Depends(require_perm("read"))):
    _ = ident
    out = []
    for item in req.items:
        resp = REGISTRY.predict(item.location.latitude,
                                item.location.longitude, item.features)
        _persist(resp)
        out.append(resp.model_dump())
    return {"count": len(out), "predictions": out}


@router.get("/model")
def model_info():
    metrics = REGISTRY.metrics
    if not REGISTRY.trained or not metrics:
        return {"model_version": "untrained", "status": "NOT_TRAINED",
                "note": "Run: cd backend && python -m ml.train"}
    return {"model_version": REGISTRY.version, "status": "READY",
            "trained_at": metrics.get("trained_at"),
            "data_kind": metrics.get("data_kind"),
            "features": FEATURE_ORDER}


@router.get("/health")
def health():
    return model_health(REGISTRY)


@router.get("/features")
def features():
    return {"features": FEATURE_ORDER, "count": len(FEATURE_ORDER)}


@router.get("/explain/{prediction_id}")
def explain(prediction_id: str):
    rec = REGISTRY.explain(prediction_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Unknown prediction_id")
    resp = rec["response"]
    return {
        "prediction_id": prediction_id,
        "why": "Contributions are normalized (feature value x model importance). "
               "Estimates for decision support — requires field verification.",
        "risk_level": resp["risk_level"],
        "probability": resp["landslide_probability"],
        "model_version": resp["model_version"],
        "simulated": resp["simulated"],
        "contributions": resp["contributions"],
        "factors": resp["factors"],
    }
