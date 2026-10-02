"""Inundation routes (Step 8). HISTORICAL replay + FORECAST runs with explicit
modes; structured UNAVAILABLE when inputs are missing. Never fake flood maps.
"""

import re
import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from app.services.processing import inundation as eng  # noqa: E402
from app.services.processing import inundation_run as runner  # noqa: E402
from ml.registry import registry as registry_mod  # noqa: E402

router = APIRouter()
REPO = Path(__file__).resolve().parents[3]
POINTS = [("delhi_nw", 28.75, 77.00), ("delhi_ne", 28.75, 77.25),
          ("delhi_sw", 28.50, 77.00), ("delhi_se", 28.50, 77.25)]
# TEST-ROI grid extent (0.55° × 0.62°) and the documented ~0.1° /grid
# aggregation (6×6 cells across the extent — the served contract the UI maps).
GRID_EXTENT = (76.9921875, 28.22697003891833, 77.51953125, 28.844673680771795)
GRID_DIVISIONS = 6
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MAX_REPLAY_DAYS = 400


@router.get("/status")
def inundation_status() -> dict:
    models = [m for m in registry_mod.list_models() if m.get("model_type") == "INUNDATION"]
    return {"scope": "TEST ROI", "trained": bool(models),
            "model": f"{eng.MODEL_ID}-{eng.MODEL_VERSION}",
            "algorithm": "runoff-coefficient + D8 storage routing (deterministic, NOT ML)",
            "modes": ["HISTORICAL replay", "FORECAST"],
            "validation_status": "PENDING_STEP_9", "calibration_status": "NOT_CALIBRATED",
            "water_level_source": runner.WATER_LEVEL_SOURCE,
            "watershed": "NOT_CONFIGURED",
            "uncertainty_status": "NOT_IMPLEMENTED"}


@router.get("/models")
def inundation_models() -> dict:
    return {"models": [{k: m.get(k) for k in
                        ("model_id", "version", "model_type", "algorithm", "target",
                         "scope", "validation_status", "created_at")}
                       for m in registry_mod.list_models() if m.get("model_type") == "INUNDATION"]}


@router.post("/run")
def inundation_run(mode: str = Query("replay"),
                   start: str = Query("2024-09-10"), end: str = Query("2024-09-16"),
                   hours: int = Query(6)) -> dict:
    # Validate BEFORE any engine work: unbounded/malformed ranges are 422s,
    # not accidental multi-week Open-Meteo fetches (root cause: free-form str
    # params were passed straight to the archive API and the routing engine).
    if mode not in ("replay", "forecast"):
        raise HTTPException(status_code=422, detail="mode must be replay or forecast")
    if not _DATE_RE.match(start) or not _DATE_RE.match(end):
        raise HTTPException(status_code=422, detail="start/end must be YYYY-MM-DD")
    from datetime import date

    try:
        d0, d1 = date.fromisoformat(start), date.fromisoformat(end)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"invalid date: {exc}") from exc
    if d0 > d1:
        raise HTTPException(status_code=422, detail="start must be on or before end")
    if (d1 - d0).days > MAX_REPLAY_DAYS:
        raise HTTPException(status_code=422,
                            detail=f"range exceeds {MAX_REPLAY_DAYS} days — refine the window")
    try:
        if mode == "replay":
            result, ds_id = runner.execute_replay(REPO, start, end, POINTS)
        else:
            result, ds_id = runner.execute_forecast(REPO, 28.61, 77.20, hours)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"inundation unavailable: {exc}") from exc
    saved = runner.persist(REPO, f"{ds_id}-api", result)
    return {"inundation_status": "READY", **saved["summary"]}


