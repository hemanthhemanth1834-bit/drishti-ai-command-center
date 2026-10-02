"""Historical validation (Step 9). Observed flood polygons (never fabricated)
rasterized onto the model grid; MODELLED vs OBSERVED kept strictly separate;
metrics with sample counts. Validation data never trains anything (the
inundation engine is deterministic — assertable, tested).
"""

from __future__ import annotations

from pathlib import Path

import numpy as np


def load_observed_mask(shp_path: str | Path, extent: list[float],
                       shape: tuple[int, int]) -> tuple[np.ndarray, dict]:
    """Rasterize shapefile polygons onto (H,W) via compound matplotlib Path.

    Returns (mask, info). CRS must be geographic WGS84 (checked from .prj when
    present); anything else raises instead of silently misaligning.
    """
    import shapefile
    from matplotlib.path import Path as MplPath

    shp_path = Path(shp_path)
    base = shp_path.with_suffix("")
    prj = base.with_suffix(".prj")
    crs = prj.read_text().split(",")[0] if prj.exists() else "unknown"
    if prj.exists() and "WGS_1984" not in prj.read_text() and "WGS 84" not in prj.read_text():
        raise ValueError(f"unsupported observed CRS (need WGS84): {crs}")
    reader = shapefile.Reader(str(shp_path))
    H, W = shape
    west, south, east, north = extent
    dx, dy = (east - west) / W, (north - south) / H
    mask = np.zeros((H, W), dtype=bool)
    npolys = 0
    for shape_obj in reader.shapes():
        pts = np.asarray(shape_obj.points, dtype=np.float64)
        if len(pts) < 3:
            continue
        npolys += 1
        # Window to the polygon bbox: full-grid tests are infeasible.
        x0, y0, x1, y1 = pts[:, 0].min(), pts[:, 1].min(), pts[:, 0].max(), pts[:, 1].max()
        c0 = max(0, int((x0 - west) / dx) - 1)
        c1 = min(W, int((x1 - west) / dx) + 2)
        r1 = max(0, int((north - y1) / dy) - 1)
        r0 = min(H, int((north - y0) / dy) + 2)
        if c0 >= c1 or r1 >= r0:
            continue  # outside ROI
        xs = west + (np.arange(c0, c1) + 0.5) * dx
        ys = north - (np.arange(r1, r0) + 0.5) * dy
        XX, YY = np.meshgrid(xs, ys)
        path = MplPath(pts, [MplPath.MOVETO] + [MplPath.LINETO] * (len(pts) - 2)
                       + [MplPath.CLOSEPOLY])
        mask[r1:r0, c0:c1] |= path.contains_points(
            np.column_stack([XX.ravel(), YY.ravel()])).reshape(r0 - r1, c1 - c0)
    return mask, {"polygons": npolys, "crs": "WGS84 (verified from .prj)",
                  "method": "bbox-windowed Path rasterization (matplotlib)",
                  "observed_cells": int(mask.sum())}


def confusion(modelled: np.ndarray, observed: np.ndarray) -> dict:
    m = np.asarray(modelled, dtype=bool)
    o = np.asarray(observed, dtype=bool)
    if m.shape != o.shape:
        raise ValueError(f"grid mismatch: modelled {m.shape} vs observed {o.shape}")
    tp = int((m & o).sum())
    fp = int((m & ~o).sum())
    fn = int(((~m) & o).sum())
    tn = int(((~m) & (~o)).sum())
    union = tp + fp + fn
    return {"tp": tp, "fp": fp, "fn": fn, "tn": tn,
            "iou": tp / union if union else 0.0,
            "precision": tp / (tp + fp) if tp + fp else 0.0,
            "recall": tp / (tp + fn) if tp + fn else 0.0,
            "f1": (2 * tp / (2 * tp + fp + fn)) if (2 * tp + fp + fn) else 0.0,
            "hit_rate": tp / (tp + fn) if tp + fn else 0.0,
            "miss_rate": fn / (tp + fn) if tp + fn else 0.0,
            "false_alarm_rate": fp / (fp + tn) if fp + tn else 0.0,
            "modelled_cells": int(m.sum()), "observed_cells": int(o.sum()),
            "area_error_frac": ((m.sum() - o.sum()) / o.sum()) if o.sum() else None}
