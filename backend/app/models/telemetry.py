"""Pydantic schemas for DRISHTI-X telemetry (drones, sensors, alerts)."""
from pydantic import BaseModel, Field


class TelemetryPacket(BaseModel):
    id: str
    tick: int
    ts: float
    scenario: str = "nominal"
    drone_id: str
    lat: float
    lon: float
    alt_m: float
    speed_ms: float
    battery_pct: float
    signal_pct: float
    temp_c: float = 32.0
    mode: str = "AUTO-MESH"


class SensorReading(BaseModel):
    sensor_id: str
    kind: str = Field(examples=["thermal", "seismic", "air-quality"])
    value: float
    unit: str = ""
    lat: float = 17.3850
    lon: float = 78.4867


class Alert(BaseModel):
    alert_id: str
    severity: str = Field(examples=["info", "warning", "critical"])
    message: str
    lat: float | None = None
    lon: float | None = None


class ScenarioRequest(BaseModel):
    scenario: str = "nominal"
