"""Demo seed: clearly-labelled SYNTHETIC rows inserted only when tables are empty.

Never mixes with real rows: every seeded row carries source='DEMO' (or
verification='demo') and the seed skips tables that already have data.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from .models import platform as m

SENSORS = [
    ("MEG-042", 25.5801, 91.8951), ("MEG-043", 25.5772, 91.8915),
    ("AS-011", 26.1458, 91.7378), ("SK-003", 27.3402, 88.6065),
    ("MZ-019", 23.7284, 92.7192), ("NL-012", 25.6764, 94.1102),
]

ROADS = [
    ("RD-01", "Shillong-Dawki", "HIGH RISK", 25.4, 91.95),
    ("RD-02", "Shillong-Cherrapunji", "CAUTION", 25.42, 91.82),
    ("RD-03", "Guwahati-Shillong", "OPEN", 25.9, 91.8),
    ("RD-04", "Aizawl-Silchar", "CAUTION", 24.0, 92.8),
    ("RD-05", "Gangtok-Nathula", "HIGH RISK", 27.4, 88.7),
]

PLACES = [
    ("H-MEG-1", "hospital", "Shillong Civil Hospital (demo)", 25.5785, 91.89, 0),
    ("E-MEG-1", "response", "East Khasi Response Station (demo)", 25.575, 91.9, 0),
    ("S-MEG-1", "shelter", "Shillong Relief Shelter (demo)", 25.585, 91.885, 800),
    ("V-MEG-1", "village", "Mawlynnong village (demo)", 25.2, 91.92, 500),
    ("B-MEG-1", "bridge", "Dawki Bridge (demo)", 25.18, 92.02, 0),
    ("SC-MEG-1", "school", "Dawki Secondary School (demo)", 25.19, 92.01, 300),
]

HISTORY = [
    ("HIST-DEMO-001", "2019-07-14", 25.27, 91.73, 210.0, 36.0, "high"),
    ("HIST-DEMO-002", "2021-06-28", 27.34, 88.61, 180.0, 39.0, "moderate"),
    ("HIST-DEMO-003", "2022-08-02", 23.73, 92.72, 240.0, 35.0, "high"),
    ("HIST-DEMO-004", "2023-07-19", 25.58, 91.89, 265.0, 41.0, "critical"),
]

UNITS = [
    ("FIRE-1", "fire", 25.57, 91.9), ("AMB-2", "ambulance", 25.575, 91.895),
    ("POL-3", "police", 25.58, 91.885), ("TEAM-4", "team", 25.572, 91.9),
    ("DRN-5", "drone", 25.578, 91.893),
]


def seed_demo(db: Session) -> dict:
    inserted: dict = {}
    if db.query(m.Sensor).count() == 0:
        db.add_all([m.Sensor(id=s, lat=la, lon=lo) for s, la, lo in SENSORS])
        inserted["sensors"] = len(SENSORS)
    if db.query(m.Road).count() == 0:
        db.add_all([m.Road(id=r, name=n, status=s, lat=la, lon=lo)
                    for r, n, s, la, lo in ROADS])
        inserted["roads"] = len(ROADS)
    if db.query(m.Place).count() == 0:
        db.add_all([m.Place(id=i, kind=k, name=n, lat=la, lon=lo, capacity=c)
                    for i, k, n, la, lo, c in PLACES])
        inserted["places"] = len(PLACES)
    if db.query(m.HistoricalIncident).count() == 0:
        db.add_all([m.HistoricalIncident(id=i, date=d, lat=la, lon=lo,
                                         rainfall_mm=r, slope_deg=s,
                                         severity=sev, source="DEMO",
                                         verification="demo")
                    for i, d, la, lo, r, s, sev in HISTORY])
        inserted["history"] = len(HISTORY)
    if db.query(m.ResponseUnit).count() == 0:
        db.add_all([m.ResponseUnit(id=u, kind=k, lat=la, lon=lo)
                    for u, k, la, lo in UNITS])
        inserted["units"] = len(UNITS)
    db.commit()
    return {"seeded": inserted, "note": "All seeded rows are labeled DEMO."}
