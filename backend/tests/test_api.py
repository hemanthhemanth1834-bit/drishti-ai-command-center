"""Backend contract tests: REST auth, scenario control, WS stream shape."""
import os

os.environ.setdefault("GATEWAY_KEY", "test-key-123")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)
AUTH = {"Authorization": "Bearer test-key-123"}


def test_health_open():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_v1_health_open():
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["api"] == "v1"


def test_telemetry_requires_key():
    assert client.get("/api/telemetry").status_code == 401
    assert client.get("/api/v1/telemetry").status_code == 401


def test_telemetry_shape_authed():
    pkt = client.get("/api/telemetry", headers=AUTH).json()
    for field in ("drone_id", "lat", "lon", "alt_m", "speed_ms", "battery_pct", "signal_pct", "mode", "scenario"):
        assert field in pkt, f"missing {field}"
    assert -90 <= pkt["lat"] <= 90
    assert -180 <= pkt["lon"] <= 180
    assert 0 <= pkt["battery_pct"] <= 100


def test_drones_list():
    r = client.get("/api/v1/drones", headers=AUTH)
    assert r.status_code == 200
    assert len(r.json()["drones"]) >= 1


def test_scenario_roundtrip():
    r = client.post("/api/scenario", headers=AUTH, json={"scenario": "storm"})
    assert r.status_code == 200
    assert r.json()["scenario"] == "storm"
    r = client.post("/api/scenario", headers=AUTH, json={"scenario": "nope"})
    assert r.status_code == 400
    client.post("/api/scenario", headers=AUTH, json={"scenario": "nominal"})


def test_ws_stream_frame():
    with client.websocket_connect("/ws/telemetry") as ws:
        pkt = ws.receive_json()
        assert "drone_id" in pkt and "tick" in pkt


def test_v1_sensors_open():
    r = client.get("/api/v1/sensors")
    assert r.status_code == 200
    assert len(r.json()["sensors"]) >= 1


def test_v1_scenario_guarded_and_roundtrip():
    assert client.post("/api/v1/scenario", json={"scenario": "storm"}).status_code == 401
    r = client.post("/api/v1/scenario", headers=AUTH, json={"scenario": "storm"})
    assert r.status_code == 200
    assert r.json()["api"] == "v1"
