"""
PHARMA AI — Authentication & Role-Based Access Control Router
Manages users, role permissions (Student, Researcher, Supervisor, Admin),
and platform audit logs.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any

from backend.database import get_db_connection, log_audit
from backend.models.schemas import UserLoginRequest, UserProfileResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication & Roles"])

ROLE_PERMISSIONS = {
    "STUDENT": [
        "view_docs",
        "run_simulations",
        "view_own_results",
    ],
    "RESEARCHER": [
        "view_docs",
        "run_simulations",
        "view_own_results",
        "manage_drugs",
        "manage_formulations",
        "train_models",
        "save_experiments",
        "generate_reports",
    ],
    "SUPERVISOR": [
        "view_docs",
        "run_simulations",
        "view_all_results",
        "review_experiments",
        "review_reports",
        "view_audit_logs",
    ],
    "ADMIN": [
        "view_docs",
        "run_simulations",
        "view_all_results",
        "manage_drugs",
        "manage_formulations",
        "train_models",
        "save_experiments",
        "generate_reports",
        "review_experiments",
        "review_reports",
        "view_audit_logs",
        "manage_users",
        "configure_platform",
    ],
}


@router.get("/users")
def get_all_users():
    """Lists available system users for role switching."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, email, full_name, role, institution FROM users")
    users = [dict(r) for r in cur.fetchall()]
    conn.close()
    return users


@router.post("/login")
def login(req: UserLoginRequest):
    """Logs in or switches active role."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email = ?", (req.email,))
    user = cur.fetchone()

    if not user:
        # Create user if logging in with custom test email
        new_id = f"USR-{abs(hash(req.email)) % 10000:04d}"
        role = req.role if req.role in ROLE_PERMISSIONS else "RESEARCHER"
        cur.execute(
            "INSERT INTO users (id, email, full_name, role, institution) VALUES (?, ?, ?, ?, ?)",
            (new_id, req.email, req.email.split("@")[0].title(), role, "Research Institute"),
        )
        conn.commit()
        cur.execute("SELECT * FROM users WHERE id = ?", (new_id,))
        user = cur.fetchone()

    user_dict = dict(user)
    conn.close()

    perms = ROLE_PERMISSIONS.get(user_dict["role"], ROLE_PERMISSIONS["STUDENT"])
    log_audit(user_dict["email"], "LOGIN", user_dict["id"], f"Logged in with role {user_dict['role']}")

    return {
        "token": f"bearer_token_{user_dict['id']}",
        "user": user_dict,
        "permissions": perms,
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
