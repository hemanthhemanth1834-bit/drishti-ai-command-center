"""Training datasets.

- `demo_dataframe()`: clearly-labelled SYNTHETIC development data. The
  generative process is documented below; it is NOT real landslide history.
- `load_csv()`: import pipeline for REAL verified datasets (documented schema).
"""
from __future__ import annotations

import math
import random
from pathlib import Path
from typing import Tuple

try:
    import pandas as pd
except ImportError:  # pragma: no cover
    pd = None  # type: ignore

from .schemas import FEATURE_ORDER

REQUIRED_COLUMNS = FEATURE_ORDER + ["landslide"]


def demo_dataframe(n_samples: int = 3000, seed: int = 42):
    """SYNTHETIC data. Ground truth = logistic function of a few drivers + noise.

    P(y=1) = sigmoid(-4.5 + 0.045*rain24 + 0.03*soil + 0.06*slope
                     + 0.05*sat_change + 0.4*hill_cut - 0.05*dist_prev + noise)
    """
    if pd is None:
        raise RuntimeError("pandas is required for training (pip install pandas)")
    rng = random.Random(seed)
    rows = []
    for _ in range(n_samples):
        rain24 = rng.uniform(0, 320)
        soil = rng.uniform(5, 100)
        slope = rng.uniform(0, 60)
        sat = rng.uniform(0, 40)
        hill = 1.0 if rng.random() < 0.2 else 0.0
        dist = rng.uniform(0, 60)
        logit = (-4.5 + 0.045 * rain24 + 0.03 * soil + 0.06 * slope
                 + 0.05 * sat + 0.4 * hill - 0.05 * dist + rng.gauss(0, 0.8))
        prob = 1.0 / (1.0 + math.exp(-logit))
        label = 1 if rng.random() < prob else 0
        rows.append({
            "rainfall_1h": round(rng.uniform(0, rain24 / 6 + 8), 2),
            "rainfall_6h": round(rng.uniform(0, rain24 / 2 + 20), 2),
            "rainfall_24h": round(rain24, 2),
            "rainfall_72h": round(rain24 + rng.uniform(0, 220), 2),
            "rainfall_intensity": round(rng.uniform(0, rain24 / 12 + 6), 2),
            "rainfall_anomaly": round(rng.uniform(-40, 320), 2),
            "antecedent_rainfall": round(rng.uniform(0, 260), 2),
            "soil_moisture": round(soil, 2),
            "temperature": round(rng.uniform(4, 38), 2),
            "elevation": round(rng.uniform(50, 3500), 1),
            "slope": round(slope, 2),
            "aspect": round(rng.uniform(0, 360), 1),
            "curvature": round(rng.uniform(-2, 2), 3),
            "terrain_roughness": round(rng.uniform(0, 2.5), 3),
            "drainage": round(rng.uniform(0, 1), 3),
            "land_cover": round(rng.uniform(0, 1), 3),
            "satellite_change": round(sat, 2),
            "vegetation_change": round(rng.uniform(-30, 20), 2),
            "historical_landslide_frequency": round(rng.uniform(0, 12), 2),
            "distance_to_previous_landslide": round(dist, 2),
            "hill_cutting_indicator": hill,
            "road_proximity": round(rng.uniform(0, 1), 3),
            "landslide": label,
        })
    return pd.DataFrame(rows, columns=REQUIRED_COLUMNS)


def load_csv(path: str | Path):
    """Load a REAL verified dataset. Must contain REQUIRED_COLUMNS."""
    if pd is None:
        raise RuntimeError("pandas is required for training (pip install pandas)")
    df = pd.read_csv(path)
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"CSV missing required columns: {missing}. "
                         f"See backend/ml/datasets.py REQUIRED_COLUMNS.")
    return df[REQUIRED_COLUMNS].copy()


def train_test_split_df(df, test_size: float = 0.2, seed: int = 42):
    from sklearn.model_selection import train_test_split
    X = df[FEATURE_ORDER]
    y = df["landslide"].astype(int)
    return train_test_split(X, y, test_size=test_size, random_state=seed,
                            stratify=y)
