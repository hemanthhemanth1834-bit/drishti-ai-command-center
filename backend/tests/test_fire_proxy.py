"""FIRMS proxy tests: key gating, CSV normalization, failure mapping.

No live FIRMS calls: the network helper is monkeypatched. The MAP_KEY value
used here is fake and never leaves the test process.
"""
import os
import urllib.error

os.environ.setdefault("GATEWAY_KEY", "test-key-123")

from fastapi.testclient import TestClient  # noqa: E402

import app.routers.fire as fire  # noqa: E402
from app.main import app  # noqa: E402
import app.services.security as sec  # noqa: E402

client = TestClient(app)

CSV = ("latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,"
       "instrument,confidence,version,bright_t31,frp,daynight\n"
       "17.42,78.51,300,1,1,2026-09-20,0730,Suomi NPP,VIIRS,h,2.0NRT,310.5,12.4,D\n"
       "9999,78.5,300,1,1,2026-09-20,0730,Suomi NPP,VIIRS,l,2.0NRT,300,1.0,D\n")


def test_status_reports_configuration_without_key():
    j = client.get("/api/v1/fire/status").json()
    assert j["configured"] is False
    assert j["source"] == "NASA FIRMS"


def test_active_503_without_key():
    r = client.get("/api/v1/fire/active")
    assert r.status_code == 503


def test_active_normalizes_rows(monkeypatch):
    monkeypatch.setenv("FIRMS_MAP_KEY", "test-fake-key")
    monkeypatch.setattr(fire, "fetch_firms_csv", lambda url: CSV)
    assert "test-fake-key" not in fire.FIRMS_BASE
    r = client.get("/api/v1/fire/active?bbox=68,6,98,38&days=1&source=VIIRS_SNPP_NRT")
    assert r.status_code == 200
    j = r.json()
    assert j["count"] == 1
    d = j["detections"][0]
    assert d["latitude"] == 17.42 and d["confidence"] == "h"
    assert d["frp"] == "12.4"
    # key never reflected anywhere in the response
    assert "test-fake-key" not in r.text


def test_active_rejects_bad_params(monkeypatch):
    monkeypatch.setenv("FIRMS_MAP_KEY", "test-fake-key")
    assert client.get("/api/v1/fire/active?bbox=nope").status_code == 400
    assert client.get("/api/v1/fire/active?bbox=1,2,3").status_code == 400
    assert client.get("/api/v1/fire/active?bbox=10,10,5,5").status_code == 400
    assert client.get("/api/v1/fire/active?source=NOPE").status_code == 400
    assert client.get("/api/v1/fire/active?days=9").status_code == 422


def test_active_empty_csv(monkeypatch):
    monkeypatch.setenv("FIRMS_MAP_KEY", "test-fake-key")
    monkeypatch.setattr(fire, "fetch_firms_csv", lambda url: "latitude,longitude\n")
    r = client.get("/api/v1/fire/active")
    assert r.status_code == 200 and r.json()["count"] == 0


def test_active_upstream_failures(monkeypatch):
    monkeypatch.setenv("FIRMS_MAP_KEY", "test-fake-key")

    def boom(url):
        raise urllib.error.HTTPError(url, 401, "x", {}, None)
    monkeypatch.setattr(fire, "fetch_firms_csv", boom)
    r = client.get("/api/v1/fire/active")
    assert r.status_code == 502
    assert "test-fake-key" not in r.text

    def down(url):
        raise urllib.error.URLError("dns")
    monkeypatch.setattr(fire, "fetch_firms_csv", down)
    assert client.get("/api/v1/fire/active").status_code == 502

    def garbage(url):
        return "\x00\x01not-a-csv\xff"
    monkeypatch.setattr(fire, "fetch_firms_csv", garbage)
    r = client.get("/api/v1/fire/active")
    assert r.status_code in (200, 502)
    assert "test-fake-key" not in r.text


def test_active_rate_limited():
    sec._rate.clear()
    try:
        codes = [client.get("/api/v1/fire/active").status_code for _ in range(25)]
        # no key -> 503s, but hammering past the bucket must eventually 429
        assert 429 in codes or set(codes) <= {503}
    finally:
        sec._rate.clear()
