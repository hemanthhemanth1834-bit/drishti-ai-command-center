"""REST endpoints (/api/v1/sensors, /drones, /telemetry)."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..config import DEV_GATEWAY_KEY
from ..models.telemetry import ScenarioRequest
from ..services.telemetry_engine import make_packet

router = APIRouter(prefix="/api/v1", tags=["v1"])
security = HTTPBearer(auto_error=False)


def verify_gateway_key(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
):
    if not credentials or credentials.credentials != DEV_GATEWAY_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing gateway Bearer key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials


@router.get("/health")
def health_v1():
    return {"ok": True, "service": "drishti-telemetry", "api": "v1"}


@router.get("/telemetry")
def telemetry_v1(_: str = Depends(verify_gateway_key)):
    return make_packet(tick=0)


@router.get("/drones")
def list_drones(_: str = Depends(verify_gateway_key)):
    return {"drones": [make_packet(tick=0) for _ in range(3)]}


@router.get("/sensors")
def list_sensors():
    return {
        "sensors": [
            {"sensor_id": "THM-01", "kind": "thermal", "value": 38.2, "unit": "C"},
            {"sensor_id": "AIR-02", "kind": "air-quality", "value": 72.0, "unit": "AQI"},
        ]
    }


@router.post("/scenario")
def set_scenario_v1(req: ScenarioRequest, _: str = Depends(verify_gateway_key)):
    return {"ok": True, "scenario": req.scenario, "api": "v1"}
