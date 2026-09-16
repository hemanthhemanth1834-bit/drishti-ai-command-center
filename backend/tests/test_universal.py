"""Universal platform tests: regions, geo providers, AI, resources, status flow."""
import os

os.environ.setdefault("GATEWAY_KEY", "test-key-123")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)
AUTH = {"Authorization": "Bearer test-key-123"}


def test_region_hierarchy_counts():
    assert client.get("/api/regions/states?country=IN").json()["count"] >= 20
    assert client.get("/api/regions/districts?state=IN-AP").json()["count"] == 26
    assert client.get("/api/regions/districts?state=IN-TG").json()["count"] == 33
    assert client.get("/api/regions/districts?state=XX").status_code == 404


def test_region_cities_coords():
    hyd = client.get("/api/regions/cities?district=IN-TG-HYD").json()["cities"]
    assert hyd and hyd[0]["lat"] == 17.385 and hyd[0]["lon"] == 78.4867
    vja = client.get("/api/regions/cities?district=IN-AP-KRI").json()["cities"]
    assert any(c["name"] == "Vijayawada" for c in vja)


def test_disasters_sectors_agencies():
    d = client.get("/api/regions/disasters").json()
    assert d["count"] >= 10
    assert any(x["name_te"] for x in d["disasters"])
    assert client.get("/api/regions/sectors").json()["sectors"]
    assert client.get("/api/regions/agencies").json()["count"] >= 5


def test_geocode_validation():
    assert client.get("/api/regions/geocode?q=ab").status_code == 400
    r = client.get("/api/regions/geocode?q=Vijayawada")
    assert r.status_code == 200
    assert "results" in r.json() and "data_status" in r.json()


def test_route_fallback_or_live():
    r = client.get("/api/regions/route?from_lat=16.5&from_lon=80.6&to_lat=17.38&to_lon=78.48")
    assert r.status_code == 200
    j = r.json()
    assert j["distance_km"] > 100 and j["data_status"] in ("LIVE", "CACHED", "DEMO")


def test_ai_status_and_classify():
    st = client.get("/api/v1/ai/status").json()
    assert st["active"]["status"] in ("READY", "NOT_CONFIGURED", "UNAVAILABLE")
    assert "LLM" in st["rule"] or "risk" in st["rule"]
    c = client.post("/api/v1/ai/classify", json={"text": "cyclone landfall near coast"}).json()
    assert c["output_class"] == "ESTIMATED" and c["label"] == "cyclone"
    s = client.post("/api/v1/ai/summarize", json={"text": "Flood reported. Roads blocked. Shelters open."}).json()
    assert s["data_status"] == "ANALYZED" and s["summary"]


def test_resources_and_shelters():
    assert client.get("/api/v1/resources/shelters").json()["count"] >= 2
    assert client.get("/api/v1/resources?kind=boat").json()["count"] >= 1
    n = client.get("/api/v1/resources/nearest-shelter?lat=17.38&lon=78.48").json()
    assert n["shelters"] and n["shelters"][0]["id"] == "SH-HYD-01"
    r = client.post("/api/v1/resources/shelters/SH-HYD-01/occupancy",
                    headers=AUTH, json={"occupancy": 250})
    assert r.status_code == 200 and r.json()["free"] == 950
    bad = client.post("/api/v1/resources/shelters/SH-HYD-01/occupancy",
                      headers=AUTH, json={"occupancy": 99999})
    assert bad.status_code == 400


def test_incident_status_workflow():
    r = client.post("/api/v1/incidents", headers=AUTH, data={
        "lat": "16.5", "lon": "80.6", "incident_type": "flood"})
    rid = r.json()["id"]
    assert r.json()["status"] == "UNVERIFIED"
    rv = client.post(f"/api/v1/incidents/{rid}/review?status=UNDER_REVIEW", headers=AUTH)
    assert rv.json()["status"] == "UNDER_REVIEW"
    bad = client.post(f"/api/v1/incidents/{rid}/review?status=BOGUS", headers=AUTH)
    assert bad.status_code == 400
    vf = client.post(f"/api/v1/incidents/{rid}/verify", headers=AUTH)
    assert vf.json()["status"] == "VERIFIED"
    q = client.get("/api/v1/incidents?status=VERIFIED").json()
    assert any(i["id"] == rid for i in q["incidents"])


