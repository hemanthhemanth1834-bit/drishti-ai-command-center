"""Upstream inflow interface (Step 10). Pure functions: catchment rainfall →
lumped runoff → lagged hydrograph → border inlet injection. All parameters
ASSUMED and recorded; states DERIVED/SIMULATED; gauges UNAVAILABLE.
"""

from __future__ import annotations

import numpy as np


def sample_points_in_mask(mask: np.ndarray, lats: np.ndarray, lons: np.ndarray,
                          k: int = 6) -> list[tuple[float, float]]:
    """Deterministic spread sample of k points inside a catchment mask."""
    ys, xs = np.where(mask)
    if len(xs) == 0:
        raise ValueError("empty catchment mask — cannot sample")
    order = np.argsort(xs + ys * 1e-6)
    take = np.linspace(0, len(order) - 1, min(k, len(order))).astype(int)
    return [(float(lats[ys[order[i]]]), float(lons[xs[order[i]]])) for i in take]


def runoff_mm_per_h(rain_mm: np.ndarray, coeff: float, ia_mm: float) -> np.ndarray:
    """Lumped runoff from hourly rain (same ASSUMED C/Ia discipline as engine)."""
    rain_mm = np.asarray(rain_mm, dtype=float)
    if ((rain_mm < 0) | (~np.isfinite(rain_mm))).any():
        raise ValueError("invalid rainfall in upstream series")
    return np.maximum(0.0, rain_mm - ia_mm) * coeff


def lag_hydrograph(volume_m3_per_h: np.ndarray, lag_h: int) -> np.ndarray:
    """Shift inflow by an ASSUMED lag (documented range 12–36 h, NOT calibrated).
    Pre-lag hours are zeros — stated, not backfilled."""
    if lag_h < 0:
        raise ValueError(f"negative lag: {lag_h}")
    v = np.asarray(volume_m3_per_h, dtype=float)
    out = np.zeros_like(v)
    out[lag_h:] = v[:len(v) - lag_h] if lag_h < len(v) else 0.0
    return out


def map_inlets(direction: np.ndarray, acc: np.ndarray, entry_lon: float,
               lons: np.ndarray, row: int = 0, n: int = 3,
               window_deg: float = 0.05, step_inside: bool = True) -> list[int]:
    """Top-n accumulation cells on a border row near the river entry lon.
    Deterministic; window + count recorded. Raises if the window is empty.
    step_inside: inject at the D8-downstream interior cell (water enters THROUGH
    the border) rather than the border outlet cell itself (which would drain the
    injection straight out of the domain). Falls back to the border cell only if
    its downstream lies outside the grid.
    """
    from app.services.processing.hydro import D8

    H, W = direction.shape
    near = np.abs(lons - entry_lon) <= window_deg
    if not near.any():
        raise ValueError("river entry lon outside grid")
    cols = np.where(near)[0]
    order = cols[np.argsort(acc[row, cols])[::-1][:n]]
    to_off = {code: (di, dj) for di, dj, code, _ in D8}
    out = []
    for c in order:
        idx = int(row * W + c)
        if step_inside:
            off = to_off.get(int(direction[row, c]))
            if off:
                ni, nj = row + off[0], c + off[1]
                if 0 <= ni < H and 0 <= nj < W:
                    idx = int(ni * W + nj)
        out.append(idx)
    return out


def find_inlet(direction: np.ndarray, acc: np.ndarray, entry_lon: float,
               lons: np.ndarray, max_row: int = 10, n: int = 3,
               window_deg: float = 0.05, min_path: int = 50) -> list[int]:
    """Boundary inflow cells with VERIFIED southward in-domain D8 paths.

    Border-zone D8 on flat plains often points outward (outlets) or back north;
    injecting there ejects water from the domain. Instead, scan rows 0..max_row
    near the river entry lon and keep cells whose traced D8 path stays in-domain
    for ≥ min_path steps with net southward drift. Deterministic; the path
    check (not visual judgment) qualifies each inlet.
    """
    from app.services.processing.hydro import D8

    H, W = direction.shape
    near = np.abs(lons - entry_lon) <= window_deg
    if not near.any():
        raise ValueError("river entry lon outside grid")
    to_off = {code: (di, dj) for di, dj, code, _ in D8}
    cands = []
    for i in range(0, min(max_row + 1, H)):
        for c in np.where(near)[0]:
            if int(direction[i, c]) == 0:
                continue
            ci, cj, steps = i, c, 0
            seen = set()
            while steps < 400:
                code = int(direction[ci, cj])
                off = to_off.get(code)
                if off is None:
                    break
                ci, cj = ci + off[0], cj + off[1]
                if not (0 <= ci < H and 0 <= cj < W) or (ci, cj) in seen:
                    break
                seen.add((ci, cj))
                steps += 1
            if steps >= min_path and ci > i:  # net southward, stays inside
                cands.append((int(acc[i, c]), int(i * W + c)))
    if not cands:
        raise ValueError("no verified southward inlet path near river entry")
    cands.sort(reverse=True)
    return [idx for _, idx in cands[:n]]


def find_river_inlet(direction: np.ndarray, acc: np.ndarray,
                     river_lons: list[float], river_lats: list[float],
                     lons: np.ndarray, lats: np.ndarray, n: int = 3,
                     window_deg: float = 0.02, top_k: int = 200) -> list[int]:
    """Inflow cells ON the mapped river with verified south-border exits.

    Border-zone D8 on flat plains is unreliable (outlets/backflow), so instead:
    take top-accumulation in-domain cells near the OSM river line, trace each
    D8 path, and keep cells whose path exits through the SOUTH border
    (through-flowing river reach). Injected water then joins verified
    southward flow. Deterministic; failures raise instead of inventing.
    """
    from app.services.processing.hydro import D8

    H, W = direction.shape
    to_off = {code: (di, dj) for di, dj, code, _ in D8}
    LON = np.repeat(lons[None, :], H, axis=0)
    LAT = np.repeat(lats[:, None], W, axis=1)
    rlons = np.array(river_lons)
    rlats = np.array(river_lats)
    # Vectorized distance to river vertices (chunked rows for memory).
    dist = np.full((H, W), np.inf)
    for a in range(0, H, 256):
        b = min(H, a + 256)
        d2 = (LON[a:b, :, None] - rlons[None, None, :]) ** 2 + \
             (LAT[a:b, :, None] - rlats[None, None, :]) ** 2
        dist[a:b] = np.sqrt(d2.min(axis=2))
    near = dist <= window_deg
    cand_idx = np.where(near.ravel())[0]
    order = cand_idx[np.argsort(acc.ravel()[cand_idx])[::-1][:top_k]]
    inlets = []
    for idx in order:
        ci, cj = int(idx // W), int(idx % W)
        seen = set()
        pi, pj = ci, cj
        for _ in range(4000):
            code = int(direction[pi, pj])
            off = to_off.get(code)
            if off is None:
                break
            pi, pj = pi + off[0], pj + off[1]
            if not (0 <= pi < H and 0 <= pj < W):
                if pi >= H:  # exited SOUTH = through-flowing river cell
                    inlets.append(idx)
                break
            if (pi, pj) in seen:
                break
            seen.add((pi, pj))
        if len(inlets) >= n:
            break
    if not inlets:
        raise ValueError("no river cell with verified south-border exit found")
    return inlets
