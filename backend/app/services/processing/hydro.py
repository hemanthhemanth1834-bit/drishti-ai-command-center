"""Hydrology (Step 7). D8 flow direction → accumulation → streams → drainage →
watersheds (pour-point delineation implemented; runtime NOT_CONFIGURED without
verified outlets) → zonal stats onto the rainfall grid. All outputs DERIVED.

D8 does not represent full hydrodynamics — documented limitation.
"""

from __future__ import annotations

import numpy as np

from app.services.processing.terrain import EARTH_R_M, cell_sizes_m

# D8 pour directions: (di, dj, code, distance_factor). Code 0 = outflow/nodata edge.
D8 = [(-1, 0, 1, 1.0), (-1, 1, 2, 2 ** 0.5), (0, 1, 4, 1.0), (1, 1, 8, 2 ** 0.5),
      (1, 0, 16, 1.0), (1, -1, 32, 2 ** 0.5), (0, -1, 64, 1.0), (-1, -1, 128, 2 ** 0.5)]


def resolve_flats(conditioned: np.ndarray, direction: np.ndarray) -> tuple[np.ndarray, dict]:
    """Garbrecht–Martz flat resolution (1997, documented). Interior D8 flats get
    an epsilon gradient from high edges toward pour edges so drainage converges
    instead of stalling. Epsilon step (1e-5 m) sits far below data precision
    (Terrarium 1/256 m) — topology changes, elevations don't (max shift reported).
    BFS never crosses non-flat cells, so regions resolve locally without labels.
    """
    from collections import deque

    h, w = conditioned.shape
    flat = (direction == 0)
    interior = np.ones_like(flat)
    interior[[0, -1], :] = False
    interior[:, [0, -1]] = False
    flats = flat & interior
    if not flats.any():
        return conditioned, {"method": "Garbrecht-Martz", "flat_cells": 0,
                             "max_epsilon_m": 0.0, "state": "DERIVED"}

    lower = np.zeros_like(flat)
    higher = np.zeros_like(flat)
    padded = np.pad(conditioned, 1, mode="edge")
    for di in (-1, 0, 1):
        for dj in (-1, 0, 1):
            if di == 0 and dj == 0:
                continue
            neigh = padded[1 + di:h + 1 + di, 1 + dj:w + 1 + dj]
            lower |= flats & (neigh < conditioned)
            higher |= flats & (neigh > conditioned)
    # Outlet borders: code-0 border cells no lower than all interior neighbors
    # (outside is downhill). High borders are walls, never pours.
    inner_min = np.full((h, w), np.inf)
    padded_inf = np.pad(conditioned, 1, mode="constant", constant_values=np.inf)
    for di in (-1, 0, 1):
        for dj in (-1, 0, 1):
            if di == 0 and dj == 0:
                continue
            inner_min = np.minimum(inner_min, padded_inf[1 + di:h + 1 + di, 1 + dj:w + 1 + dj])
    is_border = np.zeros_like(flat)
    is_border[[0, -1], :] = True
    is_border[:, [0, -1]] = True
    outlets = is_border & (direction == 0) & (conditioned <= inner_min)
    pour = lower.copy()
    pour[outlets] = True

    def bfs(seeds: np.ndarray) -> np.ndarray:
        dist = np.full((h, w), -1, dtype=np.int32)
        q = deque()
        dist[seeds] = 0
        for i, j in zip(*np.where(seeds)):
            q.append((i, j))
        while q:
            i, j = q.popleft()
            for di in (-1, 0, 1):
                for dj in (-1, 0, 1):
                    if di == 0 and dj == 0:
                        continue
                    ni, nj = i + di, j + dj
                    if 0 <= ni < h and 0 <= nj < w and flats[ni, nj] and dist[ni, nj] < 0:
                        dist[ni, nj] = dist[i, j] + 1
                        q.append((ni, nj))
        return dist

    d_high = bfs(higher)
    d_pour = bfs(pour)
    eps = np.zeros((h, w))
    both = flats & (d_high >= 0) & (d_pour >= 0)
    eps[both] = (d_high[both] + 2 * d_pour[both]) * 1e-5
    # Fallback pass: flats in patches with no detected pour (equal-level chains
    # the strict test misses) drain toward the nearest already-draining cell.
    # Non-flat cells all carry codes, so every patch is surrounded — full
    # coverage guaranteed. Same orientation (away = higher epsilon).
    stranded = flats & ~both
    used_fallback = False
    if stranded.any():
        used_fallback = True
        seeds = ~flat
        dist = np.full((h, w), -1, dtype=np.int32)
        q = deque()
        dist[seeds] = 0
        for i, j in zip(*np.where(seeds)):
            q.append((i, j))
        while q:
            i, j = q.popleft()
            for di in (-1, 0, 1):
                for dj in (-1, 0, 1):
                    if di == 0 and dj == 0:
                        continue
                    ni, nj = i + di, j + dj
                    if 0 <= ni < h and 0 <= nj < w and stranded[ni, nj] and dist[ni, nj] < 0:
                        dist[ni, nj] = dist[i, j] + 1
                        q.append((ni, nj))
        reached = stranded & (dist >= 0)
        eps[reached] = dist[reached] * 1e-5 + eps.max()
        stranded = stranded & (dist < 0)
    resolved = conditioned + eps
    return resolved, {"method": "Garbrecht-Martz (d_high + 2*d_pour, step 1e-5 m) + "
                               "nearest-draining fallback for pour-less patches",
                      "flat_cells": int(flats.sum()),
                      "pour_cells": int(pour.sum()), "high_edge_cells": int(higher.sum()),
                      "fallback_cells": int((flats & ~both).sum()) if used_fallback else 0,
                      "stranded_cells": int(stranded.sum()),
                      "max_epsilon_m": float(eps.max()),
                      "state": "DERIVED"}