def test_alert_levels_extended():
    r = client.post("/api/v1/alerts", headers=AUTH,
                    json={"level": "ADVISORY", "title": "t", "lat": 1, "lon": 2})
    assert r.status_code == 200
    assert client.get("/api/v1/alerts/render?level=ADVISORY&lang=te").json()["text"]
    s = client.post("/api/v1/alerts", headers=AUTH,
                    json={"level": "SEVERE", "title": "t", "lat": 1, "lon": 2})
    assert s.status_code == 200


def test_jwt_library_roundtrip(monkeypatch):
    import app.services.security as sec
    assert sec.decode_token("bogus") is None
    assert sec.mint_token("u", "admin") is None  # no secret by default
    monkeypatch.setenv("JWT_SECRET", "test-secret-123")
    monkeypatch.setattr(sec, "JWT_SECRET", "test-secret-123")
    tok = sec.mint_token("op1", "district_admin")
    assert tok
    ident = sec.decode_token(tok)
    assert ident == {"sub": "op1", "role": "district_admin"}
    assert sec.decode_token(tok + "tampered") is None


def test_ops_health_shape():
    j = client.get("/api/v1/ops/health").json()
    for k in ("uptime_s", "requests", "errors", "latency_ms",
              "inference_ms", "provider_failures", "sync", "database"):
        assert k in j, f"missing {k}"


def test_sector_impact_labels():
    j = client.get("/api/v1/sectors/impact?disaster=flood&lat=16.5&lon=80.6").json()
    assert j["impacts"]
    for row in j["impacts"]:
        assert row["status"] in ("LIVE", "CALCULATED", "DEMO", "NOT_AVAILABLE")
        assert "inputs" in row


def test_sync_idempotency():
    payload = {"device_id": "d", "items": [
        {"client_id": "idem-x", "kind": "reading",
         "payload": {"sensor_id": "S-1", "soil_moisture": 60}}]}
    r1 = client.post("/api/v1/sync/push", headers=AUTH, json=payload).json()
    r2 = client.post("/api/v1/sync/push", headers=AUTH, json=payload).json()
    assert r1["receipts"][0]["status"] == "accepted"
    assert r2["receipts"][0]["status"] == "duplicate"


def test_rainfall_observed_forecast_split():
    j = client.get("/api/v1/rainfall/current?lat=16.5&lon=80.6").json()
    if j["data_status"] == "LIVE":
        assert "observed" in j and "forecast" in j
        assert "rain_7d_mm" in j
    else:
        assert j["data_status"] == "DEMO"


def test_auth_unconfigured_honest(monkeypatch):
    import app.services.security as sec
    monkeypatch.setattr(sec, "JWT_SECRET", "")
    r = client.post("/api/v1/auth/token", json={"username": "x", "secret": "y"})
    assert r.status_code == 503


def test_auth_bootstrap_and_me(monkeypatch):
    import app.services.security as sec
    monkeypatch.setattr(sec, "JWT_SECRET", "test-secret-123")
    monkeypatch.setenv("OPERATOR_KEYS", "op1:field_officer:s3cret")
    # wrong secret
    assert client.post("/api/v1/auth/token",
                       json={"username": "op1", "secret": "nope"}).status_code == 401
    # operator key
    r = client.post("/api/v1/auth/token",
                    json={"username": "op1", "secret": "s3cret"})
    assert r.status_code == 200 and r.json()["role"] == "field_officer"
    me = client.get("/api/v1/auth/me",
                    headers={"Authorization": f"Bearer {r.json()['access_token']}"})
    assert me.json()["sub"] == "op1"
    # gateway bootstrap
    g = client.post("/api/v1/auth/token", headers=AUTH, json={})
    assert g.status_code == 200 and g.json()["method"] == "gateway-bootstrap"
    # logout audited
    lo = client.post("/api/v1/auth/logout",
                     headers={"Authorization": f"Bearer {r.json()['access_token']}"})
    assert lo.json()["ok"] is True
