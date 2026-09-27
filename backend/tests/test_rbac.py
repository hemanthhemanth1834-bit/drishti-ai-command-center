"""RBAC matrix: PUBLIC_USER stays read-only; operator perms intact.

public_user holds report+read only. Anonymous callers get 401 on guarded
routes; under-privileged JWTs get 403. Safe public POSTs (rate-limited
compute, citizen intake with report perm) keep working.
"""
import os

import pytest

os.environ.setdefault("GATEWAY_KEY", "test-key-123")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
import app.services.security as sec  # noqa: E402

client = TestClient(app)


@pytest.fixture
def _jwt(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "rbac-test-secret")
    monkeypatch.setattr(sec, "JWT_SECRET", "rbac-test-secret")
    sec._rate.clear()
    yield
    sec._rate.clear()


def _tok(sub, role):
    return {"Authorization": f"Bearer {sec.mint_token(sub, role)}"}


@pytest.fixture
def pub(_jwt):
    return _tok("pub1", "public_user")


@pytest.fixture
def ops(_jwt):
    return _tok("op1", "district_admin")


def test_public_reads_open():
    assert client.get("/api/regions/states?country=IN").status_code == 200
    assert client.get("/api/v1/ml/health").status_code == 200
    assert client.get("/api/v1/admin/audit?limit=1").status_code == 401


def test_public_user_cannot_mutate_or_admin(pub):
    assert client.post("/api/v1/alerts", headers=pub,
                       json={"level": "WATCH", "title": "t", "lat": 1, "lon": 1}).status_code == 403
    assert client.post("/api/v1/incidents/r1/verify", headers=pub).status_code == 403
    assert client.get("/api/v1/admin/roles", headers=pub).status_code == 403
    assert client.get("/api/v1/admin/models", headers=pub).status_code == 403
    assert client.post("/api/v1/roads/blockage", headers=pub,
                       json={"road_id": "r", "status": "OPEN"}).status_code == 403
    assert client.post("/api/v1/notifications/send", headers=pub,
                       json={"channel": "web"}).status_code == 403
    assert client.post("/api/v1/history/import", headers=pub,
                       files={"file": ("t.csv", "a,b\n1,2")}).status_code == 403
    # read-perm compute stays available to authenticated public users…
    assert client.post("/api/v1/ai/summarize", headers=pub,
                       json={"text": "hello"}).status_code == 200
    assert client.post("/api/v1/response/prioritize", headers=pub,
                       json={"lat": 1, "lon": 1}).status_code == 200
    # …but never anonymously
    assert client.post("/api/v1/ai/summarize",
                       json={"text": "hello"}).status_code == 401
    assert client.post("/api/v1/response/prioritize",
                       json={"lat": 1, "lon": 1}).status_code == 401


def test_public_user_report_intake_allowed(pub):
    r = client.post("/api/v1/sensors/ingest", headers=pub,
                    json={"sensor_id": "rbac-s1", "soil_moisture": 50})
    assert r.status_code == 200
    r = client.post("/api/v1/satellite/observations", headers=pub,
                    json={"lat": 1, "lon": 1})
    assert r.status_code == 200
    assert client.post("/api/v1/sync/push", headers=pub,
                       json={"device_id": "d", "items": []}).status_code == 200


def test_anonymous_blocked_on_guarded():
    assert client.post("/api/v1/history/import",
                       files={"file": ("t.csv", "a,b\n1,2")}).status_code in (401, 403)
    assert client.get("/api/v1/admin/roles").status_code in (401, 403)
    assert client.post("/api/v1/roads/blockage",
                       json={"road_id": "r", "status": "OPEN"}).status_code in (401, 403)
    assert client.post("/api/v1/satellite/observations",
                       json={"lat": 1, "lon": 1}).status_code in (401, 403)


def test_subscriptions_minimized():
    j = client.get("/api/v1/sync/subscriptions").json()
    for s in j.get("subscriptions", []):
        assert "keys" not in s
        assert "endpoint" not in s


def test_operator_keeps_permissions(ops):
    assert client.post("/api/v1/roads/blockage", headers=ops,
                       json={"road_id": "r", "status": "OPEN"}).status_code == 200
    # district_admin lacks the admin perm -> honest 403 (also used live)
    assert client.get("/api/v1/admin/models", headers=ops).status_code == 403
    me = client.get("/api/v1/auth/me", headers=ops).json()
    assert me["role"] == "district_admin"


def test_read_perm_ack_documented(pub, ops):
    """Alert ack intentionally requires only 'read' (existing RBAC): any
    authenticated user may ack; anonymous callers get 401."""
    mk = client.post("/api/v1/alerts", headers=ops,
                     json={"level": "WATCH", "title": "t", "lat": 1, "lon": 1})
    assert mk.status_code == 200
    aid = mk.json()["id"]
    assert client.post(f"/api/v1/alerts/{aid}/ack", headers=pub).status_code == 200
    assert client.post(f"/api/v1/alerts/{aid}/ack").status_code == 401


