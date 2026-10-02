"""Multi-source rainfall/NWP fusion (Phase 2). Deterministic, provenance-aware.

Policy (documented, no blind averaging):
1. Normalize each provider output to CanonicalRecord (units converted centrally,
   source_type preserved exactly: OBSERVATION / ANALYSIS / FORECAST / MODELLED).
2. Compatibility gate: same variable semantics + same accumulation window +
   timestamps within 30 min + co-located + quality != INVALID. Anything else is
   REJECTED with reasons (never silently combined).
3. One compatible source → return it as SELECTION (never called "fusion").
4. Multiple → weighted mean (default equal weights, config-recorded) with full
   contributor list. Classifications preserved per contributor.
5. Zero usable sources → structured UNAVAILABLE.
Priority among compatible sources: OBSERVATION > ANALYSIS > FORECAST >
MODELLED > DERIVED (used for selection display order, not silently).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

FUSION_VERSION = "rainfall-fusion@v0.1.0"
TIME_TOLERANCE_S = 1800
SOURCE_PRIORITY = {"OBSERVATION": 0, "ANALYSIS": 1, "FORECAST": 2, "MODELLED": 3, "DERIVED": 4}


@dataclass
class CanonicalRecord:
    source: str
    variable: str
    timestamp: datetime
    latitude: float
    longitude: float
    value: float
    unit: str
    source_type: str  # OBSERVATION | ANALYSIS | FORECAST | MODELLED | DERIVED
    accum_hours: float  # accumulation window; 0 = instantaneous
    lead_time_h: float | None = None
    quality: str = "UNCHECKED"
    provenance: dict = field(default_factory=dict)


@dataclass
class CompatibilityVerdict:
    compatible: bool
    reasons: list[str]


def check_compatible(a: CanonicalRecord, b: CanonicalRecord) -> CompatibilityVerdict:
    reasons = []
    if a.variable != b.variable:
        reasons.append(f"variable mismatch: {a.variable} vs {b.variable}")
    if a.unit != b.unit:
        reasons.append(f"unit mismatch: {a.unit} vs {b.unit}")
    if abs(a.accum_hours - b.accum_hours) > 1e-9:
        reasons.append(f"accumulation window mismatch: {a.accum_hours}h vs {b.accum_hours}h")
    dt = abs((a.timestamp - b.timestamp).total_seconds())
    if dt > TIME_TOLERANCE_S:
        reasons.append(f"timestamp gap {dt:.0f}s exceeds {TIME_TOLERANCE_S}s")
    if abs(a.latitude - b.latitude) > 0.15 or abs(a.longitude - b.longitude) > 0.15:
        reasons.append("locations not co-located (>0.15° apart)")
    for r, name in ((a, "a"), (b, "b")):
        if r.quality == "INVALID":
            reasons.append(f"record {name} ({r.source}) flagged INVALID")
    return CompatibilityVerdict(not reasons, reasons)


def normalize_openmeteo(variable: str, timestamp: datetime, lat: float, lon: float,
                        value: float, unit: str, kind: str) -> CanonicalRecord:
    """Open-Meteo point value → canonical. kind: FORECAST (hourly) or HISTORICAL."""
    now = datetime.now(timezone.utc)
    ts = timestamp if timestamp.tzinfo else timestamp.replace(tzinfo=timezone.utc)
    return CanonicalRecord(
        source="open-meteo", variable=variable, timestamp=ts, latitude=lat, longitude=lon,
        value=float(value), unit=unit,
        source_type="FORECAST" if kind == "FORECAST" else "HISTORICAL",
        accum_hours=1.0, lead_time_h=(ts - now).total_seconds() / 3600.0,
        quality="UNCHECKED", provenance={"product": "forecast-v1" if kind == "FORECAST" else "archive-v1"})


def normalize_gfs(variable: str, valid_time: datetime, lat: float, lon: float,
                  value: float, unit: str, run_time: datetime, window_h: float) -> CanonicalRecord:
    ts = valid_time if valid_time.tzinfo else valid_time.replace(tzinfo=timezone.utc)
    rt = run_time if run_time.tzinfo else run_time.replace(tzinfo=timezone.utc)
    return CanonicalRecord(
        source="gfs-0p25", variable=variable, timestamp=ts, latitude=lat, longitude=lon,
        value=float(value), unit=unit, source_type="FORECAST",
        accum_hours=float(window_h), lead_time_h=(ts - rt).total_seconds() / 3600.0,
        quality="UNCHECKED", provenance={"model": "GFS", "run": rt.isoformat()})


def fuse(records: list[CanonicalRecord], weights: dict[str, float] | None = None,
         method: str = "mean-of-compatible") -> dict:
    """Deterministic selection/fusion over pre-normalized records."""
    usable = [r for r in records if r.value == r.value]  # drop NaN, count below
    dropped = len(records) - len(usable)
    if not usable:
        return {"outcome": "UNAVAILABLE", "reason": "no usable source records",
                "dropped_nan": dropped, "fusion_version": FUSION_VERSION,
                "uncertainty": {"kind": "missing-source", "status": "NOT_CALIBRATED",
                                "level": "no result exists to qualify"}}
    # Pairwise compatibility against the highest-priority record.
    usable.sort(key=lambda r: SOURCE_PRIORITY.get(r.source_type, 99))
    anchor = usable[0]
    compatible, rejected = [anchor], []
    for r in usable[1:]:
        v = check_compatible(anchor, r)
        if v.compatible:
            compatible.append(r)
        else:
            rejected.append({"record": _summarize(r), "reasons": v.reasons})
    if len(compatible) == 1:
        c = compatible[0]
        return {"outcome": "SELECTION (single source — not fusion)",
                "record": _summarize(c), "method": "priority-selection",
                "rejected": rejected, "dropped_nan": dropped,
                "qc": {c.source: classify_qc(c)},
                "alignment": _alignment([c]),
                "uncertainty": _uncertainty_selection(c),
                "fusion_version": FUSION_VERSION}
    w = weights or {}
    total = sum(w.get(r.source, 1.0) for r in compatible)
    value = sum(r.value * w.get(r.source, 1.0) for r in compatible) / total
    return {"outcome": "FUSED", "method": method,
            "weights": {r.source: w.get(r.source, 1.0) for r in compatible},
            "value": value, "unit": compatible[0].unit,
            "variable": compatible[0].variable,
            "timestamp": max(r.timestamp for r in compatible).isoformat(),
            "contributors": [_summarize(r) for r in compatible],
            "rejected": rejected, "dropped_nan": dropped,
            "qc": {r.source: classify_qc(r) for r in compatible},
            "alignment": _alignment(compatible),
            "uncertainty": _uncertainty_fused(compatible, value),
            "fusion_version": FUSION_VERSION,
            "note": "fused value is DERIVED consensus, never observational truth"}


def classify_qc(r: CanonicalRecord, now=None) -> dict:
    """Deterministic QC: VALID | SUSPECT | MISSING | STALE | OUTLIER | INVALID.

    Rules (documented, no statistics): missing/NaN → MISSING; provider INVALID
    → INVALID; negative rainfall → INVALID (unphysical); >500 mm → OUTLIER
    (extreme-but-possible per Step-4 ranges); valid_time older than
    max(6 h, 2× window) → STALE; provider SUSPECT propagates; else VALID.
    """
    from datetime import datetime, timezone

    now = now or datetime.now(timezone.utc)
    if r.value != r.value:  # NaN
        return {"flag": "MISSING", "reason": "no value"}
    if r.quality == "INVALID":
        return {"flag": "INVALID", "reason": "provider flagged INVALID"}
    if r.value < 0:
        return {"flag": "INVALID", "reason": "negative rainfall is unphysical"}
    if r.value > 500:
        return {"flag": "OUTLIER", "reason": ">500 mm exceeds credible records; kept, not deleted"}
    age_s = (now - r.timestamp).total_seconds()
    if age_s > max(6 * 3600, 2 * r.accum_hours * 3600):
        return {"flag": "STALE", "reason": f"age {age_s / 3600:.1f}h exceeds limit"}
    if r.quality == "SUSPECT":
        return {"flag": "SUSPECT", "reason": "provider flagged SUSPECT"}
    return {"flag": "VALID", "reason": "passed deterministic checks"}


def _alignment(records: list[CanonicalRecord]) -> dict:
    """Explicit alignment metadata: what was compared, how far apart."""
    import math

    def dist_deg(a, b):
        return math.sqrt((a.latitude - b.latitude) ** 2 + (a.longitude - b.longitude) ** 2)

    pairs = []
    for i in range(len(records)):
        for j in range(i + 1, len(records)):
            a, b = records[i], records[j]
            pairs.append({
                "a": a.source, "b": b.source,
                "temporal_diff_s": abs((a.timestamp - b.timestamp).total_seconds()),
                "temporal_tolerance_s": TIME_TOLERANCE_S,
                "spatial_dist_deg": dist_deg(a, b),
                "window_compatible": abs(a.accum_hours - b.accum_hours) < 1e-9,
                "source_types": [a.source_type, b.source_type],
                "quality_flags": [a.quality, b.quality],
            })
    return {"pairs": pairs,
            "windows": {r.source: r.accum_hours for r in records},
            "note": "no resampling performed; mismatch rejects, never blends"}


def _uncertainty_selection(c: CanonicalRecord) -> dict:
    """Single source: nothing to cross-check against — stated, not quantified."""
    return {"kind": "selection", "status": "NOT_CALIBRATED",
            "level": "UNQUANTIFIED (single source — no independent check exists)",
            "factors": [f"source_type={c.source_type}", f"qc={classify_qc(c)['flag']}",
                        f"lead_time_h={c.lead_time_h}"],
            "note": "qualitative structural uncertainty only; no percentages, no confidence"}


def _uncertainty_fused(compatible: list[CanonicalRecord], value: float) -> dict:
    """Fusion spread as disagreement signal — descriptive, never calibrated."""
    vals = [r.value for r in compatible]
    spread = max(vals) - min(vals)
    denom = max(abs(value), 1e-9)
    agreement = "agree" if spread / denom <= 0.5 else "disagree"
    return {"kind": "fusion", "status": "NOT_CALIBRATED",
            "spread": spread, "relative_spread": spread / denom,
            "agreement": agreement,
            "factors": [f"{r.source}={r.value}{r.unit} ({r.source_type})" for r in compatible],
            "note": "spread describes contributor disagreement only; not a confidence interval"}


def _summarize(r: CanonicalRecord) -> dict:
    return {"source": r.source, "variable": r.variable,
            "timestamp": r.timestamp.isoformat(), "value": r.value, "unit": r.unit,
            "source_type": r.source_type, "accum_hours": r.accum_hours,
            "lead_time_h": r.lead_time_h, "quality": r.quality,
            "provenance": r.provenance}


def canonical_from_imerg(payload: dict) -> CanonicalRecord:
    """Provider payload dict → CanonicalRecord. The provider's source_type_note
    folds into provenance (schema stays single, Step-4 envelope preserved)."""
    prov = dict(payload.get("provenance", {}))
    if "source_type_note" in payload:
        prov["source_type_note"] = payload["source_type_note"]
    return CanonicalRecord(
        source=payload["source"], variable=payload["variable"],
        timestamp=payload["timestamp"], latitude=payload["latitude"],
        longitude=payload["longitude"], value=payload["value"], unit=payload["unit"],
        source_type=payload["source_type"], accum_hours=payload["accum_hours"],
        lead_time_h=payload.get("lead_time_h"), quality=payload.get("quality", "UNCHECKED"),
        provenance=prov)
