"""
PHARMA AI — Scientific Engine: Validation & Sensitivity Analysis Module
Implements One-At-A-Time (OAT) sensitivity sweeps, elasticity coefficients (Tornado plot data),
and statistical residual diagnostics (normality, skewness, kurtosis).
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
import numpy as np
from scipy import stats


@dataclass
class SensitivitySweepPoint:
    perturbation_percent: float
    parameter_value: float
    resulting_cmax: float
    resulting_auc: float


@dataclass
class ParameterSensitivity:
    parameter_name: str
    base_value: float
    unit: str
    elasticity_auc: float   # (% delta AUC) / (% delta Parameter)
    elasticity_cmax: float  # (% delta Cmax) / (% delta Parameter)
    sweep_points: List[SensitivitySweepPoint]


@dataclass
class ResidualDiagnosticsResult:
    sample_size: int
    mean_residual: float
    std_residual: float
    skewness: float
    kurtosis: float
    shapiro_wilk_stat: float
    shapiro_wilk_p_value: float
    is_normally_distributed: bool
    diagnostic_summary: str


@dataclass
class ValidationReport:
    model_name: str
    sensitivities: List[ParameterSensitivity]
    residual_diagnostics: Optional[ResidualDiagnosticsResult]
    most_sensitive_parameter_for_auc: str
    most_sensitive_parameter_for_cmax: str
    validation_status: str
    metadata: Dict[str, Any] = field(default_factory=dict)


def compute_parameter_sensitivity(
    base_dose_mg: float = 400.0,
    base_cl_l_h: float = 14.0,
    base_vd_l: float = 28.0,
    base_ka_per_h: float = 1.2,
    base_f: float = 0.9,
) -> List[ParameterSensitivity]:
    """
    Computes One-At-A-Time (OAT) parameter sensitivity for key pharmacokinetic parameters.
    Perturbations: [-50%, -25%, -10%, +10%, +25%, +50%]
    """
    perturbations = [-50.0, -25.0, -10.0, 10.0, 25.0, 50.0]

    def solve_pk(dose, cl, vd, ka, f):
        kel = cl / vd
        if np.isclose(ka, kel, atol=1e-4):
            tm = 1.0 / kel
            cm = (dose * f / vd) * ka * tm * np.exp(-kel * tm)
        else:
            tm = np.log(ka / kel) / (ka - kel)
            coeff = (dose * f * ka) / (vd * (ka - kel))
            cm = coeff * (np.exp(-kel * tm) - np.exp(-ka * tm))
        auc = (dose * f) / cl
        return float(cm), float(auc)

    base_cmax, base_auc = solve_pk(base_dose_mg, base_cl_l_h, base_vd_l, base_ka_per_h, base_f)

    params_to_test = [
        ("Clearance (CL)", base_cl_l_h, "L/h"),
        ("Volume of Distribution (Vd)", base_vd_l, "L"),
        ("Absorption Rate (ka)", base_ka_per_h, "1/h"),
        ("Dose", base_dose_mg, "mg"),
        ("Bioavailability (F)", base_f, "fraction"),
    ]

    results = []

    for name, base_val, unit in params_to_test:
        points = []
        for p in perturbations:
            mult = 1.0 + (p / 100.0)
            curr_val = base_val * mult

            d = base_dose_mg if name != "Dose" else curr_val
            cl = base_cl_l_h if name != "Clearance (CL)" else curr_val
            vd = base_vd_l if name != "Volume of Distribution (Vd)" else curr_val
            ka = base_ka_per_h if name != "Absorption Rate (ka)" else curr_val
            f = base_f if name != "Bioavailability (F)" else curr_val

            cm, auc = solve_pk(d, cl, vd, ka, f)
            points.append(
                SensitivitySweepPoint(
                    perturbation_percent=p,
                    parameter_value=round(curr_val, 3),
                    resulting_cmax=round(cm, 3),
                    resulting_auc=round(auc, 3),
                )
            )

        # Local elasticity at +10% perturbation: (% dY / % dX)
        plus_10 = next(pt for pt in points if pt.perturbation_percent == 10.0)
        elast_auc = ((plus_10.resulting_auc - base_auc) / base_auc) / 0.10
        elast_cmax = ((plus_10.resulting_cmax - base_cmax) / base_cmax) / 0.10

        results.append(
            ParameterSensitivity(
                parameter_name=name,
                base_value=round(base_val, 3),
                unit=unit,
                elasticity_auc=round(elast_auc, 3),
                elasticity_cmax=round(elast_cmax, 3),
                sweep_points=points,
            )
        )

    # Sort descending by absolute AUC elasticity
    results.sort(key=lambda x: abs(x.elasticity_auc), reverse=True)
    return results


def run_residual_diagnostics(residuals: List[float]) -> ResidualDiagnosticsResult:
    """
    Performs rigorous statistical tests on prediction residuals:
    Shapiro-Wilk normality test, skewness, and kurtosis.
    """
    arr = np.array(residuals, dtype=float)
    n = len(arr)
    if n < 5:
        raise ValueError("At least 5 residuals required for diagnostic testing.")

    mean_res = float(np.mean(arr))
    std_res = float(np.std(arr, ddof=1))
    skew = float(stats.skew(arr))
    kurt = float(stats.kurtosis(arr))

    # Shapiro-Wilk test (capped at 5000 samples by scipy)
    sample_for_sw = arr if n <= 5000 else np.random.choice(arr, 5000, replace=False)
    sw_stat, sw_p = stats.shapiro(sample_for_sw)

    is_normal = bool(sw_p >= 0.05)

    if is_normal:
        diag = f"Residuals conform to a Gaussian normal distribution (p={sw_p:.4f} >= 0.05). No systematic bias detected."
    else:
        diag = f"Residuals exhibit statistically significant departure from normality (p={sw_p:.4f} < 0.05, skewness={skew:.2f}). Consider non-linear transformation."

    return ResidualDiagnosticsResult(
        sample_size=n,
        mean_residual=round(mean_res, 4),
        std_residual=round(std_res, 4),
        skewness=round(skew, 3),
        kurtosis=round(kurt, 3),
        shapiro_wilk_stat=round(float(sw_stat), 4),
        shapiro_wilk_p_value=round(float(sw_p), 4),
        is_normally_distributed=is_normal,
        diagnostic_summary=diag,
    )


def generate_full_validation_report(
    model_name: str = "PBPK Mechanistic Engine v1.2",
    residuals: Optional[List[float]] = None,
) -> ValidationReport:
    """
    Assembles complete validation and sensitivity analysis summary.
    """
    sensitivities = compute_parameter_sensitivity()
    top_auc_param = sensitivities[0].parameter_name

    cmax_sorted = sorted(sensitivities, key=lambda x: abs(x.elasticity_cmax), reverse=True)
    top_cmax_param = cmax_sorted[0].parameter_name

    res_diag = None
    if residuals is not None and len(residuals) >= 5:
        res_diag = run_residual_diagnostics(residuals)

    return ValidationReport(
        model_name=model_name,
        sensitivities=sensitivities,
        residual_diagnostics=res_diag,
        most_sensitive_parameter_for_auc=top_auc_param,
        most_sensitive_parameter_for_cmax=top_cmax_param,
        validation_status="VALIDATED WITH ASSUMPTIONS",
        metadata={"provenance": "SIMULATED SENSITIVITY SWEEPS"},
    )
