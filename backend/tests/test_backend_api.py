"""
PHARMA AI — Backend API Test Suite
Verifies FastAPI endpoints, database persistence, and end-to-end simulation pipelines.
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.main import app
from backend.database import init_database

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_database()


def test_healthcheck():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "HEALTHY"
    assert "PK-1C/2C" in data["scientific_engines"]


def test_list_drugs():
    resp = client.get("/api/drugs")
    assert resp.status_code == 200
    drugs = resp.json()
    assert len(drugs) >= 4
    names = [d["name"] for d in drugs]
    assert "Ibuprofen" in names
    assert "Metformin" in names


def test_create_and_delete_custom_drug():
    payload = {
        "name": "TestCompound-X",
        "molecular_weight": 340.5,
        "logp": 2.1,
        "pka": 6.8,
        "solubility_mg_ml": 1.5,
        "permeability_peff": 2.0e-4,
        "bioavailability_f": 0.85,
        "clearance_l_h": 8.5,
        "vd_l": 45.0,
        "half_life_h": 3.7,
        "protein_binding_percent": 85.0,
        "bcs_class": "Class II",
        "route": "Oral",
        "default_dose_mg": 250.0,
        "provenance": "USER ENTERED",
    }
    create_resp = client.post("/api/drugs", json=payload)
    assert create_resp.status_code == 200
    created = create_resp.json()
    drug_id = created["id"]

    # Delete
    del_resp = client.delete(f"/api/drugs/{drug_id}")
    assert del_resp.status_code == 200


def test_pk_simulation_endpoint():
    payload = {
        "dose_mg": 400.0,
        "ka_per_h": 1.2,
        "cl_l_per_h": 3.2,
        "vd_l": 9.8,
        "f_bioavail": 0.95,
        "t_end_h": 24.0,
    }
    resp = client.post("/api/simulations/pk", json=payload)
    assert resp.status_code == 200
    res = resp.json()
    assert res["c_max"] > 0
    assert len(res["concentration"]) == len(res["time"])


def test_pbpk_simulation_endpoint():
    payload = {
        "dose_mg": 400.0,
        "body_weight_kg": 70.0,
        "ka_per_h": 1.2,
        "cl_hep_l_per_h": 14.0,
        "cl_renal_l_per_h": 4.0,
        "f_oral": 0.95,
        "kp_liver": 1.8,
        "kp_kidney": 2.0,
        "kp_tissue": 1.2,
        "t_end_h": 24.0,
    }
    resp = client.post("/api/simulations/pbpk", json=payload)
    assert resp.status_code == 200
    res = resp.json()
    assert res["mass_balance_error_percent"] < 1.0
    assert len(res["plasma_conc"]) > 0


def test_dissolution_simulation_and_compare():
    sim_resp = client.post("/api/simulations/dissolution", json={"model_type": "first_order", "k_rate": 0.45})
    assert sim_resp.status_code == 200
    curve = sim_resp.json()

    # Compare identical curve
    comp_resp = client.post(
        "/api/simulations/dissolution/compare",
        json={
            "reference_times": curve["time"][:10],
            "reference_curve": curve["release_percent"][:10],
            "test_curve": curve["release_percent"][:10],
        },
    )
    assert comp_resp.status_code == 200
    assert comp_resp.json()["is_similar"] is True


def test_population_simulation_endpoint():
    resp = client.post("/api/simulations/population", json={"population_size": 20, "dose_mg": 400.0})
    assert resp.status_code == 200
    data = resp.json()
    assert data["population_size"] == 20
    assert len(data["median_percentile_50"]) > 0


def test_ml_train_and_hybrid():
    train_resp = client.post("/api/simulations/ml/train", json={"model_type": "random_forest"})
    assert train_resp.status_code == 200
    assert train_resp.json()["test_r2"] > 0.4

    hybrid_resp = client.post("/api/simulations/hybrid", json={"dose_mg": 400.0})
    assert hybrid_resp.status_code == 200
    assert "hybrid" in hybrid_resp.json()["metrics_comparison"]


def test_xai_and_optimization():
    xai_resp = client.post("/api/simulations/xai/explain", json={"features": {"Dose (mg)": 600.0, "Intrinsic Clearance (L/h)": 18.0}})
    assert xai_resp.status_code == 200
    assert len(xai_resp.json()["attributions"]) == 2

    opt_resp = client.post("/api/simulations/optimize", json={"target_cmax": 12.0, "target_auc": 80.0})
    assert opt_resp.status_code == 200
    assert "Computational candidate" in opt_resp.json()["provenance"]


def test_report_generation():
    resp = client.post("/api/reports/generate", json={"title": "Test Pharmacometrics Study", "drug_name": "Ibuprofen"})
    assert resp.status_code == 200
    report = resp.json()
    assert len(report["sections"]) == 24
    assert report["sections"][0]["title"] == "Title"
    assert report["sections"][23]["title"] == "References"
