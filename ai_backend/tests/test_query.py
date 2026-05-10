"""Smoke tests for the AI service."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

import app.core.config as app_config
from app.main import app


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


def test_root(client: TestClient) -> None:
    r = client.get("/")
    assert r.status_code == 200
    data = r.json()
    assert data.get("service") == "ai_backend"


def test_health_public(client: TestClient) -> None:
    r = client.get("/health/")
    assert r.status_code == 200


def test_ai_forbidden_without_internal_secret_header(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(app_config.settings, "internal_api_secret", "unit-test-secret", raising=False)
    c = TestClient(app)
    r = c.post(
        "/ai/",
        json={"query": "hello", "workspace_id": "space1", "project_id": "proj1"},
    )
    assert r.status_code == 403
