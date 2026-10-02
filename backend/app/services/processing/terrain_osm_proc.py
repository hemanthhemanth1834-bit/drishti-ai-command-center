"""Terrain + OSM processing (Step 4). Point/attribute level only — raster
hydrology (slope/flow/direction/accumulation grids) is Step-10 work with
rasterio/GDAL; this module defines the record shapes it will consume.
"""

from __future__ import annotations

from app.services.processing import qc
from app.services.processing.spatial import CANONICAL_CRS


def process_elevation(fetch: dict) -> dict:
    """SRTM point fetch → elevation record preserving source/resolution/units/CRS."""
    obs = (fetch.get("observations") or [None])[0] or {}
    value = obs.get("value")
    return {
        "variable": "elevation", "latitude": obs.get("latitude"),
        "longitude": obs.get("longitude"), "value": value, "unit": "m",
        "vertical_datum": "EGM96 (SRTM default; verify per tile in Step 10)",
        "source": fetch.get("source_id"), "resolution": "30m", "crs": CANONICAL_CRS,
        "quality": qc.flag_value("elevation", value),
        # Architecture hooks for Step 10 (shapes defined, computation deferred):
        "derived_pending": ["slope", "aspect", "flow_direction", "flow_accumulation"],
        "provenance_run_id": fetch.get("provenance_run_id"),
    }


def process_osm(fetch: dict) -> dict:
    """Overpass elements → validated features. Invalid geometries removed ONLY
    with an explicit log entry; attribution always preserved."""
    kept, removed = [], []
    for el in fetch.get("elements", []):
        geom = _to_geometry(el)
        verdict = qc.validate_geometry(geom) if geom else "INVALID: no geometry"
        if verdict == "VALID":
            kept.append({"id": el.get("id"), "type": el.get("type"),
                         "tags": el.get("tags", {}), "geometry": geom})
        else:
            removed.append({"id": el.get("id"), "reason": verdict})
    return {"category": fetch.get("category"), "features": kept,
            "removed_with_reason": removed,
            "quality_summary": {"received": len(fetch.get("elements", [])),
                                "valid": len(kept), "invalid_logged": len(removed)},
            "attribution": fetch.get("attribution"), "license": fetch.get("license"),
            "crs": CANONICAL_CRS, "provenance_run_id": fetch.get("provenance_run_id")}


def _to_geometry(el: dict) -> dict | None:
    if el.get("type") == "node" and "lat" in el and "lon" in el:
        return {"type": "Point", "coordinates": [el["lon"], el["lat"]]}
    if el.get("type") == "way" and isinstance(el.get("geometry"), list):
        pts = [[p["lon"], p["lat"]] for p in el["geometry"] if "lon" in p and "lat" in p]
        if len(pts) >= 2:
            if len(pts) >= 4 and pts[0] == pts[-1]:
                return {"type": "Polygon", "coordinates": [pts]}
            return {"type": "LineString", "coordinates": pts}
    return None
