"""Temporal normalization + alignment (Step 4). UTC everywhere; four times never confused.

Canonical intervals: 15min / 30min / 1h / 3h / 6h. Step-4 canonical choice is 1h
(reasoning: docs/SPATIAL-TEMPORAL-GRID.md) — configurable per dataset.
No fabrication: binning assigns, never invents; interpolation is opt-in, marked
DERIVED with method + parents + limitations.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

INTERVALS = {"15min": 900, "30min": 1800, "1h": 3600, "3h": 10800, "6h": 21600}
CANONICAL_STEP = "1h"


def ensure_utc(dt: datetime, assume_utc_if_naive: bool = True) -> datetime:
    if dt.tzinfo is None:
        if not assume_utc_if_naive:
            raise ValueError(f"naive timestamp with no source tz: {dt}")
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def floor_to_step(dt: datetime, step_s: int) -> datetime:
    epoch = int(dt.timestamp())
    return datetime.fromtimestamp(epoch - epoch % step_s, tz=timezone.utc)


class TemporalRecord:
    """One timestamped value with explicit time roles."""

    def __init__(self, source_timestamp: datetime, value, *, valid_time=None,
                 run_time=None, ingestion_time=None, derived_from=(), method="observed"):
        self.source_timestamp = ensure_utc(source_timestamp)
        self.valid_time = ensure_utc(valid_time) if valid_time else self.source_timestamp
        self.run_time = ensure_utc(run_time) if run_time else None
        self.ingestion_time = ensure_utc(ingestion_time) if ingestion_time else None
        self.value = value
        self.derived_from = tuple(derived_from)
        self.method = method  # "observed" | "interpolated:<m>" | "imputed:<m>"


def align(records: list[TemporalRecord], step: str = CANONICAL_STEP,
          interpolate: str | None = None) -> list[TemporalRecord]:
    """Bin records onto the canonical grid. Empty bins stay empty (MISSING downstream)
    unless interpolate="linear", which fills them as DERIVED (method recorded)."""
    step_s = INTERVALS[step]
    bins: dict[datetime, list[TemporalRecord]] = {}
    for r in records:
        bins.setdefault(floor_to_step(r.valid_time, step_s), []).append(r)
    for members in bins.values():
        members.sort(key=lambda r: r.valid_time)
    if not bins:
        return []
    lo, hi = min(bins), max(bins)
    out: list[TemporalRecord] = []
    t = lo
    while t <= hi:
        members = bins.get(t, [])
        if members:
            latest = members[-1]
            # Representative carries the BIN timestamp (clean joins downstream);
            # the original observation time survives in source_timestamp.
            out.append(TemporalRecord(
                latest.source_timestamp, latest.value, valid_time=t,
                run_time=latest.run_time, ingestion_time=latest.ingestion_time,
                derived_from=latest.derived_from, method=latest.method))
        elif interpolate == "linear":
            bracket = _bracket(bins, t)
            if bracket:
                (t0, r0), (t1, r1) = bracket
                frac = (t - t0).total_seconds() / (t1 - t0).total_seconds()
                out.append(TemporalRecord(
                    t, r0.value + frac * (r1.value - r0.value), valid_time=t,
                    derived_from=(t0.isoformat(), t1.isoformat()),
                    method="interpolated:linear",
                ))
        t += timedelta(seconds=step_s)
    return out


def _bracket(bins: dict, t: datetime):
    before = [k for k in bins if k < t]
    after = [k for k in bins if k > t]
    if before and after:
        t0, t1 = max(before), min(after)
        return (t0, bins[t0][-1]), (t1, bins[t1][-1])
    return None


def split_chronological(items: list, train_frac: float = 0.7, val_frac: float = 0.15) -> dict:
    """Chronological train/val/test split. Shuffling time series is forbidden
    (see leakage docs); this helper makes the safe path the easy path."""
    n = len(items)
    i, j = int(n * train_frac), int(n * (train_frac + val_frac))
    return {"train": items[:i], "val": items[i:j], "test": items[j:],
            "rule": "chronological — no shuffle"}


def assert_no_future_leakage(feature_times: list[datetime], target_time: datetime) -> None:
    """Guard: no feature may come from after the prediction target time."""
    target = ensure_utc(target_time)
    violators = [t.isoformat() for t in feature_times if ensure_utc(t) > target]
    if violators:
        raise ValueError(f"future leakage: {len(violators)} features after target {target.isoformat()}")