@router.post("/predict")
def inundation_predict(hours: int = Query(6)) -> dict:
    """Multi-horizon forecast: live rainfall → runoff → mask per horizon.

    Horizons 1/3/6 only (hourly inputs; 15-min unsupported). Each horizon runs
    the engine on its window; quality is DEGRADED while drainage validation is
    weak (stated, not hidden).
    """
    if hours not in (1, 3, 6):
        raise HTTPException(status_code=422, detail="hours must be one of 1, 3, 6")
    try:
        result, ds_id = runner.execute_forecast(REPO, 28.61, 77.20, hours)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=503, detail={"inundation_status": "INSUFFICIENT_DATA",
                                                     "reason": str(exc)[:200]}) from exc
    final = result["final"]
    state = eng.inundation_state(final["flooded_frac"])
    quality = eng.assess_quality()
    return {"inundation_status": "READY", "inundation_state": state,
            "horizon_h": hours, "mode": "FORECAST", "rainfall_source": "FORECAST",
            "model_id": eng.MODEL_ID, "version": eng.MODEL_VERSION,
            "extent": {"flooded_cells": final["flooded_cells"],
                       "flooded_frac": final["flooded_frac"],
                       "max_depth_m": final["max_depth_m"],
                       "classes": final["classes"]},
            "depth_status": "MODELLED DEPTH PROXY (uncalibrated)",
            "quality": quality, "uncertainty_status": "NOT_IMPLEMENTED",
            "timestamps": result["timestamps"],
            "provenance": {"training_dataset_id": ds_id, "scope": "TEST ROI"}}


@router.get("/latest")
def inundation_latest() -> dict:
    """Latest completed run summary, or structured UNAVAILABLE."""
    import json

    cands = sorted((REPO / "data" / "processed").glob("inundation-*/summary.json"))
    if not cands:
        raise HTTPException(status_code=503, detail={"inundation_status": "UNAVAILABLE",
                                                     "reason": "no completed run — POST /api/v1/inundation/run"})
    return {"inundation_status": "READY", "run": cands[-1].parent.name,
            **json.loads(cands[-1].read_text(encoding="utf-8"))}


@router.get("/summary")
def inundation_summary() -> dict:
    """Run metadata + extent statistics + quality for the latest run."""
    latest = inundation_latest()
    if latest.get("inundation_status") != "READY":
        return latest
    final = latest.get("final", {})
    return {"run": latest["run"], "mode": latest.get("mode"),
            "model_id": eng.MODEL_ID, "version": eng.MODEL_VERSION,
            "extent": {"flooded_cells": final.get("flooded_cells"),
                       "flooded_frac": final.get("flooded_frac"),
                       "max_depth_m": final.get("max_depth_m"),
                       "classes": final.get("classes", {})},
            "inundation_state": eng.inundation_state(final.get("flooded_frac", 0.0)),
            "quality": eng.assess_quality(),
            "uncertainty_status": "NOT_IMPLEMENTED",
            "validation_status": "PENDING_STEP_9"}


@router.get("/replay")
def inundation_replay() -> dict:
    """Committed HISTORICAL replay grid (Sep-2024 TEST ROI): genuine engine
    output aggregated offline to the served grid format (see
    scripts/build_replay_grid.py). Served when no live run exists in the
    container. Always labelled HISTORICAL/MODELLED — never live."""
    import json

    meta = REPO / "data" / "metadata" / "inundation-replay-grid.json"
    if not meta.exists():
        raise HTTPException(status_code=503, detail={"inundation_status": "UNAVAILABLE",
                                                      "reason": "no replay grid — run scripts/build_replay_grid.py"})
    return json.loads(meta.read_text(encoding="utf-8"))


