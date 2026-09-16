"""Platform tests: ML, providers, risk, alerts, GIS math, incidents, sync.

Honesty rule: tests assert SHAPE + honesty flags (simulated/data_status),
never specific invented values. The mini-model test trains on synthetic
data and asserts metric RANGES, not fixed numbers.
"""
import io
import os

os.environ.setdefault("GATEWAY_KEY", "test-key-123")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.services import spatial  # noqa: E402

client = TestClient(app)
AUTH = {"Authorization": "Bearer test-key-123"}
LOC = {"latitude": 27.33, "longitude": 88.61}


# ---------- geospatial ----------

def test_haversine_known_distance():
    # Shillong -> Dawki ~ 80km corridor (approx, sanity range)
    d = spatial.haversine_km(25.5788, 91.8933, 25.18, 92.02)
    assert 30 < d < 120


def test_within_radius_sorted():
    items = [{"id": "a", "lat": 0.0, "lon": 0.5}, {"id": "b", "lat": 0.0, "lon": 0.1}]
    out = spatial.within_radius(items, 0.0, 0.0, 100)
    assert [o["id"] for o in out] == ["b", "a"]
    assert all("dist_km" in o for o in out)


# ---------- ML ----------

def test_ml_predict_shape():
    r = client.post("/api/v1/ml/predict", json={"location": LOC})
    assert r.status_code == 200
    j = r.json()
    for k in ("prediction_id", "landslide_probability", "risk_level",
              "confidence", "model_version", "timestamp", "factors",
              "simulated", "data_status"):
        assert k in j, f"missing {k}"
    assert 0 <= j["landslide_probability"] <= 1
    assert j["risk_level"] in ("LOW", "MODERATE", "HIGH", "CRITICAL")


def test_ml_batch_limit():
    r = client.post("/api/v1/ml/batch-predict",
                    headers=AUTH, json={"items": [{"location": LOC}] * 2})
    assert r.status_code == 200
    assert r.json()["count"] == 2


def test_ml_health_honest():
    j = client.get("/api/v1/ml/health").json()
    assert j["status"] in ("HEALTHY", "NOT_TRAINED")
    if j["status"] == "NOT_TRAINED":
        assert j["accuracy"] == "NOT AVAILABLE"
    else:
        assert 0 <= j["f1"] <= 1 and 0 <= j["roc_auc"] <= 1


def test_ml_explain_roundtrip():
    pid = client.post("/api/v1/ml/predict",
                      json={"location": LOC}).json()["prediction_id"]
    r = client.get(f"/api/v1/ml/explain/{pid}")
    assert r.status_code == 200
    assert "contributions" in r.json()
    assert client.get("/api/v1/ml/explain/nope").status_code == 404


def test_mini_training_pipeline(tmp_path):
    from ml.datasets import demo_dataframe
    from ml.train import train
    df = demo_dataframe(n_samples=200, seed=7)
    metrics = train(df, "TestMini-v0", tmp_path)
    assert metrics["data_kind"] == "SYNTHETIC-DEMO"
    assert metrics["n_train"] + metrics["n_test"] == 200
    for k in ("accuracy", "precision", "recall", "f1", "roc_auc"):
        assert 0.5 <= metrics[k] <= 1.0, k
    assert len(metrics["confusion_matrix"]) == 2
    assert len(metrics["feature_importance"]) == 22
    # untrained registry falls back with DEMO label
    from ml.inference import ModelRegistry
    from pathlib import Path
    reg = ModelRegistry(model_dir=Path(str(tmp_path) + "-empty"))
    assert reg.trained is False
    resp = reg.predict(25.0, 92.0, None)
    assert resp.simulated is True and resp.data_status == "DEMO"


# ---------- providers ----------

def test_weather_providers_status():
    j = client.get("/api/v1/weather/providers").json()
    names = [p["name"] for p in j["providers"]]
    assert any("Open-Meteo" in n for n in names)
    assert any("IMD" in n for n in names)


def test_terrain_ranges():
    j = client.get("/api/v1/terrain/analyze?lat=25.57&lon=91.89").json()
    assert 0 <= j["slope_deg"] <= 90
    assert 0 <= j["aspect_deg"] <= 360
    assert j["data_status"] == "DEMO"


def test_satellite_provenance():
    j = client.get("/api/v1/satellite/latest?lat=25.5&lon=91.9").json()
    for k in ("source", "data_status", "resolution_m", "data_type"):
        assert k in j, f"missing {k}"


def test_soil_hierarchy_honest():
    from app.services.providers import soil_moisture
    out = soil_moisture(25.5, 91.9)
    assert "fallback_chain" in out
    assert out["data_status"] in ("LIVE", "DEMO")


# ---------- sensors ----------

def test_sensor_ingest_and_history():
    r = client.post("/api/v1/sensors/ingest", headers=AUTH, json={
        "sensor_id": "TEST-001", "lat": 25.5, "lon": 91.9,
        "soil_moisture": 92.0, "temperature": 22.0, "battery": 80.0,
        "signal": 90.0, "source": "live"})
    assert r.status_code == 200
    assert r.json()["status"] == "anomaly"
    h = client.get("/api/v1/sensors/TEST-001/history").json()
    assert h["count"] >= 1
    assert client.get("/api/v1/sensors/NOPE").status_code == 404


# ---------- warnings / risk / alerts ----------

