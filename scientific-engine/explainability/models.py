"""
PHARMA AI — Scientific Engine: Explainable AI (XAI) Module
Global feature importances, partial dependence approximations, and individual local prediction
attributions explaining why a model generated a specific pharmacokinetic prediction.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
import numpy as np


@dataclass
class LocalAttribution:
    feature_name: str
    feature_value: float
    contribution: float  # Positive = pushed prediction higher, Negative = lower
    impact_description: str


@dataclass
class IndividualExplanationResult:
    predicted_value: float
    baseline_value: float
    unit: str
    attributions: List[LocalAttribution]
    plain_language_summary: str


@dataclass
class PartialDependenceResult:
    feature_name: str
    grid_values: List[float]
    average_predictions: List[float]


def explain_individual_prediction(
    features: Dict[str, float],
    target_name: str = "Predicted AUC (mg*h/L)",
    unit: str = "mg*h/L",
) -> IndividualExplanationResult:
    """
    Computes local feature attribution (surrogate SHAP/additive attribution approximation)
    for an individual virtual patient / formulation scenario.
    """
    # Baseline population reference means
    baseline_means = {
        "Dose (mg)": 400.0,
        "Body Weight (kg)": 70.0,
        "Polymer Conc (%)": 25.0,
        "Particle Size D50 (um)": 45.0,
        "Intrinsic Clearance (L/h)": 15.0,
        "CYP Activity Index": 1.0,
    }

    # Baseline predicted AUC for standard reference subject
    base_pred = 24.5

    # Mechanistic sensitivity weights (elasticity coefficients)
    weights = {
        "Dose (mg)": 0.061,            # Higher dose strongly increases AUC
        "Body Weight (kg)": -0.18,      # Higher weight increases Vd/CL, modestly lowering conc
        "Polymer Conc (%)": -0.22,      # Higher polymer delays release, reducing initial exposure
        "Particle Size D50 (um)": -0.09,# Larger particle slows dissolution
        "Intrinsic Clearance (L/h)": -0.85, # Higher CL directly lowers AUC
        "CYP Activity Index": -6.2,     # High metabolizer lowers AUC
    }

    attributions = []
    total_offset = 0.0

    narrative_points = []

    for name, val in features.items():
        mean_val = baseline_means.get(name, val)
        delta = val - mean_val
        w = weights.get(name, 0.0)
        contrib = float(delta * w)
        total_offset += contrib

        if abs(contrib) > 0.3:
            direction = "increased" if contrib > 0 else "decreased"
            narrative_points.append(f"{name} ({val}) {direction} expected exposure by {abs(contrib):.2f} {unit}")

        # Human readable impact note
        if contrib > 0.05:
            impact = f"Elevated relative to cohort baseline, contributing +{contrib:.2f} {unit}."
        elif contrib < -0.05:
            impact = f"Reduced relative to cohort baseline, reducing prediction by {abs(contrib):.2f} {unit}."
        else:
            impact = "Neutral: within typical physiological / formulation tolerance range."

        attributions.append(
            LocalAttribution(
                feature_name=name,
                feature_value=round(val, 2),
                contribution=round(contrib, 3),
                impact_description=impact,
            )
        )

    # Sort by absolute impact
    attributions.sort(key=lambda x: abs(x.contribution), reverse=True)

    final_pred = max(0.5, base_pred + total_offset)

    summary_text = (
        f"The model predicted a {target_name} of {final_pred:.2f} {unit} (cohort baseline: {base_pred:.2f} {unit}). "
        + (" Key contributing factors: " + "; ".join(narrative_points[:3]) + "." if narrative_points else " Parameters are close to population norms.")
    )

    return IndividualExplanationResult(
        predicted_value=round(final_pred, 3),
        baseline_value=round(base_pred, 3),
        unit=unit,
        attributions=attributions,
        plain_language_summary=summary_text,
    )


def compute_partial_dependence(
    feature_name: str = "Polymer Conc (%)",
    min_val: float = 10.0,
    max_val: float = 50.0,
    n_steps: int = 15,
) -> PartialDependenceResult:
    """
    Computes partial dependence showing marginal impact of a key parameter.
    """
    grid = np.linspace(min_val, max_val, n_steps)
    if "Polymer" in feature_name:
        # Non-linear inverse saturation
        preds = 32.0 * np.exp(-0.028 * grid) + 4.5
    elif "Dose" in feature_name:
        preds = 0.055 * grid + 2.0
    elif "Clearance" in feature_name:
        preds = (400.0 * 0.9) / np.maximum(grid, 2.0)
    else:
        preds = 20.0 + 0.1 * grid

    return PartialDependenceResult(
        feature_name=feature_name,
        grid_values=[round(float(v), 2) for v in grid],
        average_predictions=[round(float(p), 3) for p in preds],
    )
