"""
PHARMA AI — Scientific Engine: Machine Learning Module
Full scientific ML pipeline: Feature scaling, Train/Test splitting, Cross-Validation,
Rigorous Evaluation (MAE, RMSE, R2), Residual Diagnostics, and Feature Importance.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Tuple
import numpy as np
from sklearn.model_selection import train_test_split, KFold
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score


@dataclass
class MLEvaluationResult:
    model_name: str
    target_name: str
    train_mae: float
    train_rmse: float
    train_r2: float
    test_mae: float
    test_rmse: float
    test_r2: float
    cv_r2_mean: float
    cv_r2_std: float
    feature_names: List[str]
    feature_importances: List[Dict[str, float]]
    test_predictions: List[Dict[str, float]]  # {"actual": ..., "predicted": ..., "residual": ...}
    is_overfitted: bool
    status: str = "TRAINED"


def generate_benchmark_ml_dataset(
    n_samples: int = 200,
    seed: int = 42,
) -> Tuple[np.ndarray, np.ndarray, List[str], str]:
    """
    Generates a realistic benchmark pharmaceutical dataset linking API, formulation,
    and demographic parameters to Pharmacokinetic Exposure (AUC_0_24, mg*h/L).
    Features:
    0: Molecular Weight (g/mol) [150 - 500]
    1: LogP [-0.5 - 4.5]
    2: Intrinsic Solubility (mg/mL) [0.01 - 25.0]
    3: Polymer Percentage (%) [10 - 45]
    4: API Particle Size D50 (um) [15 - 90]
    5: Patient Body Weight (kg) [50 - 110]
    6: Age (years) [20 - 80]
    7: Dose (mg) [100 - 800]
    Target: AUC_0_24 (mg*h/L)
    """
    np.random.seed(seed)
    mw = np.random.uniform(150.0, 500.0, n_samples)
    logp = np.random.uniform(-0.5, 4.5, n_samples)
    solubility = np.random.exponential(3.0, n_samples) + 0.05
    polymer = np.random.uniform(10.0, 45.0, n_samples)
    d50 = np.random.uniform(15.0, 90.0, n_samples)
    weight = np.random.normal(74.0, 12.0, n_samples)
    age = np.random.uniform(20.0, 78.0, n_samples)
    dose = np.random.choice([100.0, 200.0, 400.0, 600.0, 800.0], n_samples)

    X = np.column_stack([mw, logp, solubility, polymer, d50, weight, age, dose])
    feature_names = [
        "Molecular Weight (g/mol)",
        "LogP",
        "Solubility (mg/mL)",
        "Polymer Conc (%)",
        "Particle Size D50 (um)",
        "Body Weight (kg)",
        "Age (years)",
        "Dose (mg)",
    ]

    # Mechanistic ground-truth mapping with non-linear relationships and experimental noise
    f_abs = np.clip(0.4 + 0.12 * logp - 0.005 * polymer + 0.08 * np.log1p(solubility), 0.1, 0.98)
    cl = 12.0 * ((weight / 70.0) ** 0.75) * (1.0 - 0.004 * (age - 40.0))
    cl = np.maximum(cl, 3.0)

    auc_true = (dose * f_abs) / cl
    # Add realistic experimental assay measurement noise (CV 8%)
    noise = np.random.normal(1.0, 0.08, n_samples)
    y = np.maximum(auc_true * noise, 0.5)

    return X, y, feature_names, "AUC_0_24 (mg*h/L)"


def train_and_evaluate_model(
    model_type: str = "random_forest",
    X: Optional[np.ndarray] = None,
    y: Optional[np.ndarray] = None,
    feature_names: Optional[List[str]] = None,
    test_size: float = 0.2,
    seed: int = 42,
) -> MLEvaluationResult:
    """
    Executes training, cross-validation, and metrics evaluation without data leakage.
    """
    if X is None or y is None:
        X, y, feature_names, target_name = generate_benchmark_ml_dataset(n_samples=220, seed=seed)
    else:
        target_name = "Target Variable"
        if feature_names is None:
            feature_names = [f"Feature {i+1}" for i in range(X.shape[1])]

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=seed
    )

    # Feature scaling fitted strictly on training data
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Instantiate model
    if model_type == "ridge":
        regressor = Ridge(alpha=1.0)
        reg_to_fit = X_train_scaled
        reg_to_test = X_test_scaled
    elif model_type == "random_forest":
        regressor = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=seed)
        reg_to_fit = X_train  # Tree models don't strictly require scaling
        reg_to_test = X_test
    elif model_type == "gradient_boosting":
        regressor = GradientBoostingRegressor(n_estimators=100, learning_rate=0.08, max_depth=4, random_state=seed)
        reg_to_fit = X_train
        reg_to_test = X_test
    else:
        raise ValueError(f"Unsupported model type: {model_type}")

    # Train model
    regressor.fit(reg_to_fit, y_train)

    y_train_pred = regressor.predict(reg_to_fit)
    y_test_pred = regressor.predict(reg_to_test)

    # Performance metrics
    train_mae = float(mean_absolute_error(y_train, y_train_pred))
    train_rmse = float(root_mean_squared_error(y_train, y_train_pred))
    train_r2 = float(r2_score(y_train, y_train_pred))

    test_mae = float(mean_absolute_error(y_test, y_test_pred))
    test_rmse = float(root_mean_squared_error(y_test, y_test_pred))
    test_r2 = float(r2_score(y_test, y_test_pred))

    # 5-fold cross-validation on training data
    kf = KFold(n_splits=5, shuffle=True, random_state=seed)
    cv_scores = []
    for train_idx, val_idx in kf.split(reg_to_fit):
        cv_model = regressor.__class__(**regressor.get_params())
        cv_model.fit(reg_to_fit[train_idx], y_train[train_idx])
        val_preds = cv_model.predict(reg_to_fit[val_idx])
        cv_scores.append(r2_score(y_train[val_idx], val_preds))

    cv_mean = float(np.mean(cv_scores))
    cv_std = float(np.std(cv_scores))

    # Feature importances
    if hasattr(regressor, "feature_importances_"):
        raw_imp = regressor.feature_importances_
    elif hasattr(regressor, "coef_"):
        raw_imp = np.abs(regressor.coef_)
        total = np.sum(raw_imp)
        raw_imp = raw_imp / total if total > 0 else raw_imp
    else:
        raw_imp = np.ones(len(feature_names)) / len(feature_names)

    feat_importances = [
        {"feature": name, "importance": round(float(imp), 4)}
        for name, imp in sorted(zip(feature_names, raw_imp), key=lambda x: x[1], reverse=True)
    ]

    # Test prediction points for charts
    test_points = []
    for actual, pred in zip(y_test, y_test_pred):
        res = float(actual - pred)
        test_points.append({
            "actual": round(float(actual), 3),
            "predicted": round(float(pred), 3),
            "residual": round(res, 3),
        })

    is_overfitted = bool((train_r2 - test_r2) > 0.18 and train_r2 > 0.85)

    return MLEvaluationResult(
        model_name=model_type,
        target_name=target_name,
        train_mae=round(train_mae, 4),
        train_rmse=round(train_rmse, 4),
        train_r2=round(train_r2, 4),
        test_mae=round(test_mae, 4),
        test_rmse=round(test_rmse, 4),
        test_r2=round(test_r2, 4),
        cv_r2_mean=round(cv_mean, 4),
        cv_r2_std=round(cv_std, 4),
        feature_names=feature_names,
        feature_importances=feat_importances,
        test_predictions=test_points,
        is_overfitted=is_overfitted,
        status="TRAINED",
    )
