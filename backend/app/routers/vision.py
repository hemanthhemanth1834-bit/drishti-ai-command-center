"""AI image analysis abstraction: classification + confidence + severity hint.

Decision support ONLY — never auto-confirms an incident. Without a
production vision model, `demo_classify` uses filename/size heuristics and
is labeled DEMO. Swap `classify()` for a YOLO/open-vocab model later
without changing the API, UI, or incident flow.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile
from pydantic import BaseModel

from ..services.security import require_perm, validate_upload

router = APIRouter(prefix="/api/v1/vision", tags=["vision"])

LABELS = ["crack", "slope_movement", "landslide", "road_blockage", "flood",
          "vegetation_disturbance", "no_hazard_visible"]


def demo_classify(filename: str, size_bytes: int = 0) -> dict:
    """Transparent filename-heuristic stand-in (DEMO). Not a model."""
    name = filename.lower()
    for label in LABELS:
        key = label.split("_")[0]
        if key in name and label != "no_hazard_visible":
            return {"label": label, "confidence": 62,
                    "severity_hint": "moderate",
                    "simulated": True, "model": "DemoHeuristic-v0"}
    conf = 40 + (size_bytes % 30)
    return {"label": "no_hazard_visible", "confidence": min(conf, 69),
            "severity_hint": "low", "simulated": True,
            "model": "DemoHeuristic-v0"}


class ClassifyResult(BaseModel):
    label: str
    confidence: int
    severity_hint: str
    simulated: bool
    model: str
    verification_required: bool = True


@router.get("/labels")
def labels():
    return {"labels": LABELS,
            "note": "Decision support — human verification always required."}


@router.post("/classify")
async def classify(file: UploadFile = File(...),
                   ident=Depends(require_perm("report"))):
    _ = ident
    content = await file.read()
    validate_upload(file.filename or "photo.jpg", len(content))
    out = demo_classify(file.filename or "photo.jpg", len(content))
    out["verification_required"] = True
    return out
