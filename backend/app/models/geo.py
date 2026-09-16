"""Universal geography + sector models (additive).

Hierarchy: Country -> State -> District -> City -> Locality, all
config/DB-driven so new regions need no code changes. Coordinates are
stored ONLY where confidently known; otherwise 0.0 + has_coords=False.
"""
from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Country(Base):
    __tablename__ = "countries"
    code: Mapped[str] = mapped_column(String(8), primary_key=True)  # ISO-ish
    name: Mapped[str] = mapped_column(String(100), default="")
    bbox: Mapped[str] = mapped_column(String(60), default="")  # minlat,minlon,maxlat,maxlon
    source: Mapped[str] = mapped_column(String(40), default="config")


class State(Base):
    __tablename__ = "states"
    code: Mapped[str] = mapped_column(String(16), primary_key=True)
    country_code: Mapped[str] = mapped_column(String(8), index=True)
    name: Mapped[str] = mapped_column(String(100), default="")
    kind: Mapped[str] = mapped_column(String(20), default="state")  # state|ut|province
    source: Mapped[str] = mapped_column(String(40), default="config")


class District(Base):
    __tablename__ = "districts"
    code: Mapped[str] = mapped_column(String(24), primary_key=True)
    state_code: Mapped[str] = mapped_column(String(16), index=True)
    name: Mapped[str] = mapped_column(String(100), default="")
    source: Mapped[str] = mapped_column(String(40), default="config")


class City(Base):
    __tablename__ = "cities"
    code: Mapped[str] = mapped_column(String(24), primary_key=True)
    district_code: Mapped[str] = mapped_column(String(24), index=True)
    name: Mapped[str] = mapped_column(String(100), default="")
    kind: Mapped[str] = mapped_column(String(20), default="city")  # city|municipality|town
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lon: Mapped[float] = mapped_column(Float, default=0.0)
    has_coords: Mapped[bool] = mapped_column(Boolean, default=False)
    coastal: Mapped[bool] = mapped_column(Boolean, default=False)
    source: Mapped[str] = mapped_column(String(40), default="config")


class Locality(Base):
    __tablename__ = "localities"
    code: Mapped[str] = mapped_column(String(32), primary_key=True)
    city_code: Mapped[str] = mapped_column(String(24), index=True)
    name: Mapped[str] = mapped_column(String(120), default="")
    kind: Mapped[str] = mapped_column(String(20), default="locality")  # mandal|ward|village|locality
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lon: Mapped[float] = mapped_column(Float, default=0.0)
    has_coords: Mapped[bool] = mapped_column(Boolean, default=False)
    source: Mapped[str] = mapped_column(String(40), default="config")


class DisasterType(Base):
    __tablename__ = "disaster_types"
    code: Mapped[str] = mapped_column(String(32), primary_key=True)
    sector: Mapped[str] = mapped_column(String(32), index=True)
    name_en: Mapped[str] = mapped_column(String(100), default="")
    name_te: Mapped[str] = mapped_column(String(100), default="")
    source: Mapped[str] = mapped_column(String(40), default="config")


class Sector(Base):
    __tablename__ = "sectors"
    code: Mapped[str] = mapped_column(String(32), primary_key=True)
    name_en: Mapped[str] = mapped_column(String(100), default="")
    name_te: Mapped[str] = mapped_column(String(100), default="")


class Agency(Base):
    __tablename__ = "agencies"
    code: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(160), default="")
    kind: Mapped[str] = mapped_column(String(40), default="government")
    scope: Mapped[str] = mapped_column(String(80), default="district")
    contact: Mapped[str] = mapped_column(String(80), default="")
    source: Mapped[str] = mapped_column(String(40), default="config")


class Resource(Base):
    __tablename__ = "resources"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    kind: Mapped[str] = mapped_column(String(40), index=True)  # ambulance|fire|team|boat|...
    name: Mapped[str] = mapped_column(String(160), default="")
    agency_code: Mapped[str] = mapped_column(String(32), default="")
    region_code: Mapped[str] = mapped_column(String(24), default="")  # district/city
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lon: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(30), default="available")
    capacity: Mapped[int] = mapped_column(Integer, default=0)
    source: Mapped[str] = mapped_column(String(20), default="DEMO")


class Shelter(Base):
    __tablename__ = "shelters"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(160), default="")
    region_code: Mapped[str] = mapped_column(String(24), default="")
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lon: Mapped[float] = mapped_column(Float, default=0.0)
    capacity: Mapped[int] = mapped_column(Integer, default=0)
    occupancy: Mapped[int] = mapped_column(Integer, default=0)
    facilities: Mapped[str] = mapped_column(String(300), default="")
    accessible: Mapped[bool] = mapped_column(Boolean, default=True)
    contact: Mapped[str] = mapped_column(String(80), default="")
    agency_code: Mapped[str] = mapped_column(String(32), default="")
    status: Mapped[str] = mapped_column(String(30), default="open")
    source: Mapped[str] = mapped_column(String(20), default="DEMO")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class RiskZone(Base):
    __tablename__ = "risk_zones"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    region_code: Mapped[str] = mapped_column(String(24), default="")
    disaster_code: Mapped[str] = mapped_column(String(32), default="")
    name: Mapped[str] = mapped_column(String(160), default="")
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lon: Mapped[float] = mapped_column(Float, default=0.0)
    radius_km: Mapped[float] = mapped_column(Float, default=5.0)
    level: Mapped[str] = mapped_column(String(20), default="MODERATE")
    source: Mapped[str] = mapped_column(String(20), default="DEMO")


class EvacuationZone(Base):
    __tablename__ = "evacuation_zones"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    risk_zone_id: Mapped[str] = mapped_column(String(40), default="")
    shelter_id: Mapped[str] = mapped_column(String(40), default="")
    route_note: Mapped[str] = mapped_column(Text, default="")
    source: Mapped[str] = mapped_column(String(20), default="DEMO")
