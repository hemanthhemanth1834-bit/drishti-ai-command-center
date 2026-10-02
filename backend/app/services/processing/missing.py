"""Missing-data policy (Step 4). States travel with the data into ML-ready sets so a
model can always distinguish observed vs derived vs forecast vs imputed.
"""

from __future__ import annotations

from app.schemas.observations import MissingState


def classify(value, *, is_forecast: bool, was_interpolated: bool = False,
             was_imputed: bool = False, stale: bool = False) -> MissingState:
    if value is None:
        return MissingState.MISSING
    if stale:
        return MissingState.STALE
    if was_imputed:
        return MissingState.IMPUTED
    if was_interpolated:
        return MissingState.INTERPOLATED
    if is_forecast:
        return MissingState.AVAILABLE  # forecasts are usable but labelled upstream
    return MissingState.AVAILABLE


def source_kind(status: str) -> str:
    """ML-facing kind label: observation | derived | forecast | imputed."""
    return {"LIVE": "observation", "HISTORICAL": "observation", "FORECAST": "forecast",
            "SIMULATED": "derived", "DEMO": "derived", "UNAVAILABLE": "missing"}.get(status, "missing")
