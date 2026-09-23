"""
PHARMA AI — Scientific Engine: Physiologically-Based Pharmacokinetics (PBPK) Module
5-Compartment Whole-Body Mechanistic ODE Solver with SciPy integration and continuous
mass balance conservation checks.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
import numpy as np
from scipy.integrate import solve_ivp


@dataclass
class PBPKSimulationResult:
    time: List[float]
    plasma_conc: List[float]
    liver_conc: List[float]
    kidney_conc: List[float]
    tissue_conc: List[float]
    gut_amount: List[float]
    eliminated_amount: List[float]
    c_max_plasma: float
    t_max_plasma: float
    auc_plasma: float
    mass_balance_error_percent: float
    organ_kps: Dict[str, float]
    metadata: Dict[str, Any] = field(default_factory=dict)


def simulate_pbpk_5compartment(
    dose_mg: float,
    body_weight_kg: float = 70.0,
    ka_per_h: float = 1.0,
    cl_hep_l_per_h: float = 15.0,
    cl_renal_l_per_h: float = 5.0,
    f_oral: float = 1.0,
    kp_liver: float = 1.8,
    kp_kidney: float = 2.0,
    kp_tissue: float = 1.2,
    t_end_h: float = 24.0,
    num_points: int = 150,
) -> PBPKSimulationResult:
    """
    Simulates a 5-compartment oral PBPK model:
    1. Gut Lumen (A_gut)
    2. Systemic Plasma / Central Blood (C_plasma, V_plasma)
    3. Liver (C_liver, V_liver)
    4. Kidney (C_kidney, V_kidney)
    5. Peripheral Tissue (C_tissue, V_tissue)
    6. Eliminated mass (A_elim)
    """
    if dose_mg <= 0 or body_weight_kg <= 0:
        raise ValueError("Dose and body weight must be strictly positive.")
    if ka_per_h <= 0 or cl_hep_l_per_h < 0 or cl_renal_l_per_h < 0:
        raise ValueError("Kinetic and clearance parameters must be valid non-negative numbers.")

    # Physiological organ volumes (scaled to standard adult 70kg)
    scale = body_weight_kg / 70.0
    v_plasma = 5.0 * scale        # L (vascular volume)
    v_liver = 1.7 * scale         # L
    v_kidney = 0.3 * scale        # L
    v_tissue = 35.0 * scale       # L (muscle, adipose, other organs)

    # Organ blood flows (L/h)
    q_liver = 90.0 * (scale ** 0.75)    # ~1500 mL/min
    q_kidney = 72.0 * (scale ** 0.75)   # ~1200 mL/min
    q_tissue = 138.0 * (scale ** 0.75)  # Remaining cardiac output
    q_cardiac = q_liver + q_kidney + q_tissue

    effective_dose = dose_mg * f_oral

    # State vector y = [A_gut, C_plasma, C_liver, C_kidney, C_tissue, A_elim]
    y0 = [effective_dose, 0.0, 0.0, 0.0, 0.0, 0.0]

    def ode_system(t, y):
        a_gut, c_p, c_l, c_k, c_t, a_elim = y

        # Concentration leaving tissue into venous blood
        c_l_out = c_l / kp_liver
        c_k_out = c_k / kp_kidney
        c_t_out = c_t / kp_tissue

        # 1. Gut lumen
        da_gut_dt = -ka_per_h * a_gut

        # 2. Liver (receives absorption flux from gut portal + arterial blood)
        dc_l_dt = (
            ka_per_h * a_gut
            + q_liver * (c_p - c_l_out)
            - cl_hep_l_per_h * c_l_out
        ) / v_liver

        # 3. Kidney (receives arterial blood, clears drug)
        dc_k_dt = (
            q_kidney * (c_p - c_k_out)
            - cl_renal_l_per_h * c_k_out
        ) / v_kidney

        # 4. Peripheral tissue (distribution)
        dc_t_dt = (q_tissue * (c_p - c_t_out)) / v_tissue

        # 5. Systemic Plasma / Blood
        dc_p_dt = (
            q_liver * c_l_out
            + q_kidney * c_k_out
            + q_tissue * c_t_out
            - q_cardiac * c_p
        ) / v_plasma

        # 6. Cumulative Eliminated Mass
        da_elim_dt = (cl_hep_l_per_h * c_l_out) + (cl_renal_l_per_h * c_k_out)

        return [da_gut_dt, dc_p_dt, dc_l_dt, dc_k_dt, dc_t_dt, da_elim_dt]

    t_eval = np.linspace(0.0, max(1.0, t_end_h), num_points)
    sol = solve_ivp(
        ode_system,
        t_span=(0.0, max(1.0, t_end_h)),
        y0=y0,
        t_eval=t_eval,
        method="RK45",
        rtol=1e-6,
        atol=1e-8,
    )

    if not sol.success:
        # Fallback to Radau for stiff equations
        sol = solve_ivp(
            ode_system,
            t_span=(0.0, max(1.0, t_end_h)),
            y0=y0,
            t_eval=t_eval,
            method="Radau",
            rtol=1e-5,
            atol=1e-7,
        )

    a_gut_arr = np.maximum(sol.y[0], 0.0)
    c_p_arr = np.maximum(sol.y[1], 0.0)
    c_l_arr = np.maximum(sol.y[2], 0.0)
    c_k_arr = np.maximum(sol.y[3], 0.0)
    c_t_arr = np.maximum(sol.y[4], 0.0)
    a_elim_arr = np.maximum(sol.y[5], 0.0)

    # Mass balance validation:
    # Total mass = A_gut + V_p*C_p + V_l*C_l + V_k*C_k + V_t*C_t + A_elim
    total_mass_end = (
        a_gut_arr[-1]
        + v_plasma * c_p_arr[-1]
        + v_liver * c_l_arr[-1]
        + v_kidney * c_k_arr[-1]
        + v_tissue * c_t_arr[-1]
        + a_elim_arr[-1]
    )
    mass_balance_error_percent = float(abs(total_mass_end - effective_dose) / effective_dose * 100.0)

    c_max_idx = int(np.argmax(c_p_arr))
    c_max_plasma = float(c_p_arr[c_max_idx])
    t_max_plasma = float(sol.t[c_max_idx])
    auc_plasma = float(np.trapezoid(c_p_arr, sol.t))

    return PBPKSimulationResult(
        time=[round(float(t_val), 3) for t_val in sol.t],
        plasma_conc=[round(float(val), 4) for val in c_p_arr],
        liver_conc=[round(float(val), 4) for val in c_l_arr],
        kidney_conc=[round(float(val), 4) for val in c_k_arr],
        tissue_conc=[round(float(val), 4) for val in c_t_arr],
        gut_amount=[round(float(val), 3) for val in a_gut_arr],
        eliminated_amount=[round(float(val), 3) for val in a_elim_arr],
        c_max_plasma=round(c_max_plasma, 4),
        t_max_plasma=round(t_max_plasma, 3),
        auc_plasma=round(auc_plasma, 4),
        mass_balance_error_percent=round(mass_balance_error_percent, 3),
        organ_kps={"liver": kp_liver, "kidney": kp_kidney, "tissue": kp_tissue},
        metadata={
            "dose_mg": dose_mg,
            "body_weight_kg": body_weight_kg,
            "cardiac_output_l_h": round(q_cardiac, 2),
            "solver": sol.status,
            "status": "SIMULATED",
        },
    )
