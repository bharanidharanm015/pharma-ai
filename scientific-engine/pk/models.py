"""
PHARMA AI — Scientific Engine: Pharmacokinetic (PK) Module
Provides analytical and numerical solutions for 1-compartment and 2-compartment oral/IV PK,
along with comprehensive Non-Compartmental Analysis (NCA) metrics.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any
import numpy as np


@dataclass
class PKSimulationResult:
    time: List[float]
    concentration: List[float]
    c_max: float
    t_max: float
    auc_0_last: float
    auc_0_inf: float
    t_half: float
    clearance: float
    v_d: float
    kel: float
    model_type: str
    metadata: Dict[str, Any] = field(default_factory=dict)


def simulate_one_compartment_oral(
    dose_mg: float,
    ka_per_h: float,
    cl_l_per_h: float,
    vd_l: float,
    f_bioavail: float = 1.0,
    t_end_h: float = 24.0,
    num_points: int = 120,
) -> PKSimulationResult:
    """
    Simulates a 1-compartment oral absorption model.
    Analytical equation:
        C(t) = [Dose * F * ka / (Vd * (ka - kel))] * (exp(-kel * t) - exp(-ka * t))
    where kel = CL / Vd.
    """
    if dose_mg <= 0:
        raise ValueError("Dose must be greater than 0.")
    if ka_per_h <= 0:
        raise ValueError("Absorption rate constant (ka) must be greater than 0.")
    if cl_l_per_h <= 0:
        raise ValueError("Clearance (CL) must be greater than 0.")
    if vd_l <= 0:
        raise ValueError("Volume of distribution (Vd) must be greater than 0.")
    if not (0 < f_bioavail <= 1.0):
        raise ValueError("Bioavailability (F) must be between 0 and 1.0.")

    kel = cl_l_per_h / vd_l
    t = np.linspace(0.0, max(1.0, t_end_h), num_points)

    # Avoid division by zero if ka == kel
    if np.isclose(ka_per_h, kel, atol=1e-5):
        c = (dose_mg * f_bioavail / vd_l) * ka_per_h * t * np.exp(-kel * t)
        t_max = 1.0 / kel
    else:
        coeff = (dose_mg * f_bioavail * ka_per_h) / (vd_l * (ka_per_h - kel))
        c = coeff * (np.exp(-kel * t) - np.exp(-ka_per_h * t))
        c = np.maximum(c, 0.0)
        t_max = np.log(ka_per_h / kel) / (ka_per_h - kel)

    c_max = float(np.max(c))
    if 0 <= t_max <= t_end_h and not np.isclose(ka_per_h, kel, atol=1e-5):
        c_max_analytic = coeff * (np.exp(-kel * t_max) - np.exp(-ka_per_h * t_max))
        c_max = float(max(c_max, c_max_analytic))

    auc_0_last = float(np.trapezoid(c, t))
    auc_0_inf = float((dose_mg * f_bioavail) / cl_l_per_h)
    t_half = float(np.log(2) / kel)

    return PKSimulationResult(
        time=t.tolist(),
        concentration=[round(float(val), 5) for val in c],
        c_max=round(c_max, 4),
        t_max=round(float(t_max), 3),
        auc_0_last=round(auc_0_last, 4),
        auc_0_inf=round(auc_0_inf, 4),
        t_half=round(t_half, 3),
        clearance=round(cl_l_per_h, 4),
        v_d=round(vd_l, 4),
        kel=round(kel, 4),
        model_type="1-Compartment Oral",
        metadata={
            "dose_mg": dose_mg,
            "ka": ka_per_h,
            "bioavailability": f_bioavail,
            "status": "SIMULATED",
        },
    )


def simulate_one_compartment_iv(
    dose_mg: float,
    cl_l_per_h: float,
    vd_l: float,
    t_end_h: float = 24.0,
    num_points: int = 120,
) -> PKSimulationResult:
    """
    Simulates a 1-compartment IV bolus model.
    Analytical equation:
        C(t) = (Dose / Vd) * exp(-kel * t)
    """
    if dose_mg <= 0 or cl_l_per_h <= 0 or vd_l <= 0:
        raise ValueError("Parameters must be strictly positive.")

    kel = cl_l_per_h / vd_l
    t = np.linspace(0.0, max(1.0, t_end_h), num_points)
    c = (dose_mg / vd_l) * np.exp(-kel * t)

    c_max = float(c[0])
    t_max = 0.0
    auc_0_last = float(np.trapezoid(c, t))
    auc_0_inf = float(dose_mg / cl_l_per_h)
    t_half = float(np.log(2) / kel)

    return PKSimulationResult(
        time=t.tolist(),
        concentration=[round(float(val), 5) for val in c],
        c_max=round(c_max, 4),
        t_max=t_max,
        auc_0_last=round(auc_0_last, 4),
        auc_0_inf=round(auc_0_inf, 4),
        t_half=round(t_half, 3),
        clearance=round(cl_l_per_h, 4),
        v_d=round(vd_l, 4),
        kel=round(kel, 4),
        model_type="1-Compartment IV Bolus",
        metadata={"dose_mg": dose_mg, "status": "SIMULATED"},
    )
