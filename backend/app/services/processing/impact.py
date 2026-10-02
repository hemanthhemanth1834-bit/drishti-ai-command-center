"""Impact analysis (Step 15). Per-frame exposure impact over served scenario grids.

Deterministic geometry rules (versioned contract, no invented values):
- buildings/facilities: centroid-in-flooded-cell → affected (+ footprint area).
- roads: affected length over segments with both endpoints flooded.
- depth bands (MODEL classes): SHALLOW/MODERATE/DEEP/VERY_DEEP from cell depth.
- population / vulnerability / economic loss / casualties: UNAVAILABLE always
  (no verified sources — never estimated, never zero-filled as fact).
"""

from __future__ import annotations

import numpy as np

from app.services.processing import risk as R

IMPACT_CONTRACT_VERSION = "impact-calc@v0.15.0"
DEPTH_BANDS = [("SHALLOW", 0.05), ("MODERATE", 0.15), ("DEEP", 0.5), ("VERY_DEEP", 1.5)]


def depth_band(depth_m: float) -> str | None:
    if depth_m <= 0.05:
        return None
    label = "SHALLOW"
    for name, lo in DEPTH_BANDS:
        if depth_m >= lo:
            label = name
    return label


def frame_grid_index(lons: np.ndarray, lats: np.ndarray, extent: list[float],
                     shape: tuple[int, int]) -> tuple[np.ndarray, np.ndarray]:
    """Vectorized lon/lat → frame-grid rows/cols (-1 when outside)."""
    west, south, east, north = extent
    H, W = shape
    cols = ((lons - west) / (east - west) * W).astype(int)
    rows = ((north - lats) / (north - south) * H).astype(int)
    valid = (cols >= 0) & (cols < W) & (rows >= 0) & (rows < H)
    return np.where(valid, rows, -1), np.where(valid, cols, -1)


def building_centroids(elements: list[dict]) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """lon/lat/footprint-area arrays for building elements with geometry."""
    lons, lats, areas = [], [], []
    for e in elements:
        geom = e.get("geometry") or []
        if e.get("type") == "node":
            if "lon" in e and "lat" in e:
                lons.append(e["lon"])
                lats.append(e["lat"])
                areas.append(0.0)
            continue
        if len(geom) < 1:
            continue
        xs = [p["lon"] for p in geom]
        ys = [p["lat"] for p in geom]
        lons.append(sum(xs) / len(xs))
        lats.append(sum(ys) / len(ys))
        ring = [(p["lon"], p["lat"]) for p in geom]
        areas.append(R.polygon_area_m2(ring) if len(ring) >= 3 and geom[0] == geom[-1] else 0.0)
    return np.array(lons), np.array(lats), np.array(areas)


def road_vertices(elements: list[dict]) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Segment endpoints + lengths for road ways (haversine, metres)."""
    x0, y0, x1, y1, seglen = [], [], [], [], []
    for e in elements:
        geom = e.get("geometry") or []
        for p, q in zip(geom, geom[1:]):
            if not all(k in p and k in q for k in ("lon", "lat")):
                continue
            x0.append(p["lon"])
            y0.append(p["lat"])
            x1.append(q["lon"])
            y1.append(q["lat"])
            seglen.append(R.haversine_m(p["lon"], p["lat"], q["lon"], q["lat"]))
    return (np.array(x0), np.array(y0), np.array(x1), np.array(y1), np.array(seglen))


def analyze_frame(depth: np.ndarray, extent: list[float], buildings: tuple,
                  roads: tuple, facilities: dict[str, tuple]) -> dict:
    """Impact for one frame grid. All counts measured; gaps stay missing."""
    H, W = depth.shape
    flooded = depth > 0.05
    out: dict = {"contract": IMPACT_CONTRACT_VERSION,
                 "flooded_cells": int(flooded.sum()),
                 "flooded_frac": float(flooded.mean()),
                 "max_depth_m": float(depth.max()),
                 "buildings": {}, "roads": {}, "facilities": {},
                 "population": "UNAVAILABLE",
                 "vulnerability": "UNAVAILABLE",
                 "economic_loss": "UNAVAILABLE",
                 "casualties": "UNAVAILABLE"}
    blons, blats, bareas = buildings
    if len(blons):
        br, bc = frame_grid_index(blons, blats, extent, (H, W))
        inside = (br >= 0)
        hit = np.zeros(len(blons), dtype=bool)
        hit[inside] = flooded[br[inside], bc[inside]]
        bands: dict[str, int] = {}
        for i in np.where(hit)[0]:
            band = depth_band(float(depth[br[i], bc[i]]))
            bands[band or "SHALLOW"] = bands.get(band or "SHALLOW", 0) + 1
        out["buildings"] = {"total": int(len(blons)), "affected": int(hit.sum()),
                            "affected_area_m2": round(float(bareas[hit].sum()), 1),
                            "by_band": bands}
    x0, y0, x1, y1, seglen = roads
    if len(seglen):
        r0, c0 = frame_grid_index(x0, y0, extent, (H, W))
        r1, c1 = frame_grid_index(x1, y1, extent, (H, W))
        ok = (r0 >= 0) & (r1 >= 0)
        both = np.zeros(len(seglen), dtype=bool)
        both[ok] = flooded[r0[ok], c0[ok]] & flooded[r1[ok], c1[ok]]
        out["roads"] = {"segments": int(len(seglen)),
                        "length_m": round(float(seglen.sum()), 1),
                        "affected_segments": int(both.sum()),
                        "affected_length_m": round(float(seglen[both].sum()), 1)}
    for name, (flons, flats, _) in facilities.items():
        if len(flons):
            fr, fc = frame_grid_index(flons, flats, extent, (H, W))
            inside = fr >= 0
            hit = np.zeros(len(flons), dtype=bool)
            hit[inside] = flooded[fr[inside], fc[inside]]
            out["facilities"][name] = {"total": int(len(flons)), "affected": int(hit.sum())}
    return out