@router.get("/grid")
def inundation_grid() -> dict:
    """Machine-readable latest-run grid: per-0.1°-cell max depth + flooded frac."""
    import json

    import numpy as np

    cands = sorted((REPO / "data" / "processed").glob("inundation-*/depth_m.npy"))
    if not cands:
        raise HTTPException(status_code=503, detail={"inundation_status": "UNAVAILABLE",
                                                     "reason": "no completed run — POST /api/v1/inundation/run"})
    depth = np.load(cands[-1])
    H, W = depth.shape
    west, south, east, north = GRID_EXTENT
    nc = nr = GRID_DIVISIONS
    cw, ch = W / nc, H / nr
    cells = []
    for iy in range(nr):
        for ix in range(nc):
            r0, r1 = int(iy * ch), int((iy + 1) * ch)
            c0, c1 = int(ix * cw), int((ix + 1) * cw)
            if r1 <= r0 or c1 <= c0:
                continue  # degenerate sliver from rounding — skip, never divide by zero
            block = depth[r0:r1, c0:c1]
            cells.append({"ix": ix, "iy": iy,
                          "center": [west + (c0 + c1) / 2 / W * (east - west),
                                     north - (r0 + r1) / 2 / H * (north - south)],
                          "max_depth_m": float(block.max()),
                          "flooded_frac": float((block > eng.MODEL_INUNDATION_THRESHOLD_M).mean()),
                          "status": "HISTORICAL" if "replay" in cands[-1].parent.name else "FORECAST"})
    return {"run": cands[-1].parent.name, "model_id": eng.MODEL_ID,
            "version": eng.MODEL_VERSION, "threshold_m": eng.MODEL_INUNDATION_THRESHOLD_M,
            "threshold_note": "MODEL_INUNDATION_THRESHOLD (modeling, not official)",
            "cells": cells}


def _scenario_dirs() -> list:
    return sorted((REPO / "data" / "processed").glob("inundation-scenario-*/scenario.json"))


@router.get("/scenarios")
def scenario_list() -> dict:
    import json

    out = []
    for meta in _scenario_dirs():
        full = json.loads(meta.read_text(encoding="utf-8"))
        out.append({"scenario_id": full["scenario_id"], "contract": full.get("contract"),
                    "mode": full.get("mode"), "frame_count": full.get("frame_count")})
    if not out:
        raise HTTPException(status_code=503, detail={"status": "UNAVAILABLE",
                                                     "reason": "no scenarios — run scripts/build_scenario.py"})
    return {"scenarios": out}


@router.get("/scenarios/{scenario_id}")
def scenario_contract(scenario_id: str) -> dict:
    import json

    if ".." in scenario_id or "/" in scenario_id or "\\" in scenario_id:
        raise HTTPException(status_code=422, detail="invalid scenario_id")
    meta = REPO / "data" / "processed" / f"inundation-scenario-{scenario_id}" / "scenario.json"
    if not meta.exists():
        raise HTTPException(status_code=404, detail=f"unknown scenario: {scenario_id}")
    return json.loads(meta.read_text(encoding="utf-8"))


@router.get("/scenarios/{scenario_id}/frames/{step}")
def scenario_frame(scenario_id: str, step: int) -> dict:
    import numpy as np

    if ".." in scenario_id or "/" in scenario_id or "\\" in scenario_id or step < 0 or step > 10000:
        raise HTTPException(status_code=422, detail="invalid scenario_id/step")
    rundir = REPO / "data" / "processed" / f"inundation-scenario-{scenario_id}"
    contract = rundir / "scenario.json"
    if not contract.exists():
        raise HTTPException(status_code=404, detail=f"unknown scenario: {scenario_id}")
    import json
    full = json.loads(contract.read_text(encoding="utf-8"))
    entry = next((f for f in full.get("frames", []) if f["step"] == step), None)
    if entry is None:
        # Gaps render as missing — never interpolated server-side either.
        raise HTTPException(status_code=404, detail={"status": "FRAME_UNAVAILABLE",
                                                     "reason": f"no computed frame at step {step}",
                                                     "available_steps": [f["step"] for f in full.get("frames", [])]})
    grid = np.load(rundir / entry["file"])
    H, W = grid.shape
    west, south, east, north = 76.9921875, 28.22697003891833, 77.51953125, 28.844673680771795
    cells = []
    for iy in range(H):
        for ix in range(W):
            v = float(grid[iy, ix])
            if v > eng.MODEL_INUNDATION_THRESHOLD_M:
                cells.append({"ix": ix, "iy": iy,
                              "center": [west + (ix + 0.5) / W * (east - west),
                                         north - (iy + 0.5) / H * (north - south)],
                              "depth_m": round(v, 3)})
                if len(cells) >= 4000:
                    break
        if len(cells) >= 4000:
            break
    entry = dict(entry)
    entry.update({"cells": cells, "cell_count": len(cells),
                  "truncated": len(cells) >= 4000,
                  "status": full.get("mode", "HISTORICAL")})
    return entry
