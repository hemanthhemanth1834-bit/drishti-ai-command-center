"""Inundation engine (Step 8). Deterministic parameterized model — NOT ML, and the
registry records exactly that.

Model: runoff-coefficient rainfall excess + D8 storage routing (linear-reservoir
cells), hourly timestep. Rationale: reproducible, explainable, CPU-friendly,
works with available data (DEM + D8 + OSM drainage + hourly rainfall); a full
shallow-water solver is unjustified without channel geometry/bathymetry, and
"elevation < threshold ⇒ flooded" is not hydrology (explicitly rejected).

Per-cell, per-timestep (documented equation):
    excess   = max(0, P − Ia) × C            [rainfall excess, m/h × area]
    inflow   = Σ upstream outflow             [D8 scatter]
    outflow  = S × (1 − exp(−dt/τ))           [linear reservoir]
    loss     = min(S, infil_rate × dt)        [infiltration]
    S[t+1]   = S[t] + excess×A + inflow − outflow − loss
    depth    = S / A_cell
Water balance: INPUT = ΔS + OUTFLOW(border) + LOSSES within tolerance,
else WATER_BALANCE_WARNING (never silent).
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

import numpy as np

MODEL_ID = "inundation-cn-routing"
MODEL_VERSION = "v0.8.0"

# MODEL_INUNDATION_THRESHOLD (modeling threshold, NOT an official warning level).
MODEL_INUNDATION_THRESHOLD_M = 0.05
DEPTH_CLASSES = [("NO_INUNDATION", 0.0), ("SHALLOW", 0.05), ("MODERATE", 0.15),
                 ("DEEP", 0.5), ("VERY_DEEP", 1.5)]


@dataclass
class HydroParams:
    """Every parameter carries a provenance state — assumptions are never hidden."""
    runoff_coeff: float = 0.55          # C: urbanizing-plain composite
    runoff_state: str = "ASSUMED"       # no spatial CN source; TEST-ROI constant
    initial_abstraction_mm: float = 2.0  # Ia: depression+weting loss per event start
    initial_abstraction_state: str = "ASSUMED"
    tau_hours: float = 3.0              # τ: linear-reservoir response, plains
    tau_state: str = "ASSUMED"
    infil_mm_per_h: float = 1.0         # steady infiltration loss
    infil_state: str = "ASSUMED"
    dt_hours: float = 1.0
    notes: str = ("TEST-ROI calibration parameters. Ranges considered: C 0.3–0.8, "
                  "Ia 0–5 mm, τ 1–6 h, infil 0–3 mm/h. NOT_CALIBRATED — no flood "
                  "observations exist yet (Step 9).")


def depth_class(depth_m: float) -> str:
    for name, lo in reversed(DEPTH_CLASSES):
        if depth_m >= lo:
            return name
    return "NO_INUNDATION"


def inundation_state(flooded_frac: float) -> str:
    """NO_INUNDATION | PREDICTED_INUNDATION (UNAVAILABLE/INSUFFICIENT_DATA
    are returned by callers when inputs are missing — never here)."""
    return "PREDICTED_INUNDATION" if flooded_frac > 0 else "NO_INUNDATION"


def assess_quality(*, weak_drainage: bool = True, stale_inputs: bool = False,
                   unsupported_horizon: bool = False,
                   missing_sources: tuple = ()) -> dict:
    """Quality is VALID only with zero triggers; otherwise DEGRADED with
    explicit reasons. Never a percentage, never invented."""
    triggers = []
    if weak_drainage:
        triggers.append("weak DEM-drainage validation (Step-7 median offset 2.2 km)")
    if stale_inputs:
        triggers.append("stale input data")
    if unsupported_horizon:
        triggers.append("unsupported horizon")
    for s in missing_sources:
        triggers.append(f"missing source: {s}")
    return {"quality": "DEGRADED" if triggers else "VALID", "triggers": triggers}


@dataclass
class RoutingState:
    storage_m3: np.ndarray
    downstream: np.ndarray  # flat target index or -1 (border outlet)
    border_mask: np.ndarray
    cell_area_m2: np.ndarray
    steps: int = 0
    corrections: list = field(default_factory=list)


def build_routing(direction: np.ndarray, cell_area_m2: np.ndarray) -> RoutingState:
    h, w = direction.shape
    to_off = {}
    from app.services.processing.hydro import D8
    for di, dj, code, _ in D8:
        to_off[code] = (di, dj)
    downstream = np.full(h * w, -1, dtype=np.int64)
    border = np.zeros((h, w), dtype=bool)
    border[[0, -1], :] = True
    border[:, [0, -1]] = True
    for code, (di, dj) in to_off.items():
        ii, jj = np.where(direction == code)
        ni, nj = ii + di, jj + dj
        ok = (ni >= 0) & (ni < h) & (nj >= 0) & (nj < w)
        downstream[ii[ok] * w + jj[ok]] = ni[ok] * w + nj[ok]
        # Off-grid or border-outlet drainage exits the domain.
        downstream[ii[~ok] * w + jj[~ok]] = -1
    return RoutingState(storage_m3=np.zeros(h * w), downstream=downstream,
                        border_mask=border, cell_area_m2=cell_area_m2.ravel())


def step(state: RoutingState, rain_m: np.ndarray, params: HydroParams,
         inject_m3: dict[int, float] | None = None) -> dict:
    """Advance one routing timestep (vectorized). inject_m3 maps flat cell
    indices to upstream inflow volumes (m³) added with the rainfall input.
    Returns balance diagnostics."""
    rain_m = np.asarray(rain_m, dtype=np.float64).ravel()
    if (rain_m < 0).any() or (~np.isfinite(rain_m)).any():
        bad = int(((rain_m < 0) | (~np.isfinite(rain_m))).sum())
        state.corrections.append(f"clipped {bad} invalid rainfall inputs to 0 (logged)")
        rain_m = np.where(np.isfinite(rain_m) & (rain_m > 0), rain_m, 0.0)
    excess_m = np.maximum(0.0, rain_m - params.initial_abstraction_mm / 1000.0) * params.runoff_coeff
    k = 1.0 - math.exp(-params.dt_hours / params.tau_hours)
    outflow = state.storage_m3 * k
    inflow = np.zeros_like(outflow)
    valid = state.downstream >= 0
    np.add.at(inflow, state.downstream[valid], outflow[valid])
    border_out = float(outflow[~valid].sum())
    # Losses apply to post-outflow remainder (ordering matters for conservation).
    remainder = state.storage_m3 - outflow
    loss = np.minimum(np.maximum(remainder, 0.0),
                      params.infil_mm_per_h / 1000.0 * state.cell_area_m2 * params.dt_hours)
    s0 = state.storage_m3.sum()
    injected = np.zeros_like(state.storage_m3)
    if inject_m3:
        for idx, vol in inject_m3.items():
            if vol < 0 or not np.isfinite(vol):
                raise ValueError(f"invalid injection volume at {idx}: {vol}")
            injected[idx] += vol
    state.storage_m3 = remainder + excess_m * state.cell_area_m2 + inflow - loss + injected
    neg = state.storage_m3 < 0
    if neg.any():
        state.corrections.append(f"clamped {int(neg.sum())} negative storages to 0 (logged)")
        state.storage_m3[neg] = 0.0
    if (~np.isfinite(state.storage_m3)).any():
        raise FloatingPointError("non-finite storage — instability, aborting (not clipping)")
    s1 = state.storage_m3.sum()
    input_m3 = float((excess_m * state.cell_area_m2).sum()) + float(injected.sum())
    bal_err = input_m3 - ((s1 - s0) + border_out + float(loss.sum()))
    # Tolerance: relative for wet steps, absolute floor for near-dry steps.
    rel = abs(bal_err) / max(input_m3, 1e-12)
    ok = rel < 1e-6 or abs(bal_err) < 1e-3
    state.steps += 1
    depth = (state.storage_m3 / state.cell_area_m2).reshape(
        state.border_mask.shape)
    return {"input_m3": input_m3, "storage_change_m3": s1 - s0,
            "border_outflow_m3": border_out, "losses_m3": float(loss.sum()),
            "balance_error_m3": bal_err, "relative_error": rel,
            "balance": "OK" if ok else "WATER_BALANCE_WARNING",
            "max_depth_m": float(depth.max()),
            "flooded_frac": float((depth > MODEL_INUNDATION_THRESHOLD_M).mean())}
