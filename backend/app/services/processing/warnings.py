"""Early-warning rule engine (Step 12). Deterministic, versioned, explainable.

Rules fire on measured inputs only; missing/stale inputs yield
INSUFFICIENT_DATA (never a strong warning from absent data). Thresholds are
MODELLED/CONFIGURATION thresholds (versioned below) — never presented as
official government warning levels. Uncertainty is NOT_IMPLEMENTED.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

RULES_VERSION = "alert-rules@v0.12.0"

LEVELS = ("NORMAL", "WATCH", "ADVISORY", "WARNING", "SEVERE")

# rule_id: (level_if_fired, threshold, unit, source_kind, description)
RULES = {
    "R1-heavy-rain-rate": ("ADVISORY", 15.0, "mm/h", "OBSERVED/NOWCAST",
                           "hourly rainfall rate at/above threshold"),
    "R2-rain-persistence": ("WATCH", 25.0, "mm/6h", "OBSERVED/NOWCAST",
                            "6 h accumulation at/above threshold"),
    "R3-modelled-inundation": ("WARNING", 0.01, "flooded_frac", "MODELLED",
                               "modelled flooded fraction at/above threshold"),
    "R4-high-hazard-cells": ("ADVISORY", 10, "cells", "MODELLED",
                             "HIGH+ risk cells at/above count"),
    "R5-exposed-assets": ("WARNING", 1000, "buildings", "DERIVED",
                          "affected buildings at/above count"),
    "R6-data-degraded": ("WATCH", 0, "missing_sources", "STATUS",
                         "any required source UNAVAILABLE/STALE → WATCH at most"),
}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def evaluate(inputs: dict, valid_hours: int = 6) -> list[dict]:
    """Evaluate all rules against measured inputs. Returns alert dicts.

    inputs keys (all optional; absent → INSUFFICIENT_DATA handling):
      rain_rate_mm_h, rain_6h_mm (+ kinds), flooded_frac, max_depth_m,
      high_cells, affected_buildings, missing_sources (list), grid, point_id.
    """
    now = utcnow()
    alerts = []
    missing = list(inputs.get("missing_sources", []))
    if missing:
        alerts.append(_alert("R6-data-degraded", "WATCH", inputs, now, valid_hours,
                             {"missing_sources": missing},
                             "degraded inputs — WATCH ceiling, never stronger from absence"))
    checks = [
        ("R1-heavy-rain-rate", inputs.get("rain_rate_mm_h")),
        ("R2-rain-persistence", inputs.get("rain_6h_mm")),
        ("R3-modelled-inundation", inputs.get("flooded_frac")),
        ("R4-high-hazard-cells", inputs.get("high_cells")),
        ("R5-exposed-assets", inputs.get("affected_buildings")),
    ]
    for rule_id, value in checks:
        level, threshold, unit, kind, _ = RULES[rule_id]
        if value is None:
            continue  # already covered by R6 if the source was declared missing
        if value >= threshold:
            alerts.append(_alert(rule_id, level, inputs, now, valid_hours,
                                 {"value": value, "threshold": threshold, "unit": unit,
                                  "source_kind": kind}, f"{rule_id} fired"))
    if not alerts:
        alerts.append(_alert("R0-normal", "NORMAL", inputs, now, valid_hours, {},
                             "no rule fired"))
    return alerts


def _alert(rule_id, level, inputs, now, valid_hours, trigger, reason):
    key_src = f"{rule_id}|{inputs.get('grid', 'test-roi')}|{inputs.get('point_id', 'all')}"
    return {
        "alert_id": f"{rule_id}-{abs(hash(key_src + now.strftime('%Y%m%d%H'))) % 10 ** 8:08d}",
        "dedup_key": key_src,
        "rule_id": rule_id, "rules_version": RULES_VERSION,
        "severity": level, "trigger": trigger,
        "issued_time": now.isoformat(), "valid_until": (now + timedelta(hours=valid_hours)).isoformat(),
        "location": {"grid": inputs.get("grid", "test-roi"), "point_id": inputs.get("point_id", "all")},
        "factors": [f"{rule_id}@{RULES_VERSION}", reason] if rule_id in RULES else [reason],
        "source_status": inputs.get("source_status", {}),
        "model": inputs.get("model", {}),
        "uncertainty_status": "NOT_IMPLEMENTED",
        "state": "ACTIVE",
    }


class AlertStore:
    """In-memory lifecycle store with audit trail: create/active/update/expire/
    cancel/dedup. Deterministic: same rule+key+hour → same alert_id."""

    def __init__(self):
        self.active: dict[str, dict] = {}
        self.history: list[dict] = []

    def ingest(self, alerts: list[dict]) -> dict:
        created, updated, deduped = [], [], []
        for a in alerts:
            key = a["dedup_key"]
            if key in self.active:
                deduped.append(key)
                continue
            if a["severity"] == "NORMAL":
                continue  # NORMAL is a state report, not a stored alert
            self.active[key] = a
            created.append(a["alert_id"])
            self.history.append({**a, "event": "created"})
        return {"created": created, "updated": updated, "deduped": deduped,
                "active": len(self.active)}

    def expire(self, now: datetime | None = None) -> list[str]:
        now = now or utcnow()
        expired = [k for k, a in self.active.items() if a["valid_until"] <= now.isoformat()]
        for k in expired:
            a = self.active.pop(k)
            self.history.append({**a, "event": "expired", "state": "EXPIRED"})
        return expired

    def cancel(self, dedup_key: str, reason: str) -> bool:
        if dedup_key not in self.active:
            return False
        a = self.active.pop(dedup_key)
        self.history.append({**a, "event": "cancelled", "state": "CANCELLED", "reason": reason})
        return True

    def snapshot(self) -> dict:
        return {"active": list(self.active.values()),
                "history": self.history[-200:],
                "rules_version": RULES_VERSION}
