"""NE-SAFE AI additive router — demo landslide slope feed. No DB changes, no drops."""
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/nesafe", tags=["nesafe"])

SLOPES = [
    {"id": "AS-01", "state": "Assam", "lat": 26.1445, "lon": 91.7362, "baseRisk": 24},
    {"id": "AR-01", "state": "Arunachal Pradesh", "lat": 27.5862, "lon": 91.8639, "baseRisk": 42},
    {"id": "MEG-01", "state": "Meghalaya", "lat": 25.5788, "lon": 91.8933, "baseRisk": 52},
    {"id": "MN-01", "state": "Manipur", "lat": 25.2678, "lon": 94.0256, "baseRisk": 31},
    {"id": "MZ-01", "state": "Mizoram", "lat": 23.7271, "lon": 92.7176, "baseRisk": 44},
    {"id": "NL-01", "state": "Nagaland", "lat": 25.6751, "lon": 94.1086, "baseRisk": 28},
    {"id": "SK-01", "state": "Sikkim", "lat": 27.3389, "lon": 88.6065, "baseRisk": 49},
    {"id": "TR-01", "state": "Tripura", "lat": 24.05, "lon": 92.27, "baseRisk": 22},
]


@router.get("/slopes")
def slopes():
    return {"mode": "DEMO", "source": "SIMULATED", "slopes": SLOPES}


@router.get("/health")
def health():
    return {"ok": True, "service": "nesafe-demo", "mode": "DEMO"}
