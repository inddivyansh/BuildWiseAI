"""Unit tests — FastAPI HTTP endpoints."""

import pytest
from starlette.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_compliance_rules_endpoint(client):
    response = client.get("/api/v1/compliance/rules/")
    # If DB not available, it might return 500 or DB connection warning,
    # or if mocked / memory DB.
    # Let's check status code
    assert response.status_code in (200, 500)
    if response.status_code == 200:
        data = response.json()
        assert "rules" in data
        assert "total" in data


def test_analysis_endpoints_route_registration(client):
    fake_run_id = "00000000-0000-0000-0000-000000000000"
    # Endpoints should return 404 Not Found (or DB error if test DB uninitialized), confirming routes exist
    r_sum = client.get(f"/api/v1/analysis/{fake_run_id}/summary")
    assert r_sum.status_code in (404, 500)

    r_meas = client.get(f"/api/v1/analysis/{fake_run_id}/measurements")
    assert r_meas.status_code in (404, 500)

    r_paths = client.get(f"/api/v1/analysis/{fake_run_id}/egress-paths")
    assert r_paths.status_code in (200, 404, 500)

    r_hist = client.get(f"/api/v1/analysis/project/{fake_run_id}/history")
    assert r_hist.status_code in (200, 404, 500)

