"""WebSocket route (/ws/telemetry) using the shared connection manager."""
import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..config import TELEMETRY_HZ
from ..services.connection_manager import manager
from ..services.telemetry_engine import make_packet

router = APIRouter(tags=["ws"])


@router.websocket("/ws/telemetry-v1")
async def ws_telemetry_v1(ws: WebSocket):
    """Versioned alias of the live stream (kept separate from legacy /ws/telemetry)."""
    await manager.connect(ws)
    tick = 0
    try:
        while True:
            await manager.broadcast_json(make_packet(tick=tick))
            tick += 1
            await asyncio.sleep(1.0 / TELEMETRY_HZ if TELEMETRY_HZ > 0 else 0.5)
    except WebSocketDisconnect:
        manager.disconnect(ws)
