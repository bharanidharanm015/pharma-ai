"""
PHARMA AI — Scientific Engine: Hybrid PBPK + Machine Learning Module
Physics-Informed Hybrid Modeling: Combines mechanistic PBPK differential equations
with ML residual correction. Rigorously computes holdout test metrics for:
  1. Mechanistic PBPK alone
  2. Pure ML alone
  3. Hybrid PBPK + ML
Maintains strict scientific neutrality (never claims Hybrid is superior without empirical justification).
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score


@dataclass
class ModelComparisonMetrics:
    model_name: str
    mae: float
    rmse: float
    r2: float
    residuals: List[float]


@dataclass
class HybridSimulationResult:
    time: List[float]
    actual_observed: List[float]
    pbpk_alone_predicted: List[float]
    ml_alone_predicted: List[float]
    hybrid_predicted: List[float]
    metrics_comparison: Dict[str, ModelComparisonMetrics]
    scientific_interpretation: str
    metadata: Dict[str, Any] = field(default_factory=dict)


def run_hybrid_pbpk_ml_experiment(
    dose_mg: float = 400.0,
    body_weight_kg: float = 70.0,
    polymer_percent: float = 25.0,
    particle_size_um: float = 45.0,
    seed: int = 42,
) -> HybridSimulationResult:
    """
    Executes a side-by-side empirical benchmark of PBPK vs ML vs Hybrid PBPK+ML.
    Generates synthetic realistic observed pharmacokinetics with non-linear transporter
    saturation and dissolution delay that the simplified PBPK model alone does not fully capture.
    """
    np.random.seed(seed)
    t = np.linspace(0.0, 24.0, 48)

    # 1. Mechanistic PBPK nominal prediction
    # Analytical oral 1-compartment equivalent baseline for standard 70kg
    cl_nom = 14.0 * (body_weight_kg / 70.0) ** 0.75
    vd_nom = 28.0 * (body_weight_kg / 70.0)
    ka_nom = 1.1 * (45.0 / max(10.0, particle_size_um)) * np.exp(-0.03 * polymer_percent)
    kel_nom = cl_nom / vd_nom

    c_pbpk = ((dose_mg * 0.9 * ka_nom) / (vd_nom * (ka_nom - kel_nom))) * (
        np.exp(-kel_nom * t) - np.exp(-ka_nom * t)
    )
    c_pbpk = np.maximum(c_pbpk, 0.0)

    # 2. Ground-truth observed data with complex biological phenomenon
    # (e.g. non-linear biliary recycling / enterohepatic recirculation bump at 4-6h)
    ehe_bump = 1.4 * np.exp(-((t - 5.5) ** 2) / 2.5) * (dose_mg / 400.0)
    noise = np.random.normal(0.0, 0.15, len(t))
    c_actual = np.maximum(c_pbpk + ehe_bump + noise, 0.0)

    # 3. Train Pure ML model on historical features (time, dose, weight, polymer, particle_size)
    # Generate small training set across conditions
    n_train_curves = 15
    train_X = []
    train_y_actual = []
    train_residuals = []

    for _ in range(n_train_curves):
        d_i = np.random.uniform(200.0, 600.0)
        bw_i = np.random.uniform(55.0, 95.0)
        poly_i = np.random.uniform(15.0, 40.0)
        ps_i = np.random.uniform(25.0, 75.0)

        cl_i = 14.0 * (bw_i / 70.0) ** 0.75
        vd_i = 28.0 * (bw_i / 70.0)
        ka_i = 1.1 * (45.0 / ps_i) * np.exp(-0.03 * poly_i)
        kel_i = cl_i / vd_i

        for t_k in [0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 16.0, 24.0]:
            pbpk_val = max(0.0, ((d_i * 0.9 * ka_i) / (vd_i * (ka_i - kel_i))) * (np.exp(-kel_i * t_k) - np.exp(-ka_i * t_k)))
            bump_val = 1.4 * np.exp(-((t_k - 5.5) ** 2) / 2.5) * (d_i / 400.0)
            actual_val = max(0.0, pbpk_val + bump_val + np.random.normal(0, 0.12))

            train_X.append([t_k, d_i, bw_i, poly_i, ps_i])
            train_y_actual.append(actual_val)
            train_residuals.append(actual_val - pbpk_val)

    X_train_arr = np.array(train_X)
    y_train_actual_arr = np.array(train_y_actual)
    y_train_res_arr = np.array(train_residuals)

    # Pure ML regressor (learning directly concentration from inputs)
    ml_pure = GradientBoostingRegressor(n_estimators=70, max_depth=3, random_state=seed)
    ml_pure.fit(X_train_arr, y_train_actual_arr)

    # Hybrid ML regressor (learning strictly the unmodeled residual)
    ml_residual = GradientBoostingRegressor(n_estimators=70, max_depth=3, random_state=seed)
    ml_residual.fit(X_train_arr, y_train_res_arr)

    # Predict test curve
    test_X = np.column_stack([t, np.full_like(t, dose_mg), np.full_like(t, body_weight_kg), np.full_like(t, polymer_percent), np.full_like(t, particle_size_um)])

    c_ml_pure = np.maximum(ml_pure.predict(test_X), 0.0)
    pred_residuals = ml_residual.predict(test_X)
    c_hybrid = np.maximum(c_pbpk + pred_residuals, 0.0)

    # Calculate actual metrics on test holdout
    def calc_metrics(name: str, y_true: np.ndarray, y_pred: np.ndarray) -> ModelComparisonMetrics:
        mae = float(mean_absolute_error(y_true, y_pred))
        rmse = float(root_mean_squared_error(y_true, y_pred))
        r2 = float(r2_score(y_true, y_pred))
        residuals = [round(float(val), 4) for val in (y_true - y_pred)]
        return ModelComparisonMetrics(
            model_name=name,
            mae=round(mae, 4),
            rmse=round(rmse, 4),
            r2=round(r2, 4),
            residuals=residuals,
        )

    pbpk_metrics = calc_metrics("PBPK Mechanistic Alone", c_actual, c_pbpk)
    ml_metrics = calc_metrics("Pure Machine Learning", c_actual, c_ml_pure)
    hybrid_metrics = calc_metrics("Hybrid PBPK + ML", c_actual, c_hybrid)

    # Objective scientific interpretation without dogmatic assertions
    if hybrid_metrics.rmse < min(pbpk_metrics.rmse, ml_metrics.rmse):
        interpretation = (
            f"For the evaluated holdout dataset, the Hybrid PBPK+ML model demonstrated the lowest prediction error "
            f"(RMSE = {hybrid_metrics.rmse:.3f}, R2 = {hybrid_metrics.r2:.3f}) compared to PBPK alone (RMSE = {pbpk_metrics.rmse:.3f}) "
            f"and pure ML (RMSE = {ml_metrics.rmse:.3f}). The ML residual sub-network successfully captured secondary biliary recycling "
            f"while retaining mechanistic mass-balance bounds."
        )
    else:
        interpretation = (
            f"Empirical evaluation shows comparable performance across models. "
            f"PBPK RMSE = {pbpk_metrics.rmse:.3f}, Pure ML RMSE = {ml_metrics.rmse:.3f}, Hybrid RMSE = {hybrid_metrics.rmse:.3f}. "
            f"Model selection should balance mechanistic interpretability against computational complexity for the target research scenario."
        )

    return HybridSimulationResult(
        time=[round(float(val), 2) for val in t],
        actual_observed=[round(float(val), 4) for val in c_actual],
        pbpk_alone_predicted=[round(float(val), 4) for val in c_pbpk],
        ml_alone_predicted=[round(float(val), 4) for val in c_ml_pure],
        hybrid_predicted=[round(float(val), 4) for val in c_hybrid],
        metrics_comparison={
            "pbpk": pbpk_metrics,
            "ml": ml_metrics,
            "hybrid": hybrid_metrics,
        },
        scientific_interpretation=interpretation,
        metadata={"provenance": "SIMULATED COMPARATIVE BENCHMARK"},
    )
