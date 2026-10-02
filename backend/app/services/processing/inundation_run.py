"""Inundation runners (Step 8). Historical replay (HISTORICAL) + forecast mode
(FORECAST) over the TEST-ROI terrain. Rainfall→terrain mapping is explicit
DERIVED disaggregation (bilinear from ROI points or uniform fallback) — no new
rainfall information is implied. Water-level assimilation: UNAVAILABLE
(no verified gauge feed); documented fallback = no assimilation.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np

from app.services.processing import inundation as eng
from app.services.processing.terrain import cell_sizes_m

WATER_LEVEL_SOURCE = "UNAVAILABLE"

def _downsample(grid: np.ndarray, max_h: int = 120, max_w: int = 160) -> np.ndarray:
    """Block-mean downsample for scenario frames (documented reduction; the
    full-resolution grid remains the product of record)."""
    H, W = grid.shape
    bh, bw = max(1, H // max_h), max(1, W // max_w)
    h, w = H // bh, W // bw
    return grid[:h * bh, :w * bw].reshape(h, bh, w, bw).mean(axis=(1, 3))


def load_terrain(processed_dir: str) -> dict:
    from pathlib import Path
    d = Path(processed_dir)
    elevation = np.load(d / "elevation.npy")
    direction = np.load(d / "flow_direction.npy")
    manifest = __import__("json").loads((d / "manifest.json").read_text())
    H, W = elevation.shape
    west, south, east, north = manifest["spatial_extent"]
    lats = np.linspace(north - (north - south) / H / 2, south + (north - south) / H / 2, H)
    lons = np.linspace(west + (east - west) / W / 2, east - (east - west) / W / 2, W)
    dx, dy = cell_sizes_m(lats, (east - west) / W, (north - south) / H)
    area = (dx[:, None] * dy)
    area = np.broadcast_to(area, (H, W)).copy()
    return {"elevation": elevation, "direction": direction, "lats": lats, "lons": lons,
            "cell_area_m2": area, "extent": [west, south, east, north],
            "manifest": manifest}


def bilinear_weights(points: list[tuple[float, float]], lons: np.ndarray,
                     lats: np.ndarray) -> np.ndarray:
    """Weights (H,W,P) from P ROI points → terrain cells (inverse-distance,
    normalized; deterministic). Uniform fallback if a point is missing."""
    H, W = len(lats), len(lons)
    LON, LAT = np.meshgrid(lons, lats)
    w = np.zeros((H, W, len(points)))
    for k, (plat, plon) in enumerate(points):
        dist2 = (LON - plon) ** 2 + (LAT - plat) ** 2 + 1e-12
        w[:, :, k] = 1.0 / dist2
    w /= w.sum(axis=2, keepdims=True)
    return w


def disaggregate(hourly_by_point: list[np.ndarray], weights: np.ndarray) -> np.ndarray:
    """(T,P) point series → (T,H,W) terrain fields. Marked DERIVED by callers."""
    T = hourly_by_point[0].shape[0] if isinstance(hourly_by_point, list) else hourly_by_point.shape[1]
    P = np.column_stack(hourly_by_point)  # (T,P)
    H, W, _ = weights.shape
    return np.tensordot(P, weights, axes=([1], [2]))  # (T,H,W)


def run(rain_m_per_step: np.ndarray, terrain: dict, params: eng.HydroParams,
        rainfall_source: str, mode: str, log_every: int = 0,
        inject_per_step: list[dict[int, float]] | None = None,
        snapshot_every: int = 0, snapshot_dir=None, full_every: int = 0) -> dict:
    """Core loop. rain_m_per_step: (T,H,W) metres/hour. inject_per_step: optional
    upstream inflow volumes per step (Step 10). snapshot_every=N stores a
    downsampled depth grid every N steps (Step-14 scenario frames; default off).
    full_every=M stores FULL-resolution depth grids every M steps (Step-15
    impact; default off; large — git-ignored, local only).
    Returns outputs + manifest data."""
    H, W = terrain["elevation"].shape
    state = eng.build_routing(terrain["direction"], terrain["cell_area_m2"])
    steps = []
    snapshots = []
    for t in range(rain_m_per_step.shape[0]):
        inj = inject_per_step[t] if inject_per_step else None
        diag = eng.step(state, rain_m_per_step[t], params, inject_m3=inj)
        steps.append({"step": t, **diag})
        if diag["balance"] != "OK":
            steps[-1]["warning"] = "WATER_BALANCE_WARNING (reported, not ignored)"
        if log_every and (t + 1) % log_every == 0:
            print(f"inundation step {t + 1}/{rain_m_per_step.shape[0]}", flush=True)
        if snapshot_every and (t + 1) % snapshot_every == 0 and snapshot_dir is not None:
            depth_t = (state.storage_m3 / terrain["cell_area_m2"].ravel()).reshape(H, W)
            small = _downsample(depth_t, max_h=120, max_w=160)
            fn = f"frame_{t:04d}.npy"
            np.save(Path(snapshot_dir) / fn, small.astype(np.float32))
            snapshots.append({"step": t, "file": fn, "shape": list(small.shape),
                              "max_depth_m": float(small.max()),
                              "flooded_frac": float((small > eng.MODEL_INUNDATION_THRESHOLD_M).mean())})
        if full_every and (t + 1) % full_every == 0 and snapshot_dir is not None:
            depth_t = (state.storage_m3 / terrain["cell_area_m2"].ravel()).reshape(H, W)
            full_dir = Path(snapshot_dir) / "full"
            full_dir.mkdir(exist_ok=True)
            np.save(full_dir / f"full_{t:04d}.npy", depth_t.astype(np.float32))
    depth = (state.storage_m3 / terrain["cell_area_m2"].ravel()).reshape(H, W)
    flooded = depth > eng.MODEL_INUNDATION_THRESHOLD_M
    classes = np.full((H, W), "NO_INUNDATION", dtype=object)
    for name, lo in eng.DEPTH_CLASSES[1:]:
        classes[depth >= lo] = name
    uniq, counts = np.unique(classes, return_counts=True)
    out: dict = {"mode": mode, "rainfall_source": rainfall_source,
            "terrain_source": "terrarium (conditioned DEM used; original preserved)",
            "drainage_source": "OSM_OBSERVED + DEM_DERIVED",
            "water_level_source": WATER_LEVEL_SOURCE,
            "watershed": "NOT_CONFIGURED",
            "parameter_state": "ASSUMED (NOT_CALIBRATED)",
            "model_id": eng.MODEL_ID, "model_version": eng.MODEL_VERSION,
            "steps": steps,
            "final": {"max_depth_m": float(depth.max()),
                      "mean_depth_m": float(depth.mean()),
                      "flooded_frac": float(flooded.mean()),
                      "flooded_cells": int(flooded.sum()),
                      "classes": {str(k): int(v) for k, v in zip(uniq, counts)}},
            "depth": depth, "inundated": flooded,
            "snapshots": snapshots,
            "uncertainty_status": "NOT_IMPLEMENTED",
            "parameter_uncertainty_status": "NOT_IMPLEMENTED (assumptions dominate)",
            "validation_status": "PENDING_STEP_9",
            "calibration_status": "NOT_CALIBRATED"}
    return out


def prepare_replay_inputs(repo_root: str | Path, start: str, end: str,
                          points: list[tuple[str, float, float]]):
    """Fetch archive rain + terrain + disaggregation weights. Shared by replay,
    validation, and upstream modes (no duplicate fetch logic)."""
    from app.core.cache import FileCache
    from app.services.providers.openmeteo import OpenMeteoProvider

    repo_root = Path(repo_root)
    cache = FileCache(repo_root / "data" / ".cache")
    prov = OpenMeteoProvider(cache=cache)
    series, stamps = [], None
    for _, lat, lon in points:
        fetch = prov.fetch_historical(lat, lon, start, end, region_id="TEST-ROI")
        by_time = {o["timestamp"]: (o["value"] or 0.0) for o in fetch["observations"]
                   if o["variable"] == "precipitation"}
        order = sorted(by_time)
        stamps = order if stamps is None else stamps
        series.append(np.array([by_time[t] for t in stamps]))
    terrain = load_terrain(repo_root / "data" / "processed" / "terrain_testroi")
    weights = bilinear_weights([(lat, lon) for _, lat, lon in points],
                               terrain["lons"], terrain["lats"])
    rain = disaggregate(series, weights) / 1000.0
    return stamps, rain, terrain


def execute_replay(repo_root: str | Path, start: str, end: str,
                   points: list[tuple[str, float, float]]) -> tuple[dict, str]:
    """Full replay: fetch archive → disaggregate → run. Returns (result, ds_id)."""
    stamps, rain, terrain = prepare_replay_inputs(repo_root, start, end, points)
    result = run(rain, terrain, eng.HydroParams(), rainfall_source="OBSERVED",
                 mode="HISTORICAL", log_every=24)
    result["timestamps"] = [str(s) for s in stamps]
    result["disaggregation"] = "bilinear-from-ROI-points (DERIVED; no new information)"
    return result, f"inundation-replay-{start.replace('-', '')}-{end.replace('-', '')}"


def execute_forecast(repo_root: str | Path, lat: float, lon: float,
                     hours: int = 6) -> tuple[dict, str]:
    """Forecast mode: live key-free rainfall → uniform DERIVED field → run."""
    from app.core.cache import FileCache
    from app.services.providers.openmeteo import OpenMeteoProvider

    repo_root = Path(repo_root)
    if hours not in (1, 3, 6):
        raise ValueError("hours must be one of 1, 3, 6")
    prov = OpenMeteoProvider(cache=FileCache(repo_root / "data" / ".cache"))
    fetch = prov.fetch_latest(lat, lon)
    by_time = {o["timestamp"]: (o["value"] or 0.0) for o in fetch["observations"]
               if o["variable"] == "precipitation"}
    order = sorted(by_time)[:hours]
    if len(order) < hours:
        raise ValueError("live forecast gap — refusing gap-filled inundation")
    terrain = load_terrain(repo_root / "data" / "processed" / "terrain_testroi")
    H, W = terrain["elevation"].shape
    uni = np.array([by_time[t] for t in order]) / 1000.0
    rain = np.broadcast_to(uni[:, None, None], (len(order), H, W)).copy()
    result = run(rain, terrain, eng.HydroParams(), rainfall_source="FORECAST",
                 mode="FORECAST")
    result["timestamps"] = order
    result["disaggregation"] = "uniform-from-centroid (DERIVED; no new information)"
    return result, "inundation-forecast-live"


def persist(repo_root: str | Path, ds_id: str, result: dict) -> dict:
    """Persist products + manifests (data/processed git-ignored; summary committed)."""
    import json

    from app.services.processing.pipeline import PipelineRun

    repo_root = Path(repo_root)
    run = PipelineRun(ds_id, processed_root=repo_root / "data" / "processed")
    depth = result.pop("depth")
    inundated = result.pop("inundated")
    np.save(run.root / "depth_m.npy", depth.astype(np.float32))
    np.save(run.root / "inundated.npy", inundated)
    out = run.write_output("summary.json", {k: v for k, v in result.items() if k != "steps"})
    run.write_output("steps.json", {"steps": result["steps"]})
    manifest = run.write_manifest(
        source="open-meteo + terrarium + D8-routing", product=f"{eng.MODEL_ID}-{eng.MODEL_VERSION}",
        time_range={"mode": result["mode"],
                    "timestamps": result["timestamps"][:1] + result["timestamps"][-1:]},
        spatial_extent=load_terrain(repo_root / "data" / "processed" / "terrain_testroi")["extent"],
        crs="EPSG:4326", resolution="~38m terrain / hourly",
        variables={"water_depth": {"unit": "m"}, "inundated": {"unit": "bool"},
                   "depth_class": {"unit": "MODEL_DEPTH_CLASSES"}},
        quality_summary={"balance": [s["balance"] for s in result["steps"]],
                         "max_depth_m": result["final"]["max_depth_m"],
                         "flooded_frac": result["final"]["flooded_frac"]},
        outputs=[out.name, "depth_m.npy", "inundated.npy", "steps.json"],
        config={"params": {"runoff_coeff": 0.55, "initial_abstraction_mm": 2.0,
                           "tau_hours": 3.0, "infil_mm_per_h": 1.0,
                           "param_state": "ASSUMED"}})
    summary = {"dataset_id": ds_id, "scope": "TEST ROI (not pilot, not national)",
               "final": result["final"], "mode": result["mode"],
               "validation_status": "PENDING_STEP_9", "calibration_status": "NOT_CALIBRATED"}
    (repo_root / "data" / "metadata" / f"{ds_id}_manifest.json").write_text(
        json.dumps(summary, indent=2), encoding="utf-8")
    return {"summary": summary, "manifest": manifest, "run_dir": str(run.root)}
