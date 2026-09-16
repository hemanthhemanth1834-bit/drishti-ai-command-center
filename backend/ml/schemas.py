"""Pydantic schemas for the landslide prediction API."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class LandslideFeatures(BaseModel):
    rainfall_1h: float = Field(0, ge=0, le=500)
    rainfall_6h: float = Field(0, ge=0, le=1500)
    rainfall_24h: float = Field(0, ge=0, le=3000)
    rainfall_72h: float = Field(0, ge=0, le=5000)
    rainfall_intensity: float = Field(0, ge=0, le=500)
    rainfall_anomaly: float = Field(0, ge=-200, le=500)
    antecedent_rainfall: float = Field(0, ge=0, le=5000)
    soil_moisture: float = Field(50, ge=0, le=100)
    temperature: float = Field(24, ge=-20, le=55)
    elevation: float = Field(900, ge=0, le=9000)
    slope: float = Field(30, ge=0, le=90)
    aspect: float = Field(180, ge=0, le=360)
    curvature: float = Field(0, ge=-10, le=10)
    terrain_roughness: float = Field(0.5, ge=0, le=5)
    drainage: float = Field(0.5, ge=0, le=1)
    land_cover: float = Field(0.5, ge=0, le=1)
    satellite_change: float = Field(0, ge=0, le=100)
    vegetation_change: float = Field(0, ge=-100, le=100)
    historical_landslide_frequency: float = Field(0, ge=0, le=100)
    distance_to_previous_landslide: float = Field(10, ge=0, le=500)
    hill_cutting_indicator: float = Field(0, ge=0, le=1)
    road_proximity: float = Field(0.5, ge=0, le=1)


FEATURE_ORDER: List[str] = list(LandslideFeatures.model_fields.keys())


class Location(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class PredictRequest(BaseModel):
    location: Location
    features: Optional[LandslideFeatures] = None


class FactorContribution(BaseModel):
    feature: str
    contribution_pct: float
    value: float


class PredictResponse(BaseModel):
    prediction_id: str
    location: Location
    landslide_probability: float
    risk_level: str
    confidence: int
    model_version: str
    timestamp: str
    factors: Dict[str, str]
    contributions: List[FactorContribution] = []
    simulated: bool = False
    data_status: str = "DEMO"

    @staticmethod
    def now() -> str:
        return datetime.now(timezone.utc).isoformat()


class BatchPredictRequest(BaseModel):
    items: List[PredictRequest] = Field(..., min_length=1, max_length=100)
