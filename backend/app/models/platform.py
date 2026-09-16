"""Platform ORM models — additive, existing telemetry has no tables (untouched)."""
from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import (Boolean, DateTime, Float, ForeignKey, Integer, String,
                        Text)
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    role: Mapped[str] = mapped_column(String(40), default="citizen")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Sensor(Base):
    __tablename__ = "sensors"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lon: Mapped[float] = mapped_column(Float, default=0.0)
    kind: Mapped[str] = mapped_column(String(20), default="soil")
    status: Mapped[str] = mapped_column(String(20), default="online")
    source: Mapped[str] = mapped_column(String(20), default="DEMO")


class SensorReading(Base):
    __tablename__ = "sensor_readings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sensor_id: Mapped[str] = mapped_column(String(40), index=True)
    soil_moisture: Mapped[float] = mapped_column(Float, default=0.0)
    temperature: Mapped[float] = mapped_column(Float, default=0.0)
    battery: Mapped[float] = mapped_column(Float, default=100.0)
    signal: Mapped[float] = mapped_column(Float, default=100.0)
    ts: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)


class WeatherObs(Base):
    __tablename__ = "weather_observations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lon: Mapped[float] = mapped_column(Float, default=0.0)
    rain_1h: Mapped[float] = mapped_column(Float, default=0.0)
    rain_24h: Mapped[float] = mapped_column(Float, default=0.0)
    temp_c: Mapped[float] = mapped_column(Float, default=0.0)
    source: Mapped[str] = mapped_column(String(40), default="DEMO")
    ts: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class TerrainFeature(Base):
    __tablename__ = "terrain_features"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lat: Mapped[float] = mapped_column(Float, index=True)
    lon: Mapped[float] = mapped_column(Float, index=True)
    elevation_m: Mapped[float] = mapped_column(Float, default=0.0)
    slope_deg: Mapped[float] = mapped_column(Float, default=0.0)
    aspect_deg: Mapped[float] = mapped_column(Float, default=0.0)
    curvature: Mapped[float] = mapped_column(Float, default=0.0)
    roughness: Mapped[float] = mapped_column(Float, default=0.0)
    drainage: Mapped[float] = mapped_column(Float, default=0.0)
    hill_cutting: Mapped[float] = mapped_column(Float, default=0.0)
    source: Mapped[str] = mapped_column(String(40), default="DEMO")


class SatelliteObs(Base):
    __tablename__ = "satellite_observations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lon: Mapped[float] = mapped_column(Float, default=0.0)
    change_pct: Mapped[float] = mapped_column(Float, default=0.0)
    vegetation_delta: Mapped[float] = mapped_column(Float, default=0.0)
    resolution_m: Mapped[str] = mapped_column(String(20), default="30m")
    data_type: Mapped[str] = mapped_column(String(40), default="optical-demo")
    source: Mapped[str] = mapped_column(String(60), default="SIMULATED")
    captured_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class HistoricalIncident(Base):
    __tablename__ = "historical_incidents"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    date: Mapped[str] = mapped_column(String(20), default="")
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lon: Mapped[float] = mapped_column(Float, default=0.0)
    rainfall_mm: Mapped[float] = mapped_column(Float, default=0.0)
    slope_deg: Mapped[float] = mapped_column(Float, default=0.0)
    severity: Mapped[str] = mapped_column(String(20), default="moderate")
    casualties: Mapped[str] = mapped_column(String(20), default="unknown")
    damage: Mapped[str] = mapped_column(String(200), default="")
    road_status: Mapped[str] = mapped_column(String(40), default="UNKNOWN")
    source: Mapped[str] = mapped_column(String(80), default="DEMO")
    verification: Mapped[str] = mapped_column(String(20), default="demo")


