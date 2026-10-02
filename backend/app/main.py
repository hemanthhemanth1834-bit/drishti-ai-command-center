"""DRISHTI-X FastAPI backend for rainfall, flood and response intelligence."""
import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import CORS_ORIGINS
from .db import init_db
from .routers.api_v1 import router as api_v1_router
from .routers.nesafe import router as nesafe_router
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
from .routers.admin import router as admin_router
from .routers.regions import router as regions_router
from .routers.ai import router as ai_router
from .routers.resources import router as resources_router
from .routers.sectors import router as sectors_router
from .routers.ops import router as ops_router, OpsMiddleware
from .routers.auth import router as auth_router

class BackendPrefixStripMiddleware:
    """Strip the public mount prefix (/api/backend) before routing.

    Vercel routes the public path /api/backend/* into this service while the
    app observes the ORIGINAL path, so /api/backend/api/health would 404.
    A vercel.json request.path transform is configured for the same purpose;
    this middleware is the deterministic fallback (and also covers websocket
    scopes, which HTTP-only transforms cannot rewrite). Local/dev paths
    without the prefix pass through untouched.
    """

    PREFIX = "/api/backend"

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope.get("type") in ("http", "websocket"):
            path = scope.get("path", "")
            if path == self.PREFIX:
                scope["path"] = "/"
            elif path.startswith(self.PREFIX + "/"):
                scope["path"] = path[len(self.PREFIX):]
        await self.app(scope, receive, send)

app = FastAPI(title="DRISHTI-X Flood Intelligence Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if os.getenv("CORS_STRICT", "").lower() == "true" else CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def safe_errors(request: Request, exc: Exception):
    """Never leak stack traces to clients; 401/403/429 pass through."""
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code,
                            content={"detail": exc.detail})
    return JSONResponse(status_code=500,
                        content={"detail": "Internal error (see server logs)",
                                 "path": str(request.url.path)})

app.include_router(api_v1_router)
app.include_router(nesafe_router)
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
app.include_router(admin_router)
app.include_router(regions_router)
app.include_router(ai_router)
app.include_router(resources_router)
app.include_router(sectors_router)
app.include_router(ops_router)
app.include_router(auth_router)
app.add_middleware(OpsMiddleware)
app.add_middleware(BackendPrefixStripMiddleware)


@app.get("/api/health")
def health():
    return {"ok": True, "service": "drishti-x"}


