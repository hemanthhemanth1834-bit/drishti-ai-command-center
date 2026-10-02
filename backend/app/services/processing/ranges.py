"""Configurable physical validation ranges (Step 4). Every threshold documented.

Two-tier design (spec §5):
- IMPOSSIBLE: violates physics or credible measurement → flag INVALID.
- EXTREME: rare but recorded on Earth → flag OUTLIER (kept, never auto-deleted).

Rationale sources: WMO record extremes + instrument limits + margin.
Tune per pilot region in Step 5; overrides pass through `Ranges.with_overrides`.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class VariableRange:
    impossible_lo: float
    impossible_hi: float
    extreme_lo: float
    extreme_hi: float
    unit: str
    rationale: str


RANGES: dict[str, VariableRange] = {
    "precipitation": VariableRange(
        impossible_lo=0.0, impossible_hi=500.0,
        extreme_lo=0.0, extreme_hi=100.0, unit="mm per timestep",
        rationale=(
            "Negative rain is unphysical. 500 mm in one timestep exceeds every credibly "
            "recorded hourly total (≈400 mm/h, La Réunion-class cloudbursts) with margin, "
            "so values above it are instrument/transmission errors. 100 mm/h+ is "
            "'cloudburst class' — extreme but possible; flagged OUTLIER for neighbour "
            "cross-check, never deleted. Thresholds assume hourly-or-longer steps; "
            "sub-hourly steps scale linearly in Step 5."),
    ),
    "temperature_2m": VariableRange(
        impossible_lo=-90.0, impossible_hi=60.0,
        extreme_lo=-40.0, extreme_hi=50.0, unit="°C",
        rationale=(
            "Bounds bracket the recorded Earth surface range (−89.2 °C Vostok 1983, "
            "56.7 °C Death Valley 1913) with margin. Indian plains heat (up to ~50 °C, "
            "e.g. Phalodi 51 °C 2016) sits at the EXTREME boundary — flagged for "
            "cross-check, never deleted."),
    ),
    "relative_humidity_2m": VariableRange(
        impossible_lo=0.0, impossible_hi=100.0,
        extreme_lo=0.0, extreme_hi=100.0, unit="%",
        rationale="Closed 0–100 scale by definition; supersaturation artefacts (>100) are INVALID.",
    ),
    "pressure_msl": VariableRange(
        impossible_lo=870.0, impossible_hi=1090.0,
        extreme_lo=920.0, extreme_hi=1050.0, unit="hPa",
        rationale=(
            "Brackets the recorded MSL range (870 hPa Typhoon Tip 1979, 1084 hPa Mongolia 2001) "
            "with margin. Monsoon lows (~980–1000) are comfortably VALID."),
    ),
    "wind_speed_10m": VariableRange(
        impossible_lo=0.0, impossible_hi=120.0,
        extreme_lo=0.0, extreme_hi=60.0, unit="m/s",
        rationale=(
            "120 m/s exceeds the strongest credibly measured surface gusts outside tornadoes "
            "(113 m/s Olivia 1996) with margin. Cyclone landfalls (30–60 m/s) are EXTREME, valid."),
    ),
    "wind_direction_10m": VariableRange(
        impossible_lo=0.0, impossible_hi=360.0,
        extreme_lo=0.0, extreme_hi=360.0, unit="°",
        rationale="Circular 0–360 scale; 360 accepted as equivalent to 0.",
    ),
    "elevation": VariableRange(
        impossible_lo=-500.0, impossible_hi=9000.0,
        extreme_lo=-100.0, extreme_hi=6000.0, unit="m",
        rationale="Dead Sea (−430 m) to Everest (8849 m) bracketed; Indian pilot terrain is far inside.",
    ),
}


@dataclass
class Ranges:
    table: dict[str, VariableRange] = field(default_factory=lambda: dict(RANGES))

    def with_overrides(self, overrides: dict[str, dict]) -> "Ranges":
        merged = dict(self.table)
        for var, patch in overrides.items():
            base = merged[var]
            merged[var] = VariableRange(**{**base.__dict__, **patch,
                                           "rationale": patch.get("rationale", base.rationale + " [overridden]")})
        return Ranges(merged)

    def classify(self, variable: str, value: float) -> str:
        """VALID | OUTLIER (extreme-but-possible) | INVALID (impossible) | UNCHECKED."""
        spec = self.table.get(variable)
        if spec is None:
            return "UNCHECKED"
        if not (spec.impossible_lo <= value <= spec.impossible_hi):
            return "INVALID"
        if not (spec.extreme_lo <= value <= spec.extreme_hi):
            return "OUTLIER"
        return "VALID"
