"""Soil status router tests: shape, provider passthrough, no hardcoded status."""
import os

os.environ.setdefault("GATEWAY_KEY", "test-key-123")

from fastapi.testclient import TestClient  # noqa: E402

import app.routers.soil as soil  # noqa: E402
from app.main import app  # noqa: E402

client = TestClient(app)


def test_status_live_shape(monkeypatch):
    monkeypatch.setattr(
        soil, "soil_moisture",
        lambda lat, lon: {"soil_moisture_pct": 61.0, "source": "LIVE:SoilGrids",
                          "data_status": "LIVE", "fallback_chain": ["x=LIVE"]},
    )
    r = client.get("/api/v1/soil/status?lat=16.5&lon=80.6")
    assert r.status_code == 200
    j = r.json()
    assert j["data_status"] == "LIVE"
    assert j["source"] == "LIVE:SoilGrids"
    assert j["moisture"] == 61.0
    assert "updated" in j and "fallback_chain" in j


def test_status_demo_passthrough(monkeypatch):
    monkeypatch.setattr(
        soil, "soil_moisture",
        lambda lat, lon: {"soil_moisture_pct": 55.0, "source": "DEMO",
                          "data_status": "DEMO", "fallback_chain": []},
    )
    r = client.get("/api/v1/soil/status")
    assert r.status_code == 200
    assert r.json()["data_status"] == "DEMO"


def test_status_defaults():
    # defaults must not 422 with no query params
    import app.routers.soil as s2
    orig = s2.soil_moisture
    s2.soil_moisture = lambda lat, lon: {"source": "t", "data_status": "LIVE"}
    try:
        assert client.get("/api/v1/soil/status").status_code == 200
    finally:
        s2.soil_moisture = orig