class Prediction(Base):
    __tablename__ = "predictions"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lon: Mapped[float] = mapped_column(Float, default=0.0)
    probability: Mapped[float] = mapped_column(Float, default=0.0)
    risk_level: Mapped[str] = mapped_column(String(20), default="LOW")
    model_version: Mapped[str] = mapped_column(String(60), default="")
    simulated: Mapped[bool] = mapped_column(Boolean, default=True)
    ts: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class RiskCell(Base):
    __tablename__ = "risk_cells"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    lat: Mapped[float] = mapped_column(Float, index=True)
    lon: Mapped[float] = mapped_column(Float, index=True)
    probability: Mapped[float] = mapped_column(Float, default=0.0)
    risk_level: Mapped[str] = mapped_column(String(20), default="LOW")
    source: Mapped[str] = mapped_column(String(20), default="DEMO")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    level: Mapped[str] = mapped_column(String(20), default="WATCH")
    title: Mapped[str] = mapped_column(String(200), default="")
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lon: Mapped[float] = mapped_column(Float, default=0.0)
    source: Mapped[str] = mapped_column(String(20), default="DEMO")
    ts: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    channel: Mapped[str] = mapped_column(String(20), default="web")
    audience: Mapped[str] = mapped_column(String(40), default="citizen")
    title: Mapped[str] = mapped_column(String(200), default="")
    status: Mapped[str] = mapped_column(String(30), default="queued")
    ts: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class FieldReport(Base):
    __tablename__ = "field_reports"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    incident_type: Mapped[str] = mapped_column(String(40), default="other")
    severity: Mapped[str] = mapped_column(String(20), default="moderate")
    description: Mapped[str] = mapped_column(Text, default="")
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lon: Mapped[float] = mapped_column(Float, default=0.0)
    reporter_type: Mapped[str] = mapped_column(String(20), default="citizen")
    media: Mapped[str] = mapped_column(String(400), default="")
    ai_suggestion: Mapped[str] = mapped_column(String(400), default="")
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    ts: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Road(Base):
    __tablename__ = "roads"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), default="")
    status: Mapped[str] = mapped_column(String(20), default="UNKNOWN")
    cause: Mapped[str] = mapped_column(String(200), default="")
    severity: Mapped[str] = mapped_column(String(20), default="moderate")
    alternate_route: Mapped[str] = mapped_column(String(200), default="")
    bridge_status: Mapped[str] = mapped_column(String(40), default="UNKNOWN")
    eta_clearance_min: Mapped[int] = mapped_column(Integer, default=0)
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lon: Mapped[float] = mapped_column(Float, default=0.0)


class Place(Base):
    """Villages, hospitals, shelters, bridges, schools, infrastructure."""
    __tablename__ = "places"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    kind: Mapped[str] = mapped_column(String(30), index=True)
    name: Mapped[str] = mapped_column(String(200), default="")
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lon: Mapped[float] = mapped_column(Float, default=0.0)
    capacity: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(60), default="OPEN")
    source: Mapped[str] = mapped_column(String(20), default="DEMO")


class ResponseUnit(Base):
    __tablename__ = "response_units"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    kind: Mapped[str] = mapped_column(String(30), default="team")
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lon: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(30), default="ready")
    source: Mapped[str] = mapped_column(String(20), default="DEMO")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    actor: Mapped[str] = mapped_column(String(80), default="system")
    action: Mapped[str] = mapped_column(String(120), default="")
    detail: Mapped[str] = mapped_column(Text, default="")
    ts: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class ModelVersion(Base):
    __tablename__ = "model_versions"
    version: Mapped[str] = mapped_column(String(60), primary_key=True)
    trained_at: Mapped[str] = mapped_column(String(40), default="")
    data_kind: Mapped[str] = mapped_column(String(30), default="SYNTHETIC-DEMO")
    f1: Mapped[float] = mapped_column(Float, default=0.0)
    roc_auc: Mapped[float] = mapped_column(Float, default=0.0)
    active: Mapped[bool] = mapped_column(Boolean, default=False)
