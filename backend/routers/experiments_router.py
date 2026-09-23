"""
PHARMA AI — Experiments Router
Manages saved simulation runs, model parameters, datasets, and validation status.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
import json
import uuid

from backend.database import get_db_connection, log_audit
from backend.models.schemas import ExperimentSaveRequest

router = APIRouter(prefix="/api/experiments", tags=["Experiments"])


@router.get("")
def list_experiments(module: Optional[str] = None):
    """Lists saved experiments, optionally filtered by module."""
    conn = get_db_connection()
    cur = conn.cursor()

    if module:
        cur.execute("SELECT * FROM experiments WHERE module = ? ORDER BY created_at DESC", (module,))
    else:
        cur.execute("SELECT * FROM experiments ORDER BY created_at DESC")

    rows = cur.fetchall()
    conn.close()

    results = []
    for r in rows:
        d = dict(r)
        d["parameters"] = json.loads(d["parameters_json"])
        d["results"] = json.loads(d["results_json"])
        del d["parameters_json"]
        del d["results_json"]
        results.append(d)

    return results


@router.get("/{experiment_id}")
def get_experiment(experiment_id: str):
    """Retrieves an experiment by ID."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM experiments WHERE id = ?", (experiment_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Experiment not found.")

    d = dict(row)
    d["parameters"] = json.loads(d["parameters_json"])
    d["results"] = json.loads(d["results_json"])
    del d["parameters_json"]
    del d["results_json"]
    return d


@router.post("")
def save_experiment(exp: ExperimentSaveRequest):
    """Saves a simulation or ML run as an experiment."""
    conn = get_db_connection()
    cur = conn.cursor()

    new_id = f"EXP-{uuid.uuid4().hex[:6].upper()}"

    cur.execute(
        """INSERT INTO experiments (
            id, title, description, module, drug_name, status,
            parameters_json, results_json, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            new_id, exp.title, exp.description, exp.module, exp.drug_name,
            exp.status, json.dumps(exp.parameters), json.dumps(exp.results),
            exp.created_by,
        ),
    )
    conn.commit()
    conn.close()

    log_audit(exp.created_by, "SAVE_EXPERIMENT", new_id, f"Saved {exp.module} experiment: {exp.title}")
    return {"id": new_id, "status": "SAVED", "message": f"Experiment {new_id} saved successfully."}


@router.delete("/{experiment_id}")
def delete_experiment(experiment_id: str):
    """Deletes an experiment."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM experiments WHERE id = ?", (experiment_id,))
    conn.commit()
    conn.close()

    log_audit("user", "DELETE_EXPERIMENT", experiment_id, "Deleted experiment")
    return {"status": "SUCCESS", "message": f"Experiment {experiment_id} deleted."}
