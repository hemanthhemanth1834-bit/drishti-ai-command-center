"""Feature engineering: raw observations -> 21 model features."""
from __future__ import annotations

from typing import Dict
from .schemas import FEATURE_ORDER


def derive_rainfall_features(r1: float, r6: float, r24: float, r72: float,
                             climatology_24h: float = 40.0) -> Dict[str, float]:
    """Intensity, anomaly vs climatology, and antecedent (72h minus 24h)."""
    intensity = max(r1, r6 / 6.0, r24 / 24.0)
    anomaly = ((r24 - climatology_24h) / max(climatology_24h, 1.0)) * 100.0
    antecedent = max(0.0, r72 - r24)
    return {
        "rainfall_intensity": round(intensity, 2),
        "rainfall_anomaly": round(anomaly, 2),
        "antecedent_rainfall": round(antecedent, 2),
    }


def to_vector(features: Dict[str, float]):
    ordered = [float(features.get(k, 0.0)) for k in FEATURE_ORDER]
    return ordered


def defaults_for_location(lat: float, lon: float) -> Dict[str, float]:
    """Neutral priors when live feeds are missing (labeled DEMO downstream)."""
    return {
        "rainfall_1h": 4.0, "rainfall_6h": 18.0, "rainfall_24h": 42.0,
        "rainfall_72h": 90.0, "rainfall_intensity": 4.0,
        "rainfall_anomaly": 5.0, "antecedent_rainfall": 48.0,
        "soil_moisture": 55.0, "temperature": 24.0,
        "elevation": 1200.0, "slope": 30.0, "aspect": 180.0,
        "curvature": 0.0, "terrain_roughness": 0.5, "drainage": 0.5,
        "land_cover": 0.5, "satellite_change": 2.0, "vegetation_change": 0.0,
        "historical_landslide_frequency": 1.0,
        "distance_to_previous_landslide": 10.0,
        "hill_cutting_indicator": 0.0, "road_proximity": 0.5,
    }
