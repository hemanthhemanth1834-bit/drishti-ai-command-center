"""Validation routes (Step 9). Event registry + latest validation metrics.
Observed and modelled data stay separate; no skill is claimed beyond measured.
"""

import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

router = APIRouter()
REPO = Path(__file__).resolve().parents[3]
EVENTS = {
    "yamuna-delhi-20230712": {
        "scene": "EOS-RS_20230712_FPM_S1_India_NewDelhi_Floods_v0.9",
        "scene_date": "2023-07-12", "rain_window": ["2023-07-08", "2023-07-14"],
        "source": "EOS-RS Sentinel-1 Flood Proxy Map via Sentinel Asia (preliminary)",
        "license": "academic/research use; cite EOS-RS + Sentinel Asia",
        "manifest": "validation-yamuna-20230712_manifest.json",
    }
}
# Second historical event: legitimately BLOCKED — no free machine-readable
# reference flood-extent dataset is obtainable without Earthdata/Copernicus
# authentication in this environment. The contract below exposes the block
# explicitly instead of fabricating a second event to fill the comparison table.
SECOND_EVENT_BLOCKED = {
    "event_id": "second-event-pending",
    "status": "BLOCKED — AUTHENTICATION REQUIRED",
    "reason": ("Second reference flood-extent dataset requires NASA Earthdata / "
               "Copernicus Data Space credentials (GPM IMERG downloads, Sentinel-1 "
               "GRD via CDSE). No credentials are configured in this environment; "
               "no dataset is scraped or fabricated. See DATA-SOURCES.md."),
    "required": ["NASA Earthdata username/password for IMERG", "CDSE credentials for Sentinel-1"],
    "workflow": "docs: DATA-SOURCES.md § satellite + validation manifests under data/metadata/",
}


@router.get("/status")
def validation_status() -> dict:
    import json

    done = []
    for eid, ev in EVENTS.items():
        meta = REPO / "data" / "metadata" / ev["manifest"]
        done.append({"event_id": eid, **ev,
                     "status": "CONFIGURED" if meta.exists() else "PENDING",
                     "metrics": (json.loads(meta.read_text()).get("metrics")
                                 if meta.exists() else None)})
    return {"validation_status": "CONFIGURED" if all(d["status"] == "CONFIGURED" for d in done)
            else "PARTIAL",
            "leakage": "none — deterministic engine, no training in validation path",
            "events": done,
            "second_event": SECOND_EVENT_BLOCKED}


@router.get("/events")
def validation_events() -> dict:
    """List every registered event (multi-event contract): id + status + metrics.
    Yamuna 2023 remains first; future events append without route changes."""
    return {"events": validation_status()["events"],
            "second_event": SECOND_EVENT_BLOCKED}


@router.get("/events/{event_id}")
def validation_event(event_id: str) -> dict:
    import json

    if event_id not in EVENTS:
        raise HTTPException(status_code=404, detail=f"unknown event: {event_id}")
    meta = REPO / "data" / "metadata" / EVENTS[event_id]["manifest"]
    if not meta.exists():
        raise HTTPException(status_code=503, detail={"status": "PENDING",
                                                     "reason": "run scripts/validate_inundation.py"})
    return json.loads(meta.read_text(encoding="utf-8"))
