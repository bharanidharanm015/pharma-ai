"""
PHARMA AI — Scientific Engine: Dissolution Kinetics Module
Mathematical models for drug release: Zero-Order, First-Order, Higuchi, Korsmeyer-Peppas,
and FDA/EMA regulatory f1/f2 dissolution profile similarity testing.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Literal
import numpy as np


@dataclass
class DissolutionCurve:
    model_name: str
    time: List[float]
    release_percent: List[float]
    parameters: Dict[str, float]
    mechanism_note: str


@dataclass
class DissolutionComparisonResult:
    reference_name: str
    test_name: str
    time: List[float]
    reference_release: List[float]
    test_release: List[float]
    f1_difference: float
    f2_similarity: float
    is_similar: bool
    regulatory_conclusion: str


def simulate_dissolution_profile(
    model_type: Literal["zero_order", "first_order", "higuchi", "korsmeyer_peppas"],
    k_rate: float,
    n_exponent: float = 0.5,
    t_end_h: float = 12.0,
    num_points: int = 100,
) -> DissolutionCurve:
    """
    Simulates dissolution percentage over time.
    """
    if k_rate <= 0:
        raise ValueError("Dissolution rate constant k must be positive.")
    if t_end_h <= 0:
        raise ValueError("Simulation duration must be positive.")

    t = np.linspace(0.0, t_end_h, num_points)

    if model_type == "zero_order":
        # Q = k0 * t
        q = np.clip(k_rate * t, 0.0, 100.0)
        note = "Zero-Order: Constant release rate independent of residual drug concentration (e.g., osmotic pumps)."
        params = {"k0_percent_per_h": k_rate}

    elif model_type == "first_order":
        # Q = 100 * (1 - exp(-k1 * t))
        q = 100.0 * (1.0 - np.exp(-k_rate * t))
        note = "First-Order: Release rate directly proportional to remaining drug content (e.g., conventional immediate release tablets)."
        params = {"k1_per_h": k_rate}

    elif model_type == "higuchi":
        # Q = kH * sqrt(t)
        q = np.clip(k_rate * np.sqrt(t), 0.0, 100.0)
        note = "Higuchi Model: Pure square-root-of-time diffusion from a planar matrix system."
        params = {"kH_percent_per_sqrt_h": k_rate}

    elif model_type == "korsmeyer_peppas":
        # Q = kKP * t^n
        if n_exponent <= 0:
            raise ValueError("Korsmeyer-Peppas exponent n must be positive.")
        # At t=0, 0^n is 0
        with np.errstate(divide='ignore', invalid='ignore'):
            q_raw = k_rate * np.power(t, n_exponent)
            q = np.nan_to_num(q_raw, nan=0.0)
        q = np.clip(q, 0.0, 100.0)

        if n_exponent <= 0.45:
            mechanism = "Fickian diffusion (Case I transport)"
        elif 0.45 < n_exponent < 0.89:
            mechanism = "Anomalous transport (coupled diffusion and matrix polymer relaxation)"
        elif np.isclose(n_exponent, 0.89, atol=0.03):
            mechanism = "Case II transport (zero-order relaxation-controlled release)"
        else:
            mechanism = "Super Case II transport (rapid swelling & matrix disentanglement)"

        note = f"Korsmeyer-Peppas: Exponent n={n_exponent:.2f} indicates {mechanism}."
        params = {"k_kp": k_rate, "n_exponent": n_exponent}

    else:
        raise ValueError(f"Unknown dissolution model: {model_type}")

    return DissolutionCurve(
        model_name=model_type,
        time=[round(float(val), 3) for val in t],
        release_percent=[round(float(val), 3) for val in q],
        parameters=params,
        mechanism_note=note,
    )


def compare_dissolution_profiles(
    reference_times: List[float],
    reference_curve: List[float],
    test_curve: List[float],
    ref_label: str = "Reference Formulation",
    test_label: str = "Test Formulation",
) -> DissolutionComparisonResult:
    """
    Computes FDA/EMA similarity factor f2 and difference factor f1.
    Criteria:
      f1 in [0, 15] and f2 in [50, 100] denotes bioequivalence / similarity.
    """
    r = np.array(reference_curve, dtype=float)
    t = np.array(test_curve, dtype=float)

    if len(r) != len(t):
        raise ValueError("Reference and Test curves must have identical number of evaluation time points.")
    if len(r) < 3:
        raise ValueError("At least 3 dissolution time points are required for f1/f2 analysis.")

    # Exclude time point 0 if release is zero for denominator stability in f1
    mask = (r > 0.0)
    if not np.any(mask):
        mask = np.ones_like(r, dtype=bool)

    diff = np.abs(r[mask] - t[mask])
    sum_ref = np.sum(r[mask])

    f1 = float((np.sum(diff) / sum_ref) * 100.0) if sum_ref > 0 else 0.0

    # f2 equation
    n_pts = len(r)
    sum_sq_diff = np.sum((r - t) ** 2)
    bracket = (1.0 + (1.0 / n_pts) * sum_sq_diff) ** (-0.5)
    f2 = float(50.0 * np.log10(max(1e-6, bracket * 100.0)))

    is_similar = bool((0.0 <= f1 <= 15.0) and (50.0 <= f2 <= 100.0))

    if is_similar:
        conclusion = f"Profiles are similar according to FDA/EMA criteria (f1={f1:.2f}% <= 15%, f2={f2:.2f} >= 50)."
    else:
        conclusion = f"Profiles are statistically distinct (f1={f1:.2f}%, f2={f2:.2f}). Formulation modification required."

    return DissolutionComparisonResult(
        reference_name=ref_label,
        test_name=test_label,
        time=[round(float(x), 3) for x in reference_times],
        reference_release=[round(float(x), 3) for x in r],
        test_release=[round(float(x), 3) for x in t],
        f1_difference=round(f1, 2),
        f2_similarity=round(f2, 2),
        is_similar=is_similar,
        regulatory_conclusion=conclusion,
    )
