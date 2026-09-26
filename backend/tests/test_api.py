import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_demo_users():
    response = client.get("/api/auth/demo-users")
    assert response.status_code == 200
    users = response.json()
    assert len(users) >= 2
    assert any(u["username"] == "dr.priya" for u in users)

def test_login():
    response = client.post("/api/auth/login", json={"username": "dr.priya", "password": "doctor123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "DOCTOR"

def test_list_patients():
    response = client.get("/api/patients")
    assert response.status_code == 200
    patients = response.json()
    assert len(patients) >= 4

def test_patient_longitudinal_history():
    # Ramesh Patel is P-1001 with id 1
    response = client.get("/api/patients/1/history")
    assert response.status_code == 200
    data = response.json()
    assert "screenings" in data
    assert len(data["screenings"]) >= 3
    assert data["progression_alert"] is not None

def test_dashboard_stats():
    response = client.get("/api/screenings/dashboard-stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_screenings"] >= 4
    assert data["referable_cases"] >= 2

def test_simulation_run():
    payload = {
        "patients_per_day": 120,
        "images_per_patient": 2,
        "camera_count": 2,
        "image_capture_time_min": 4.0,
        "bandwidth_mbps": 2.5,
        "network_latency_ms": 250,
        "ai_inference_time_sec": 1.8,
        "doctor_count": 3,
        "doctor_review_time_min": 3.5,
        "referral_rate_pct": 28.0,
        "work_shift_hours": 8.0
    }
    response = client.post("/api/simulation/run", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert "primary_bottleneck" in res
    assert "screening_completion_rate_pct" in res

def test_pdf_report_download():
    # Screening SCR-1001
    response = client.get("/api/reports/SCR-1001/download")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 1000
