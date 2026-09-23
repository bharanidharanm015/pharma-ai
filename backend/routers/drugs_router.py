"""
PHARMA AI — Drug Library Router
Full CRUD for pharmaceutical active ingredients with provenance tracking and parameter validation.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import json
import uuid

from backend.database import get_db_connection, log_audit
from backend.models.schemas import DrugCreateRequest, DrugResponse

router = APIRouter(prefix="/api/drugs", tags=["Drug Library"])


@router.get("", response_model=List[DrugResponse])
def list_drugs(search: Optional[str] = None, bcs_class: Optional[str] = None):
    """Retrieves all drugs with optional filtering."""
    conn = get_db_connection()
    cur = conn.cursor()

    query = "SELECT * FROM drugs WHERE 1=1"
    params = []

    if search:
        query += " AND (name LIKE ? OR route LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term])

    if bcs_class:
        query += " AND bcs_class LIKE ?"
        params.append(f"%{bcs_class}%")

    query += " ORDER BY name ASC"
    cur.execute(query, params)
    rows = cur.fetchall()
    conn.close()

    return [dict(row) for row in rows]


@router.get("/{drug_id}", response_model=DrugResponse)
def get_drug(drug_id: str):
    """Retrieves specific drug by ID."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM drugs WHERE id = ? OR name = ?", (drug_id, drug_id))
    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Drug not found.")
    return dict(row)


@router.post("", response_model=DrugResponse)
def create_drug(drug: DrugCreateRequest):
    """Adds a new drug to the library."""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT id FROM drugs WHERE LOWER(name) = LOWER(?)", (drug.name,))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"Drug '{drug.name}' already exists in library.")

    new_id = f"DRUG-{uuid.uuid4().hex[:6].upper()}"

    cur.execute(
        """INSERT INTO drugs (
            id, name, molecular_weight, logp, pka, solubility_mg_ml,
            permeability_peff, bioavailability_f, clearance_l_h, vd_l,
            half_life_h, protein_binding_percent, bcs_class, route,
            default_dose_mg, provenance
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            new_id, drug.name, drug.molecular_weight, drug.logp, drug.pka,
            drug.solubility_mg_ml, drug.permeability_peff, drug.bioavailability_f,
            drug.clearance_l_h, drug.vd_l, drug.half_life_h,
            drug.protein_binding_percent, drug.bcs_class, drug.route,
            drug.default_dose_mg, drug.provenance,
        ),
    )
    conn.commit()

    cur.execute("SELECT * FROM drugs WHERE id = ?", (new_id,))
    created = cur.fetchone()
    conn.close()

    log_audit("user", "CREATE_DRUG", new_id, f"Added compound {drug.name}")
    return dict(created)


@router.delete("/{drug_id}")
def delete_drug(drug_id: str):
    """Deletes user-entered drug."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM drugs WHERE id = ?", (drug_id,))
    row = cur.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Drug not found.")

    cur.execute("DELETE FROM drugs WHERE id = ?", (drug_id,))
    conn.commit()
    conn.close()

    log_audit("user", "DELETE_DRUG", drug_id, f"Deleted compound {row['name']}")
    return {"status": "SUCCESS", "message": f"Drug {drug_id} successfully deleted."}
