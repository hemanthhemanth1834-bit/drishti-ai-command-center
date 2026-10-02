"""Impact routes (Step 15). Served timeseries + on-demand analysis of stored runs.
Population/vulnerability/economic-loss/casualties: UNAVAILABLE, never estimated.
"""

import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from app.services.processing import impact as I  # noqa: E402

router = APIRouter()
REPO = Path(__file__).resolve().parents[3]
RUN_DIR = REPO / "data" / "processed" / "impact-sep2024-testroi"


class AnalyzeRequest(BaseModel):
    scenario_id: str = "sep2024-testroi"
    step: int = 167


@router.get("/status")
def impact_status() -> dict:
    import json

    meta = REPO / "data" / "metadata" / "impact-sep2024-testroi_manifest.json"
    return {"scope": "TEST ROI", "computed": meta.exists(),
            "contract": I.IMPACT_CONTRACT_VERSION,
            "unavailable": ["population", "vulnerability", "economic_loss", "casualties"],
            "manifest": json.loads(meta.read_text()) if meta.exists() else None}


@router.get("/layers")
def impact_layers() -> dict:
    return {"crs": "EPSG:4326", "contract": I.IMPACT_CONTRACT_VERSION,
            "layers": ["affected-buildings", "affected-roads", "facilities",
                       "depth-bands", "flooded-area"],
            "note": "layers materialize per-frame via /timeseries or /analyze"}


@router.get("/summary")
def impact_summary() -> dict:
    import json

    meta = REPO / "data" / "metadata" / "impact-sep2024-testroi_manifest.json"
    if not meta.exists():
        raise HTTPException(status_code=503, detail={"status": "INSUFFICIENT_DATA",
                                                     "reason": "run scripts/compute_impact.py"})
    return json.loads(meta.read_text(encoding="utf-8"))


@router.get("/timeseries")
def impact_timeseries() -> dict:
    import json

    ts = RUN_DIR / "impact_timeseries.json"
    if not ts.exists():
        raise HTTPException(status_code=503, detail={"status": "INSUFFICIENT_DATA",
                                                     "reason": "run scripts/compute_impact.py"})
    return json.loads(ts.read_text(encoding="utf-8"))


@router.post("/analyze")
def impact_analyze(req: AnalyzeRequest) -> dict:
    import json

    import numpy as np

    if "/" in req.scenario_id or "\\" in req.scenario_id or ".." in req.scenario_id:
        raise HTTPException(status_code=422, detail="invalid scenario_id")
    rundir = REPO / "data" / "processed" / f"inundation-scenario-{req.scenario_id}"
    frame = rundir / "full" / f"full_{req.step:04d}.npy"
    if not frame.exists():
        raise HTTPException(status_code=404, detail={"status": "FRAME_UNAVAILABLE",
                                                     "reason": "full frame not stored for this step"})
    depth = np.load(frame)
    west, south, east, north = 76.9921875, 28.22697003891833, 77.51953125, 28.844673680771795
    H, W = depth.shape
    flooded = depth > 0.05
    return {"scenario_id": req.scenario_id, "step": req.step,
            "contract": I.IMPACT_CONTRACT_VERSION,
            "flooded_cells": int(flooded.sum()),
            "flooded_area_m2": round(float(flooded.sum()) * ((east - west) / W * 111000)
                                     * ((north - south) / H * 111000), 1),
            "max_depth_m": round(float(depth.max()), 3),
            "extent": [west, south, east, north], "crs": "EPSG:4326",
            "population": "UNAVAILABLE", "vulnerability": "UNAVAILABLE",
            "economic_loss": "UNAVAILABLE", "casualties": "UNAVAILABLE"}