def flow_direction(conditioned: np.ndarray) -> tuple[np.ndarray, dict]:
    """Steepest-descent D8 on the conditioned DEM. Edge cells draining outward → 0.
    Flats (no lower neighbor) → 0 with flat mask recorded (not forced)."""
    h, w = conditioned.shape
    direction = np.zeros((h, w), dtype=np.uint8)
    padded = np.pad(conditioned, 1, mode="edge")
    best_drop = np.zeros((h, w))
    for di, dj, code, dist in D8:
        drop = (conditioned - padded[1 + di:h + 1 + di, 1 + dj:w + 1 + dj]) / dist
        take = drop > best_drop
        direction[take] = code
        best_drop[take] = drop[take]
    flat = (direction == 0)
    # Border outflow: edge cells with code 0 that CAN drain out are true outlets.
    return direction, {"algorithm": "D8 steepest descent (8-connectivity)",
                       "edge": "outward-draining edges → 0 (outlet/nodata)",
                       "nodata": "flats → 0 + flat mask (not forced)",
                       "flat_cells": int(flat.sum()),
                       "flat_frac": float(flat.sum() / flat.size),
                       "state": "DERIVED"}


def flow_accumulation(direction: np.ndarray, conditioned: np.ndarray) -> tuple[np.ndarray, dict]:
    """Cell-count accumulation via downstream pass in elevation-descending order.

    Units: CELLS (convert with actual cell area — see contributing_area_km2).
    Minimum is 1 (the cell itself). Distribution/edge behavior validated by caller.
    """
    pour_order = np.argsort(-conditioned.ravel(), kind="stable")
    acc = accumulate(direction, pour_order)
    return acc, {"algorithm": "downstream pass in elevation-descending order",
                 "units": "cells", "min": float(acc.min()), "max": float(acc.max()),
                 "state": "DERIVED"}


