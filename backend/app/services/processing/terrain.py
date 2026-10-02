"""Terrain processing (Step 7). Real DEM → QC → voids → sink-conditioned DEM →
slope/aspect. Original DEM immutable; every derivative marked DERIVED.

Metric math without PROJ (documented limitation, Step 10 adds rasterio/GDAL):
spherical earth R=6371000 m; per-row cell width dx=R·cos(φ)·Δλ, dy=R·Δφ.
Valid for small ROIs; recorded as transformation method on every product.
"""

from __future__ import annotations

import heapq
import math

import numpy as np

EARTH_R_M = 6371000.0
SOURCE_CRS = "EPSG:4326"


def utm_zone(lon: float, lat: float) -> str:
    """Derive UTM zone from ROI longitude (no universal zone assumed)."""
    zone = int((lon + 180.0) / 6.0) + 1
    return f"{zone}{'N' if lat >= 0 else 'S'}"


def cell_sizes_m(lats: np.ndarray, dlon_deg: float, dlat_deg: float) -> tuple[np.ndarray, float]:
    dx = EARTH_R_M * np.cos(np.radians(lats)) * math.radians(dlon_deg)
    dy = EARTH_R_M * math.radians(dlat_deg)
    return dx, dy


def qc_dem(grid: np.ndarray) -> dict:
    """DEM QC: NaN/Inf, impossible elevations, void fraction, stats."""
    total = grid.size
    nan = int(np.isnan(grid).sum())
    inf = int(np.isinf(grid).sum())
    finite = grid[np.isfinite(grid)]
    impossible = int(((finite < -500) | (finite > 9000)).sum()) if finite.size else 0
    return {"cells": int(total), "missing_nan": nan, "invalid_inf": inf,
            "invalid_impossible": impossible,
            "void_frac": (nan + inf) / total if total else 0.0,
            "min_m": float(finite.min()) if finite.size else None,
            "max_m": float(finite.max()) if finite.size else None,
            "mean_m": float(finite.mean()) if finite.size else None,
            "status": "VALID" if (nan + inf + impossible) == 0 else "MISSING"}


def fill_voids(grid: np.ndarray) -> tuple[np.ndarray, dict]:
    """Nearest-valid fill (documented); returns (filled, {mask, pct, method}).

    Never silent: original void mask preserved alongside, percentage recorded.
    """
    out = grid.copy()
    void = ~np.isfinite(out) | (out < -500) | (out > 9000)
    mask = void.copy()
    if void.any():
        valid = ~void
        # Iterative nearest propagation (Manhattan rings) — deterministic.
        filled = out.copy()
        filled[void] = np.nan
        while np.isnan(filled).any():
            prev = filled.copy()
            for di, dj in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                shifted = np.roll(prev, (di, dj), axis=(0, 1))
                take = np.isnan(filled) & ~np.isnan(shifted)
                filled[take] = shifted[take]
            if np.array_equal(np.isnan(filled), np.isnan(prev)):
                break  # no valid seed at all — remaining stays MISSING
        out = np.where(void & ~np.isnan(filled), filled, out)
    return out, {"void_mask_cells": int(mask.sum()),
                 "pct_interpolated": float(mask.sum() / grid.size * 100),
                 "method": "nearest-valid Manhattan propagation",
                 "state": "INTERPOLATED" if mask.any() else "AVAILABLE"}