def test_safe_public_compute_open():
    assert client.post("/api/v1/ml/predict",
                       json={"location": {"latitude": 1, "longitude": 1}}).status_code == 200
    assert client.post("/api/v1/risk/assess",
                       json={"lat": 1, "lon": 1}).status_code == 200


def _clear_cookies():
    try:
        client.cookies.clear()
    except Exception:
        pass


def test_cookie_session_lifecycle(monkeypatch):
    import app.services.security as sec
    monkeypatch.setattr(sec, "JWT_SECRET", "test-secret-123")
    monkeypatch.setenv("OPERATOR_KEYS", "op1:district_admin:s3cret")
    # TestClient speaks plain http: Secure cookies would never round-trip.
    monkeypatch.setenv("COOKIE_SECURE", "false")
    _clear_cookies()
    try:
        r = client.post("/api/v1/auth/token",
                        json={"username": "op1", "secret": "s3cret"})
        assert r.status_code == 200
        set_cookie = r.headers.get("set-cookie", "")
        assert "drishti_at=" in set_cookie
        assert "HttpOnly" in set_cookie
        assert "test-secret-123" not in r.text
        # cookie-only identity (no Authorization header)
        me = client.get("/api/v1/auth/me")
        assert me.status_code == 200 and me.json()["role"] == "district_admin"
        # logout clears the cookie
        lo = client.post("/api/v1/auth/logout")
        assert lo.status_code == 200
        assert "drishti_at=" in lo.headers.get("set-cookie", "")
        assert client.get("/api/v1/auth/me").status_code == 401
    finally:
        _clear_cookies()


def test_cookie_remember_flag(monkeypatch):
    import app.services.security as sec
    monkeypatch.setattr(sec, "JWT_SECRET", "test-secret-123")
    monkeypatch.setenv("OPERATOR_KEYS", "op1:district_admin:s3cret")
    monkeypatch.setenv("COOKIE_SECURE", "false")
    _clear_cookies()
    try:
        r = client.post("/api/v1/auth/token",
                        json={"username": "op1", "secret": "s3cret", "remember": True})
        assert "Max-Age" in r.headers.get("set-cookie", "")
        _clear_cookies()
        r = client.post("/api/v1/auth/token",
                        json={"username": "op1", "secret": "s3cret", "remember": False})
        assert "Max-Age" not in r.headers.get("set-cookie", "")
    finally:
        _clear_cookies()


def test_cookie_invalid_rejected(monkeypatch):
    import app.services.security as sec
    monkeypatch.setattr(sec, "JWT_SECRET", "test-secret-123")
    _clear_cookies()
    try:
        client.cookies.set("drishti_at", "bogus")
        assert client.get("/api/v1/auth/me").status_code == 401
    finally:
        _clear_cookies()


def test_public_token_sets_cookie(monkeypatch):
    import app.services.security as sec
    monkeypatch.setattr(sec, "JWT_SECRET", "test-secret-123")
    monkeypatch.setenv("COOKIE_SECURE", "false")
    _clear_cookies()
    try:
        r = client.post("/api/v1/auth/public-token", json={})
        assert r.status_code == 200
        assert "drishti_at=" in r.headers.get("set-cookie", "")
        me = client.get("/api/v1/auth/me")
        assert me.status_code == 200 and me.json()["role"] == "public_user"
    finally:
        _clear_cookies()


def test_public_token_session(_jwt):
    r = client.post("/api/v1/auth/public-token", json={"device_id": "t"})
    assert r.status_code == 200
    j = r.json()
    assert j["role"] == "public_user" and j["method"] == "public-session"
    assert j["access_token"]
    me = client.get("/api/v1/auth/me",
                    headers={"Authorization": f"Bearer {j['access_token']}"})
    assert me.status_code == 200 and me.json()["role"] == "public_user"
    # public token obeys the same matrix: admin denied, intake allowed
    assert client.get("/api/v1/admin/roles",
                      headers={"Authorization": f"Bearer {j['access_token']}"}).status_code == 403


def test_public_token_unconfigured(monkeypatch):
    import app.services.security as sec
    monkeypatch.setattr(sec, "JWT_SECRET", "")
    r = client.post("/api/v1/auth/public-token", json={})
    assert r.status_code == 503
    assert "access_token" not in r.json()


def test_public_token_rate_limited():
    import app.services.security as sec
    sec._rate.clear()
    try:
        codes = [client.post("/api/v1/auth/public-token",
                             json={}).status_code for _ in range(12)]
        assert 429 in codes
    finally:
        sec._rate.clear()