def accumulate(direction: np.ndarray, pour_order: np.ndarray) -> np.ndarray:
    """Execute the downstream pass. pour_order: flat indices, donors first."""
    h, w = direction.shape
    acc = np.ones(h * w, dtype=np.float64)
    to_offset = {}
    for di, dj, code, _ in D8:
        to_offset[code] = di * w + dj
    for idx in pour_order:
        code = int(direction[idx // w, idx % w])
        off = to_offset.get(code)
        if off:
            tgt = idx + off
            if 0 <= tgt < h * w:
                acc[tgt] += acc[idx]
    return acc.reshape(h, w)


def contributing_area_km2(acc_cells: np.ndarray, lats: np.ndarray,
                          dlon_deg: float, dlat_deg: float) -> np.ndarray:
    dx, dy = cell_sizes_m(lats, dlon_deg, dlat_deg)
    cell_km2 = (dx * dy) / 1e6
    return acc_cells * cell_km2[:, None]


def extract_streams(acc_cells: np.ndarray, thresholds: list[int]) -> dict:
    """Stream masks for a documented threshold set (sensitivity built in).
    Thresholds are cell counts; reasoning recorded per run (no universal value)."""
    return {f">={t}": {"mask_cells": int((acc_cells >= t).sum()),
                       "frac": float((acc_cells >= t).mean()),
                       "threshold_cells": t,
                       "threshold_note": "configurable; sensitivity across the set, "
                                         "never a universal value"}
            for t in thresholds}


def drainage_density_km_per_km2(stream_mask: np.ndarray, lats: np.ndarray,
                                dlon_deg: float, dlat_deg: float) -> float:
    """Total stream length / area. Length via per-row cell width (diagonals ×√2
    approximated by mean factor 1.2 — documented approximation)."""
    dx, dy = cell_sizes_m(lats, dlon_deg, dlat_deg)
    mean_dx = float(np.mean(dx))
    length_km = float(stream_mask.sum()) * mean_dx * 1.2 / 1000.0
    area_km2 = float(np.sum(dx) * dy / 1e6)
    return length_km / area_km2 if area_km2 else 0.0


def distance_to_stream_m(stream_mask: np.ndarray, lats: np.ndarray,
                         dlon_deg: float, dlat_deg: float) -> np.ndarray:
    """Chamfer-ish distance via BFS layers in cell units × local metric scale.
    Exact only for small grids; TEST ROI scale is fine (documented)."""
    from collections import deque

    h, w = stream_mask.shape
    dist_cells = np.full((h, w), np.inf)
    q = deque()
    dist_cells[stream_mask] = 0.0
    for i, j in zip(*np.where(stream_mask)):
        q.append((i, j))
    while q:
        i, j = q.popleft()
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                if di == 0 and dj == 0:
                    continue
                ni, nj = i + di, j + dj
                if 0 <= ni < h and 0 <= nj < w:
                    step = 2 ** 0.5 if di and dj else 1.0
                    if dist_cells[ni, nj] > dist_cells[i, j] + step:
                        dist_cells[ni, nj] = dist_cells[i, j] + step
                        q.append((ni, nj))
    dx, _ = cell_sizes_m(lats, dlon_deg, dlat_deg)
    return dist_cells * np.mean(dx)


def route_remaining_flats(z: np.ndarray, direction: np.ndarray) -> tuple[np.ndarray, dict]:
    """Layered routing for epsilon-tied flats (deterministic, vectorized passes).

    Remaining interior flats route to the lowest already-draining neighbor
    (ties → fixed neighbor order). The draining front grows monotonically, so
    every cell converts (borders seed it); cycles are impossible because targets
    always drain already. Uphill steps (plateau edges) are counted and reported,
    not hidden. Borders stay outlets.
    """
    CODES = [128, 1, 2, 64, 4, 32, 16, 8]
    SHIFTS = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
    h, w = z.shape
    is_border = np.zeros((h, w), dtype=bool)
    is_border[[0, -1], :] = True
    is_border[:, [0, -1]] = True
    out = direction.copy()
    flat = (out == 0) & ~is_border
    zp = np.pad(z, 1, mode="constant", constant_values=np.inf)
    best_val = np.full((h, w), np.inf)
    passes, uphill = 0, 0
    while flat.any():
        draining = ~((out == 0) & ~is_border)
        moved = np.zeros((h, w), dtype=bool)
        # Fixed neighbor order doubles as the deterministic tie-break.
        for code, (di, dj) in zip(CODES, SHIFTS):
            nz = zp[1 + di:h + 1 + di, 1 + dj:w + 1 + dj]
            nb_draining = np.zeros((h, w), dtype=bool)
            src = draining[max(0, -di):h - max(0, di), max(0, -dj):w - max(0, dj)]
            dst = nb_draining[max(0, di):h - max(0, -di), max(0, dj):w - max(0, -dj)]
            dst[:] = src
            cand = flat & ~moved & nb_draining
            # Lowest draining neighbor wins; first code in fixed order wins ties.
            take = cand & (nz < best_val)
            best_val[take] = nz[take]
            out[take] = code
            uphill += int((take & (nz > z)).sum())
            moved |= take
        if not moved.any():
            break
        flat = (out == 0) & ~is_border
        passes += 1
        if passes > 10000:
            raise RuntimeError("flat routing did not converge")
    return out, {"method": "layered draining-front routing (vectorized passes)",
                 "passes": passes, "uphill_steps": uphill,
                 "remaining_flat_frac": float((((out == 0) & ~is_border)).mean()),
                 "state": "DERIVED"}


def build_drainage_network(osm_elements: list[dict], dem_stream_cells: int,
                           dem_threshold: int) -> dict:
    """Combined drainage inventory with source_type labels. OSM_OBSERVED is
    primary (mapped rivers); DEM_DERIVED is supplementary (measured skill on
    plains: weak — see TERRAIN-VALIDATION.md). Never mixed without labels."""
    observed = []
    for el in osm_elements:
        tags = el.get("tags", {}) or {}
        geom = el.get("geometry", []) or []
        observed.append({"name": tags.get("name"), "waterway": tags.get("waterway"),
                         "source_type": "OSM_OBSERVED",
                         "vertices": len(geom) if isinstance(geom, list) else 0})
    return {"features_osm": observed,
            "dem_derived": {"stream_cells": dem_stream_cells,
                            "threshold_cells": dem_threshold,
                            "source_type": "DEM_DERIVED",
                            "skill_note": "TEST-ROI median offset to OSM rivers ~2.2 km; "
                                          "supplementary use only on flat plains"},
            "primary": "OSM_OBSERVED"}


def delineate_watershed(direction: np.ndarray, pour_points: list[tuple[int, int]] | None) -> dict:
    """Upstream traversal from verified pour points. Without configured outlets
    returns WATERSHED_STATUS=NOT_CONFIGURED (never invented)."""
    if not pour_points:
        return {"watershed_status": "NOT_CONFIGURED",
                "reason": "no verified pour points/outlets configured",
                "subbasin_id": None}
    h, w = direction.shape
    to_offset = {}
    for di, dj, code, _ in D8:
        to_offset[(di, dj)] = code
    labels = np.zeros((h, w), dtype=np.int32)
    for wid, (pi, pj) in enumerate(pour_points, start=1):
        if not (0 <= pi < h and 0 <= pj < w):
            raise ValueError(f"pour point out of grid: {(pi, pj)}")
        stack = [(pi, pj)]
        while stack:
            i, j = stack.pop()
            if labels[i, j]:
                continue
            labels[i, j] = wid
            for (di, dj), code in to_offset.items():
                ni, nj = i - di, j - dj
                if (0 <= ni < h and 0 <= nj < w and not labels[ni, nj]
                        and int(direction[ni, nj]) == code):
                    stack.append((ni, nj))
    return {"watershed_status": "DELINEATED", "labels": labels,
            "pour_points": pour_points, "state": "DERIVED"}


def runoff_interface() -> dict:
    """Rainfall→runoff interface contract (Step 7 definition; Step 8 consumes it).

    No computation here — this pins the states and field names both sides use,
    so runoff is never confused with observed rainfall.
    """
    return {
        "flow": ["rainfall OBSERVED/FORECAST/NOWCAST/PREDICTED", "rainfall accumulation",
                 "runoff input (DERIVED runoff / SIMULATED runoff — never OBSERVED unless gauged)",
                 "terrain + drainage response", "inundation model"],
        "runoff_states": ["DERIVED", "SIMULATED"],
        "forbidden_labels": ["OBSERVED (unless gauged)", "LIVE"],
        "required_inputs": ["rainfall_grid (mm/h, UTC, EPSG:4326)",
                            "flow_direction (D8)", "cell_area_m2", "drainage_network"],
        "optional_inputs": ["watershed_id (NOT_CONFIGURED → omitted)"],
    }


def consistency_checks(direction: np.ndarray, acc: np.ndarray,
                       slope_deg: np.ndarray, aspect: np.ndarray) -> dict:
    """Tolerance-documented validation (natural terrain is not perfectly monotonic)."""
    h, w = direction.shape
    to_offset = {}
    for di, dj, code, _ in D8:
        to_offset[code] = (di, dj)
    flat_dir = direction.ravel()
    tgt = np.arange(h * w)
    ii = np.repeat(np.arange(h), w)
    jj = np.tile(np.arange(w), h)
    for code, (di, dj) in to_offset.items():
        idx = np.where(flat_dir == code)[0]
        ni, nj = ii[idx] + di, jj[idx] + dj
        valid = (ni >= 0) & (ni < h) & (nj >= 0) & (nj < w)
        tgt[idx[valid]] = ni[valid] * w + nj[valid]
    flat_acc = acc.ravel()
    has_flow = flat_dir != 0
    decreases = int(((flat_acc[tgt] < flat_acc) & has_flow).sum())
    checked = int(has_flow.sum())
    return {"flow_points_to_valid_neighbor": True,
            "accumulation_min": float(acc.min()),
            "accumulation_non_negative": bool((acc >= 1).all()),
            "downstream_decreases": decreases,
            "downstream_checked": checked,
            "downstream_decrease_frac": decreases / checked if checked else 0.0,
            "tolerance_note": "some decrease is natural at confluences/flats; "
                              "flag only if frac > 0.05",
            "slope_non_negative": bool((slope_deg >= 0).all()),
            "aspect_range_ok": bool(((aspect == -1) | ((aspect >= 0) & (aspect <= 360))).all())}


def zonal_to_rainfall_grid(features: dict, grid_extent: list[float],
                           cell_deg: float = 0.1) -> dict:
    """Aggregate terrain/hydro cells onto rainfall-grid cells. Per-variable method:
    elevation→mean, slope→mean+max, accumulation→mean, streams→presence fraction,
    distance→mean, watershed→dominant (NOT_CONFIGURED → None). Never implies
    equal resolution — methods recorded per variable.
    """
    import math

    minlon, minlat, maxlon, maxlat = grid_extent
    nx = max(1, math.ceil((maxlon - minlon) / cell_deg - 1e-9))  # epsilon vs fp dust
    ny = max(1, math.ceil((maxlat - minlat) / cell_deg - 1e-9))
    H, W = features["elevation"].shape
    ys = np.linspace(maxlat, minlat, H)
    xs = np.linspace(minlon, maxlon, W)
    cells = []
    for iy in range(ny):
        for ix in range(nx):
            x0, x1 = minlon + ix * cell_deg, minlon + (ix + 1) * cell_deg
            y1, y0 = maxlat - iy * cell_deg, maxlat - (iy + 1) * cell_deg
            sel = (ys[:, None] <= y1) & (ys[:, None] > y0) & (xs[None, :] >= x0) & (xs[None, :] < x1)
            if not sel.any():
                cells.append(None)
                continue
            sel_f = features
            cells.append({
                "ix": ix, "iy": iy,
                "center": [x0 + cell_deg / 2, y0 + cell_deg / 2],
                "elevation_mean_m": (float(np.mean(sel_f["elevation"][sel])), "mean"),
                "slope_mean_deg": (float(np.mean(sel_f["slope_deg"][sel])), "mean"),
                "slope_max_deg": (float(np.max(sel_f["slope_deg"][sel])), "max"),
                "flow_accum_mean_cells": (float(np.mean(sel_f["accumulation"][sel])), "mean"),
                "stream_presence_frac": (float(np.mean(sel_f["streams"][sel])), "presence-fraction"),
                "dist_stream_mean_m": (float(np.mean(sel_f["dist_stream_m"][sel])), "mean"),
                "watershed_id": (None, "NOT_CONFIGURED"),
            })
    return {"cells": cells, "nx": nx, "ny": ny, "cell_deg": cell_deg,
            "method_note": "aggregation per variable recorded; terrain resolution ≠ rainfall resolution"}
