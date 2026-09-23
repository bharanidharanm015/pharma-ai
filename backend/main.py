"""
PHARMA AI — Backend Service Application
Main FastAPI application connecting scientific computing engines, database persistence,
and Next.js frontend clients.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from backend.database import init_database
from backend.routers import (
    drugs_router,
    simulation_router,
    experiments_router,
    reports_router,
    auth_router,
)

app = FastAPI(
    title="Pharma AI Research Platform API",
    description="AI-Enhanced PBPK + QbD + Personalized Drug Delivery Digital Twin Scientific Backend",
    version="1.0.0",
)

# CORS configuration allowing local Next.js development and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Initializes database schema and populates reference drug models."""
    init_database()
    print("PHARMA AI — Database initialized and benchmark drugs seeded.")


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time-Sec"] = f"{process_time:.4f}"
    return response


# Include Routers
app.include_router(auth_router.router)
app.include_router(drugs_router.router)
app.include_router(simulation_router.router)
app.include_router(experiments_router.router)
app.include_router(reports_router.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    """System health check and scientific engine diagnostics."""
    return {
        "status": "HEALTHY",
        "service": "Pharma AI Scientific Backend",
        "version": "1.0.0",
        "scientific_engines": [
            "PK-1C/2C",
            "PBPK-5Organ-ODE",
            "Dissolution-Kinetics",
            "Formulation-QbD",
            "Virtual-Patient-MonteCarlo",
            "ML-Regressor-Ensemble",
            "Hybrid-PBPK-ML",
            "Explainable-AI",
            "Optimization-SciPy",
            "Validation-Sensitivity",
        ],
        "disclaimer": "COMPUTATIONAL PHARMACEUTICAL RESEARCH PROTOTYPE. Not a clinical decision device.",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
