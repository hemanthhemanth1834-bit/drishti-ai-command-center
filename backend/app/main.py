"""DRISHTI-X FastAPI telemetry service — local dev only."""
import asyncio

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from .config import CORS_ORIGINS, DEV_GATEWAY_KEY, TELEMETRY_HZ
from .telemetry import make_packet
from .routers.api_v1 import router as api_v1_router
from .routers.ws_telemetry import router as ws_router
from .routers.nesafe import router as nesafe_router

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