def fill_sinks(filled: np.ndarray) -> tuple[np.ndarray, dict]:
    """Barnes priority-flood depression filling. Depressions are filled to spill
    level (documented); natural vs artifact distinction is NOT automated — the
    fill-depth map is stored so Step 8+ can inspect. Original preserved."""
    h, w = filled.shape
    closed = np.zeros((h, w), dtype=bool)
    spill = np.full((h, w), np.inf)
    heap: list[tuple[float, int, int]] = []
    for i in range(h):
        for j in (0, w - 1):
            heapq.heappush(heap, (filled[i, j], i, j))
    for j in range(w):
        for i in (0, h - 1):
            heapq.heappush(heap, (filled[i, j], i, j))
    while heap:
        z, i, j = heapq.heappop(heap)
        if closed[i, j]:
            continue
        closed[i, j] = True
        spill[i, j] = z
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                if di == 0 and dj == 0:
                    continue
                ni, nj = i + di, j + dj
                if 0 <= ni < h and 0 <= nj < w and not closed[ni, nj]:
                    heapq.heappush(heap, (max(filled[ni, nj], z), ni, nj))
    conditioned = np.maximum(filled, spill)
    raised = conditioned > filled
    return conditioned, {"method": "Barnes priority-flood (heap)",
                         "cells_raised": int(raised.sum()),
                         "pct_raised": float(raised.sum() / filled.size * 100),
                         "max_fill_m": float((conditioned - filled).max()),
                         "note": "natural vs artifact depressions NOT auto-distinguished; "
                                 "fill-depth map stored for inspection"}


def slope_aspect(grid: np.ndarray, lats: np.ndarray, dlon_deg: float, dlat_deg: float,
                 flat_thresh_deg: float = 0.05) -> tuple[np.ndarray, np.ndarray, dict]:
    """Horn (1981) slope (degrees + percent available) and aspect (0–360, north-ref).
    Flat cells (slope < threshold) → ASPECT_UNDEFINED (-1), never silent 0°.
    """
    dx_row, dy = cell_sizes_m(lats, dlon_deg, dlat_deg)
    dx = dx_row[:, None]
    z = grid
    # Horn kernels on the interior (edges replicate nearest valid row/col).
    zp = np.pad(z, 1, mode="edge")
    dzdx = ((zp[:-2, 2:] + 2 * zp[1:-1, 2:] + zp[2:, 2:])
            - (zp[:-2, :-2] + 2 * zp[1:-1, :-2] + zp[2:, :-2])) / (8 * dx)
    dzdy = ((zp[2:, :-2] - zp[:-2, :-2]) + 2 * (zp[2:, 1:-1] - zp[:-2, 1:-1])
            + (zp[2:, 2:] - zp[:-2, 2:])) / (8 * dy)
    slope_rad = np.arctan(np.sqrt(dzdx ** 2 + dzdy ** 2))
    slope_deg = np.degrees(slope_rad)
    aspect = (np.degrees(np.arctan2(dzdx, -dzdy)) + 360.0) % 360.0
    aspect = np.where(slope_deg < flat_thresh_deg, -1.0, aspect)  # ASPECT_UNDEFINED
    return slope_deg, aspect, {"method": "Horn 1981, spherical-earth metric",
                               "processing_crs": "spherical-local-metric",
                               "flat_threshold_deg": flat_thresh_deg,
                               "aspect_convention": "0-360 clockwise from north; -1 = ASPECT_UNDEFINED",
                               "state": "DERIVED"}


def roughness_tri(grid: np.ndarray) -> tuple[np.ndarray, dict]:
    """Terrain Ruggedness Index (Riley et al. 1999): sqrt of summed squared
    differences between the center cell and its 8 neighbors, in metres.
    Flat plains → ~0; ridges/rough ground → high. DERIVED."""
    zp = np.pad(grid, 1, mode="edge")
    acc = np.zeros_like(grid, dtype=np.float64)
    for di in (-1, 0, 1):
        for dj in (-1, 0, 1):
            if di == 0 and dj == 0:
                continue
            diff = zp[1 + di:grid.shape[0] + 1 + di, 1 + dj:grid.shape[1] + 1 + dj] - grid
            acc += diff ** 2
    tri = np.sqrt(acc)
    return tri, {"method": "Riley et al. 1999 TRI (3x3 window)", "unit": "m",
                 "flat_plain_value": "~0 m", "state": "DERIVED"}
