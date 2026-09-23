"""
PHARMA AI — Scientific Engine: Multi-Objective Constrained Optimization Module
Computational candidate identification for target exposure (Cmax, AUC) and dissolution kinetics
using SciPy bounded numerical optimization.
Strictly labels outputs as 'Computational Candidate' (never clinical recommendations).
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
import numpy as np
from scipy.optimize import minimize, Bounds


@dataclass
class OptimizationCandidate:
    candidate_id: str
    target_cmax: float
    target_auc: float
    optimized_dose_mg: float
    optimized_polymer_percent: float
    optimized_d50_um: float
    predicted_cmax: float
    predicted_tmax_h: float
    predicted_auc: float
    predicted_dissolution_8h_percent: float
    loss_score: float
    convergence_status: str
    provenance: str = "Computational candidate within defined search space"


def optimize_formulation_for_target_pk(
    target_cmax: float = 12.5,
    target_auc: float = 85.0,
    dose_bounds: tuple = (100.0, 800.0),
    polymer_bounds: tuple = (15.0, 45.0),
    d50_bounds: tuple = (20.0, 85.0),
    cl_l_h: float = 14.0,
    vd_l: float = 28.0,
) -> OptimizationCandidate:
    """
    Finds optimal formulation variables (Dose, Polymer %, Particle Size D50) to minimize
    squared relative deviation from target pharmacokinetic exposure goals.
    """
    if target_cmax <= 0 or target_auc <= 0:
        raise ValueError("Target Cmax and AUC must be strictly positive.")

    kel = cl_l_h / vd_l

    def loss_function(params):
        dose, polymer, d50 = params

        # Mechanistic ka estimation from formulation parameters
        size_factor = 45.0 / max(5.0, d50)
        ka = float(1.2 * size_factor * np.exp(-0.04 * polymer))
        ka = max(0.1, min(3.0, ka))

        # Bioavailability modulation by polymer entrapment
        f_bio = 0.95 * (1.0 - 0.003 * polymer)

        # Analytical Cmax and AUC
        if np.isclose(ka, kel, atol=1e-4):
            t_max = 1.0 / kel
            c_max = (dose * f_bio / vd_l) * ka * t_max * np.exp(-kel * t_max)
        else:
            t_max = np.log(ka / kel) / (ka - kel)
            coeff = (dose * f_bio * ka) / (vd_l * (ka - kel))
            c_max = coeff * (np.exp(-kel * t_max) - np.exp(-ka * t_max))

        auc = (dose * f_bio) / cl_l_h

        # Relative squared error loss
        cmax_err = ((c_max - target_cmax) / target_cmax) ** 2
        auc_err = ((auc - target_auc) / target_auc) ** 2

        return cmax_err + auc_err

    # Initial guess (midpoints of bounds)
    x0 = [
        (dose_bounds[0] + dose_bounds[1]) / 2.0,
        (polymer_bounds[0] + polymer_bounds[1]) / 2.0,
        (d50_bounds[0] + d50_bounds[1]) / 2.0,
    ]

    bounds = Bounds(
        lb=[dose_bounds[0], polymer_bounds[0], d50_bounds[0]],
        ub=[dose_bounds[1], polymer_bounds[1], d50_bounds[1]],
    )

    res = minimize(
        loss_function,
        x0=x0,
        method="L-BFGS-B",
        bounds=bounds,
        options={"maxiter": 300, "ftol": 1e-9},
    )

    opt_dose, opt_polymer, opt_d50 = res.x

    # Compute final metrics at optimum
    size_factor = 45.0 / max(5.0, opt_d50)
    opt_ka = float(1.2 * size_factor * np.exp(-0.04 * opt_polymer))
    opt_ka = max(0.1, min(3.0, opt_ka))
    f_bio = 0.95 * (1.0 - 0.003 * opt_polymer)

    if np.isclose(opt_ka, kel, atol=1e-4):
        pred_tmax = 1.0 / kel
        pred_cmax = (opt_dose * f_bio / vd_l) * opt_ka * pred_tmax * np.exp(-kel * pred_tmax)
    else:
        pred_tmax = np.log(opt_ka / kel) / (opt_ka - kel)
        coeff = (opt_dose * f_bio * opt_ka) / (vd_l * (opt_ka - kel))
        pred_cmax = coeff * (np.exp(-kel * pred_tmax) - np.exp(-opt_ka * pred_tmax))

    pred_auc = (opt_dose * f_bio) / cl_l_h

    # Estimated 8-hour dissolution release percentage
    k_diss = 0.5 * size_factor * np.exp(-0.05 * opt_polymer)
    diss_8h = float(min(100.0, 100.0 * (1.0 - np.exp(-k_diss * 8.0))))

    return OptimizationCandidate(
        candidate_id=f"CAND-{abs(hash((target_cmax, target_auc))) % 100000:05d}",
        target_cmax=round(target_cmax, 2),
        target_auc=round(target_auc, 2),
        optimized_dose_mg=round(float(opt_dose), 1),
        optimized_polymer_percent=round(float(opt_polymer), 2),
        optimized_d50_um=round(float(opt_d50), 1),
        predicted_cmax=round(float(pred_cmax), 3),
        predicted_tmax_h=round(float(pred_tmax), 2),
        predicted_auc=round(float(pred_auc), 3),
        predicted_dissolution_8h_percent=round(diss_8h, 1),
        loss_score=round(float(res.fun), 6),
        convergence_status="CONVERGED" if res.success else "ITERATION_LIMIT",
        provenance="Computational candidate within defined search space",
    )
