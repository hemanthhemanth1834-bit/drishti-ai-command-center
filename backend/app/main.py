"""DRISHTI-X FastAPI telemetry service — local dev only."""
import asyncio

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from .config import CORS_ORIGINS, DEV_GATEWAY_KEY, TELEMETRY_HZ
from .db import SessionLocal, init_db
from .telemetry import make_packet
from .routers.api_v1 import router as api_v1_router
from .routers.ws_telemetry import router as ws_router
from .routers.nesafe import router as nesafe_router
from .routers.ml import router as ml_router
from .routers.sensors import router as sensors_router
from .routers.weather import router as weather_router
from .routers.satellite import router as satellite_router
from .routers.terrain import router as terrain_router
from .routers.history import router as history_router
from .routers.warnings import router as warnings_router
from .routers.roads import router as roads_router
from .routers.response import router as response_router
from .routers.notifications import router as notifications_router
from .routers.incidents import router as incidents_router
from .routers.vision import router as vision_router
from .routers.grid import router as grid_router
from .routers.rainfall import router as rainfall_router
from .routers.risk import router as risk_router
from .routers.alerts import router as alerts_router
from .routers.sync import router as sync_router
from .routers.model_health import router as model_health_router
from .routers.admin import router as admin_router
from .routers.regions import router as regions_router
from .routers.ai import router as ai_router
from .routers.resources import router as resources_router

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


class ScenarioRequest(BaseModel):
    scenario: str = "nominal"


app = FastAPI(title="DRISHTI-X Telemetry Mesh", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_current_scenario = "nominal"

app.include_router(api_v1_router)
app.include_router(ws_router)
app.include_router(nesafe_router)
app.include_router(ml_router)
app.include_router(sensors_router)
app.include_router(weather_router)
app.include_router(satellite_router)
app.include_router(terrain_router)
app.include_router(history_router)
app.include_router(warnings_router)
app.include_router(roads_router)
app.include_router(response_router)
app.include_router(notifications_router)
app.include_router(incidents_router)
app.include_router(vision_router)
app.include_router(grid_router)
app.include_router(rainfall_router)
app.include_router(risk_router)
app.include_router(alerts_router)
app.include_router(sync_router)
app.include_router(model_health_router)
app.include_router(admin_router)
app.include_router(regions_router)
app.include_router(ai_router)
app.include_router(resources_router)


@app.on_event("startup")
def startup_platform():
    """Init tables + demo seed. Never drops data, never touches telemetry."""
    try:
        init_db()
        from .seed_demo import seed_demo
        db = SessionLocal()
        try:
            seed_demo(db)
        finally:
            db.close()
    except Exception:
        pass  # platform degrades to in-memory demo; telemetry unaffected


@app.get("/api/health")
def health():
    return {"ok": True, "service": "drishti-telemetry", "scenario": _current_scenario}


@app.get("/api/telemetry")
def telemetry_rest(_: str = Depends(verify_gateway_key)):
    """Single snapshot (authenticated). Frontend apiClient.ts uses this."""
    return make_packet(tick=0, scenario=_current_scenario)


@app.post("/api/scenario")
def set_scenario(req: ScenarioRequest, _: str = Depends(verify_gateway_key)):
    global _current_scenario
    allowed = {"nominal", "storm", "swarm-surge", "gps-denied"}
    if req.scenario not in allowed:
        raise HTTPException(status_code=400, detail=f"scenario must be one of {allowed}")
    _current_scenario = req.scenario
    return {"ok": True, "scenario": _current_scenario}


@app.websocket("/ws/telemetry")
async def ws_telemetry(ws: WebSocket):
    """Live unauthenticated stream for local HUD. Attach Bearer for REST only."""
    await ws.accept()
    tick = 0
    try:
        while True:
            pkt = make_packet(tick=tick, scenario=_current_scenario)
            await ws.send_json(pkt)
            tick += 1
            await asyncio.sleep(1.0 / TELEMETRY_HZ if TELEMETRY_HZ > 0 else 0.5)
    except WebSocketDisconnect:
        return
