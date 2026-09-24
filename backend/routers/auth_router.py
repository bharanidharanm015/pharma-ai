"""
PHARMA AI — Private Single-User Authentication Router
Strict Single-User Private Research Platform Access.
All multi-role systems (Student, Researcher, Supervisor, Admin) and role switching have been removed.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
import os

from backend.database import get_db_connection, log_audit
from backend.models.schemas import UserLoginRequest, UserProfileResponse

router = APIRouter(prefix="/api/auth", tags=["Private Research Authentication"])


@router.post("/login")
def login(req: UserLoginRequest):
    """Verifies private research credentials for the single authorized researcher."""
    authorized_email = os.environ.get("NEXT_PUBLIC_RESEARCHER_EMAIL", "").strip().lower()

    if authorized_email and req.email.strip().lower() != authorized_email:
        raise HTTPException(
            status_code=403,
            detail="Unauthorized Access: Only the authorized researcher account can access this platform.",
        )

    log_audit(req.email, "LOGIN", "RESEARCH_ACCESS", "Private research session initiated")

    return {
        "token": f"private_session_{abs(hash(req.email)) % 100000:05d}",
        "user": {
            "email": req.email,
            "title": "Authorized Research Investigator",
            "access_type": "PRIVATE_RESEARCH_ACCESS",
        },
    }


@router.get("/audit-logs")
def get_audit_logs(limit: int = 50):
    """Retrieves recent platform audit trail logs."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows
