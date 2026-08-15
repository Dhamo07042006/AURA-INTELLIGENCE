import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add root directory to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.api.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_auth_login_success(client):
    response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "password123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "HOSPITAL_ADMIN"

def test_auth_login_fail(client):
    response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "wrongpassword"})
    assert response.status_code == 401

def test_rbac_admin_access(client):
    login_res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "password123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.get("/api/v1/devices?page=1", headers=headers)
    assert res.status_code == 200
    
    res = client.get("/api/v1/audit/logs", headers=headers)
    assert res.status_code == 200

def test_rbac_auditor_access(client):
    login_res = client.post("/api/v1/auth/login", json={"username": "auditor", "password": "password123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.get("/api/v1/audit/logs", headers=headers)
    assert res.status_code == 200
    
    res = client.post("/api/v1/stream/replay/start", json={"device_id": "DEV000001", "scenario": "Normal", "speed": 1.0}, headers=headers)
    assert res.status_code == 403

def test_tenant_isolation(client):
    # Admin 1 (demo-hospital)
    login_res1 = client.post("/api/v1/auth/login", json={"username": "admin", "password": "password123"})
    token1 = login_res1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}
    
    # Admin 2 (other-hospital)
    login_res2 = client.post("/api/v1/auth/login", json={"username": "admin2", "password": "password123"})
    token2 = login_res2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}
    
    # Admin 1 can access DEV000001
    res_dev1 = client.get("/api/v1/devices/DEV000001/health", headers=headers1)
    assert res_dev1.status_code == 200
    
    # Admin 2 cannot access DEV000001 (returns 403)
    res_dev2 = client.get("/api/v1/devices/DEV000001/health", headers=headers2)
    assert res_dev2.status_code == 403

def test_replay_controls(client):
    login_res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "password123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Start replay
    res = client.post("/api/v1/stream/replay/start", json={"device_id": "DEV000001", "scenario": "Normal", "speed": 1.0}, headers=headers)
    assert res.status_code == 200
    
    # Check status
    res = client.get("/api/v1/stream/status", headers=headers)
    assert res.status_code == 200
    assert res.json()["replay_running"] is True
    
    # Pause replay
    res = client.post("/api/v1/stream/replay/pause", headers=headers)
    assert res.status_code == 200
    
    # Stop replay
    res = client.post("/api/v1/stream/replay/stop", headers=headers)
    assert res.status_code == 200
