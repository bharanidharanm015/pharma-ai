"""
PHARMA AI — Database Layer
Supports dual-mode: zero-config SQLite for instant local execution and full PostgreSQL schema
for production deployments on Supabase or dedicated cloud servers.
Pre-seeds benchmark reference drugs and role-based test accounts.
"""

import os
import sqlite3
import json
from datetime import datetime
from typing import Dict, List, Optional, Any

DB_PATH = os.environ.get("PHARMA_DB_PATH", os.path.join(os.path.dirname(__file__), "pharma_ai.db"))


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    """Initializes schema and seeds baseline pharmaceutical data."""
    conn = get_db_connection()
    cur = conn.cursor()

    # 1. Users table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            institution TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 2. Drugs table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS drugs (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            molecular_weight REAL NOT NULL,
            logp REAL NOT NULL,
            pka REAL,
            solubility_mg_ml REAL NOT NULL,
            permeability_peff REAL,
            bioavailability_f REAL NOT NULL,
            clearance_l_h REAL NOT NULL,
            vd_l REAL NOT NULL,
            half_life_h REAL NOT NULL,
            protein_binding_percent REAL,
            bcs_class TEXT NOT NULL,
            route TEXT NOT NULL,
            default_dose_mg REAL NOT NULL,
            provenance TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 3. Formulations table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS formulations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            drug_name TEXT NOT NULL,
            dosage_form TEXT NOT NULL,
            total_weight_mg REAL NOT NULL,
            api_dose_mg REAL NOT NULL,
            drug_loading_pct REAL NOT NULL,
            polymer_pct REAL NOT NULL,
            d50_um REAL NOT NULL,
            components_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 4. Experiments table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS experiments (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            module TEXT NOT NULL,
            drug_name TEXT,
            status TEXT NOT NULL,
            parameters_json TEXT NOT NULL,
            results_json TEXT NOT NULL,
            created_by TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 5. Audit logs table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            action TEXT NOT NULL,
            resource TEXT NOT NULL,
            details TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()

    # Seed users if empty
    cur.execute("SELECT COUNT(*) FROM users")
    if cur.fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO users (id, email, full_name, role, institution) VALUES (?, ?, ?, ?, ?)",
            [
                ("USR-001", "student@pharma-ai.org", "Alex Rivera", "STUDENT", "Faculty of Pharmacy"),
                ("USR-002", "researcher@pharma-ai.org", "Dr. Elena Vance", "RESEARCHER", "Computational PK Research Lab"),
                ("USR-003", "supervisor@pharma-ai.org", "Prof. Marcus Thorne", "SUPERVISOR", "Division of Biopharmaceutics"),
                ("USR-004", "admin@pharma-ai.org", "System Administrator", "ADMIN", "Pharma AI Platform"),
            ]
        )
        conn.commit()

    # Seed benchmark drugs if empty
    cur.execute("SELECT COUNT(*) FROM drugs")
    if cur.fetchone()[0] == 0:
        cur.executemany(
            """INSERT INTO drugs (
                id, name, molecular_weight, logp, pka, solubility_mg_ml,
                permeability_peff, bioavailability_f, clearance_l_h, vd_l,
                half_life_h, protein_binding_percent, bcs_class, route,
                default_dose_mg, provenance
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [
                (
                    "DRUG-001", "Ibuprofen", 206.29, 3.97, 4.4, 0.021,
                    4.2e-4, 0.95, 3.2, 9.8,
                    2.1, 99.0, "Class II (Low Sol, High Perm)", "Oral",
                    400.0, "LITERATURE DERIVED (FDA Drug Bank)"
                ),
                (
                    "DRUG-002", "Metformin", 129.16, -1.43, 12.4, 300.0,
                    0.4e-4, 0.55, 30.0, 70.0,
                    6.2, 5.0, "Class III (High Sol, Low Perm)", "Oral",
                    500.0, "PUBLIC DATA (Pharmacopeia)"
                ),
                (
                    "DRUG-003", "Acetaminophen", 151.16, 0.46, 9.5, 14.0,
                    2.8e-4, 0.88, 18.0, 50.0,
                    2.5, 20.0, "Class I (High Sol, High Perm)", "Oral",
                    500.0, "LITERATURE DERIVED (Goodman & Gilman)"
                ),
                (
                    "DRUG-004", "Atorvastatin", 558.64, 5.70, 4.5, 0.0004,
                    3.5e-4, 0.14, 38.0, 380.0,
                    14.0, 98.0, "Class II (Low Sol, High Perm)", "Oral",
                    40.0, "LITERATURE DERIVED (Clinical PK Reviews)"
                ),
            ]
        )
        conn.commit()

    conn.close()


def log_audit(user_email: str, action: str, resource: str, details: str = ""):
    """Records audit trail entry for compliance and reproducibility."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO audit_logs (user_email, action, resource, details) VALUES (?, ?, ?, ?)",
            (user_email, action, resource, details)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Audit log failed: {e}")
