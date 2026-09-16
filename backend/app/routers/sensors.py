"""Sensor network: ESP32/LoRa/MQTT/HTTP-ready ingestion + demo telemetry.

Ingestion accepts generic JSON so ESP32 HTTP, LoRa gateways and MQTT
bridges can POST the same schema. Real vs demo rows are distinguished by
the `source` field (defaults to DEMO for seeded rows, 'live' for ingest).
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import platform as m
from ..services.security import require_perm

router = APIRouter(prefix="/api/v1/sensors", tags=["sensors"])

ANOMALY_SOIL = 90.0
LOW_BATTERY = 20.0


class IngestReading(BaseModel):
    sensor_id: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    soil_moisture: float = Field(..., ge=0, le=100)
    temperature: float = -273.0
    battery: float = Field(100.0, ge=0, le=100)
    signal: float = Field(100.0, ge=0, le=100)
    source: str = "live"


def _status_for(r: IngestReading) -> str:
    if r.battery < 5 or r.signal < 5:
        return "offline"
    if r.soil_moisture >= ANOMALY_SOIL or r.battery < LOW_BATTERY:
        return "anomaly"
    return "online"


@router.post("/ingest")
def ingest(r: IngestReading, db: Session = Depends(get_db),
           ident=Depends(require_perm("report"))):
    _ = ident
    sensor = db.get(m.Sensor, r.sensor_id)
    if not sensor:
        sensor = m.Sensor(id=r.sensor_id, lat=r.lat or 0.0, lon=r.lon or 0.0,
                          source=r.source)
        db.add(sensor)
    else:
        if r.lat is not None:
            sensor.lat = r.lat
        if r.lon is not None:
            sensor.lon = r.lon
    sensor.status = _status_for(r)
    db.add(m.SensorReading(sensor_id=r.sensor_id, soil_moisture=r.soil_moisture,
                           temperature=r.temperature, battery=r.battery,
                           signal=r.signal))
    db.commit()
    return {"ok": True, "sensor_id": r.sensor_id, "status": sensor.status,
            "ts": datetime.now(timezone.utc).isoformat()}


@router.get("/network")
def list_sensors(db: Session = Depends(get_db)):
    """Full network view. (GET /api/v1/sensors legacy path also carries a
    summary via api_v1 for backward compatibility.)"""
    sensors = db.query(m.Sensor).all()
    out = []
    for s in sensors:
        last = (db.query(m.SensorReading)
                .filter_by(sensor_id=s.id).order_by(m.SensorReading.id.desc())
                .first())
        out.append({
            "sensor_id": s.id, "lat": s.lat, "lon": s.lon, "kind": s.kind,
            "status": s.status, "source": s.source,
            "last": ({
                "soil_moisture": last.soil_moisture, "temperature": last.temperature,
                "battery": last.battery, "signal": last.signal,
                "ts": last.ts.isoformat() if last.ts else None,
                "anomaly": last.soil_moisture >= ANOMALY_SOIL,
                "low_battery": last.battery < LOW_BATTERY,
            } if last else None),
        })
    return {"count": len(out), "sensors": out}


@router.get("/{sensor_id}")
def sensor_detail(sensor_id: str, db: Session = Depends(get_db)):
    s = db.get(m.Sensor, sensor_id)
    if not s:
        raise HTTPException(status_code=404, detail="Unknown sensor")
    last = (db.query(m.SensorReading).filter_by(sensor_id=sensor_id)
            .order_by(m.SensorReading.id.desc()).first())
    return {"sensor_id": s.id, "lat": s.lat, "lon": s.lon, "status": s.status,
            "source": s.source,
            "last": ({k: getattr(last, k) for k in
                      ("soil_moisture", "temperature", "battery", "signal")}
                     if last else None)}


@router.get("/{sensor_id}/history")
def sensor_history(sensor_id: str, limit: int = 50,
                   db: Session = Depends(get_db)):
    rows = (db.query(m.SensorReading).filter_by(sensor_id=sensor_id)
            .order_by(m.SensorReading.id.desc()).limit(min(limit, 500)).all())
    return {"sensor_id": sensor_id, "count": len(rows), "history": [
        {"soil_moisture": r.soil_moisture, "temperature": r.temperature,
         "battery": r.battery, "signal": r.signal,
         "ts": r.ts.isoformat() if r.ts else None} for r in rows]}