def test_warning_evaluate_guarded_shape():
    assert client.post("/api/v1/warnings/evaluate",
                       json={"lat": 25.5, "lon": 91.9}).status_code == 401
    r = client.post("/api/v1/warnings/evaluate", headers=AUTH,
                    json={"lat": 25.5, "lon": 91.9})
    assert r.status_code == 200
    j = r.json()
    assert j["level"] in ("WATCH", "ALERT", "WARNING", "CRITICAL")
    assert "Requires field verification" in j["recommended_response"]
    assert "definitely" not in str(j).lower()


def test_risk_assess_transparent():
    j = client.post("/api/v1/risk/assess",
                    json={"lat": 25.5, "lon": 91.9}).json()
    assert abs(sum(j["weights"].values()) - 1.0) < 1e-6
    assert j["data_status"] == "DEMO"


def test_alerts_crud_ack():
    r = client.post("/api/v1/alerts", headers=AUTH,
                    json={"level": "WATCH", "title": "t", "lat": 1, "lon": 2})
    assert r.status_code == 200
    aid = r.json()["id"]
    assert client.post(f"/api/v1/alerts/{aid}/ack", headers=AUTH).status_code == 200
    assert client.post("/api/v1/alerts", headers=AUTH,
                       json={"level": "NOPE", "title": "x"}).status_code == 400


# ---------- roads / response ----------

def test_road_blockage_validation():
    r = client.post("/api/v1/roads/blockage", headers=AUTH,
                    json={"road_id": "RD-01", "status": "BLOCKED",
                          "cause": "debris"})
    assert r.status_code == 200
    bad = client.post("/api/v1/roads/blockage", headers=AUTH,
                      json={"road_id": "RD-01", "status": "FLYING"})
    assert bad.status_code == 400


def test_response_bands_explainable():
    j = client.post("/api/v1/response/prioritize", json={
        "lat": 1, "lon": 2, "probability": 0.9, "exposed_population": 3000,
        "road_access": 0.1, "severity": "critical"}).json()
    assert j["band"] in ("P1", "P2", "P3", "P4")
    assert len(j["why"]) >= 3


# ---------- incidents / vision ----------

def test_incident_validation_and_flow():
    r = client.post("/api/v1/incidents", headers=AUTH, data={
        "lat": "25.5", "lon": "91.9", "incident_type": "crack",
        "severity": "moderate", "description": "test"})
    assert r.status_code == 200
    rid = r.json()["id"]
    assert r.json()["verified"] is False
    v = client.post(f"/api/v1/incidents/{rid}/verify", headers=AUTH)
    assert v.json()["verified"] is True
    bad = client.post("/api/v1/incidents", headers=AUTH, data={
        "lat": "25.5", "lon": "91.9", "incident_type": "ufo"})
    assert bad.status_code == 400


def test_incident_bad_file_rejected():
    r = client.post("/api/v1/incidents", headers=AUTH, data={
        "lat": "25.5", "lon": "91.9"},
        files={"media": ("evil.exe", b"x" * 10, "application/octet-stream")})
    assert r.status_code == 400


def test_vision_demo_labeled():
    r = client.post("/api/v1/vision/classify", headers=AUTH,
                    files={"file": ("crack.jpg", b"\xff\xd8" + b"x" * 100,
                                    "image/jpeg")})
    assert r.status_code == 200
    j = r.json()
    assert j["simulated"] is True
    assert j["verification_required"] is True


# ---------- notifications / sync / history ----------

def test_sms_not_configured_honest():
    r = client.post("/api/v1/notifications/send", headers=AUTH, json={
        "channel": "sms", "audience": "citizen"})
    assert r.status_code == 200
    assert r.json()["ok"] is False
    assert "not configured" in r.json()["status"].lower()


def test_sync_push_receipts():
    r = client.post("/api/v1/sync/push", headers=AUTH, json={
        "device_id": "field-1",
        "items": [
            {"client_id": "a", "kind": "reading",
             "payload": {"sensor_id": "S-1", "soil_moisture": 60}},
            {"client_id": "b", "kind": "bogus", "payload": {}},
        ]})
    assert r.status_code == 200
    statuses = {x["client_id"]: x["status"] for x in r.json()["receipts"]}
    assert statuses == {"a": "accepted", "b": "rejected"}


def test_history_csv_validation():
    bad = client.post("/api/v1/history/import", headers=AUTH,
                      files={"file": ("h.txt", b"nope", "text/plain")})
    assert bad.status_code == 400
    good_csv = ("date,lat,lon,rainfall_mm,slope_deg,severity,casualties,"
                "damage,road_status,source\n2020-07-01,25.5,91.9,200,35,high,"
                "unknown,,OPEN,csv-test\n")
    ok = client.post("/api/v1/history/import", headers=AUTH,
                     files={"file": ("h.csv", good_csv.encode(), "text/csv")})
    assert ok.json()["imported"] == 1


def test_grid_cells_bounded():
    j = client.get("/api/v1/grid/risk-cells?step=2.0").json()
    assert j["count"] > 0
    for c in j["cells"][:5]:
        assert 21.5 <= c["lat"] <= 29.5 and 88.0 <= c["lon"] <= 97.5
        assert c["risk_level"] in ("LOW", "MODERATE", "HIGH", "CRITICAL")


def test_rainfall_endpoint():
    r = client.get("/api/v1/rainfall/current?lat=25.5&lon=91.9")
    assert r.status_code == 200
    assert "rain_24h_mm" in r.json()


def test_ws_reconnect_ok():
    for _ in range(2):
        with client.websocket_connect("/ws/telemetry") as ws:
            assert "tick" in ws.receive_json()
