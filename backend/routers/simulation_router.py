"""
PHARMA AI — Scientific Computation Router
Exposes all scientific engine modules to the frontend and external researchers.
Ensures rigorous numerical validation, error trapping, and scientific provenance.
"""

import sys
import os
from fastapi import APIRouter, HTTPException
from typing import Dict, Any

# Ensure scientific-engine is in python path
ENGINE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "scientific-engine"))
if ENGINE_PATH not in sys.path:
    sys.path.insert(0, ENGINE_PATH)

from pk.models import simulate_one_compartment_oral, simulate_one_compartment_iv
from pbpk.models import simulate_pbpk_5compartment
from dissolution.models import simulate_dissolution_profile, compare_dissolution_profiles
from formulation.models import analyze_formulation
from qbd.models import evaluate_design_space, generate_default_qbd_matrix
from virtual_population.models import generate_virtual_population, simulate_population_pk
from ml.models import train_and_evaluate_model
from hybrid.models import run_hybrid_pbpk_ml_experiment
from explainability.models import explain_individual_prediction, compute_partial_dependence
from optimization.models import optimize_formulation_for_target_pk
from validation.models import compute_parameter_sensitivity, run_residual_diagnostics, generate_full_validation_report

from backend.models.schemas import (
    PKSimulateRequest,
    PBPKSimulateRequest,
    DissolutionSimulateRequest,
    DissolutionCompareRequest,
    FormulationAnalyzeRequest,
    QbDEvaluateRequest,
    VirtualPopSimulateRequest,
    MLTrainRequest,
    HybridExperimentRequest,
    XAIExplainRequest,
    PartialDependenceRequest,
    OptimizationRequest,
    ValidationRequest,
)

router = APIRouter(prefix="/api/simulations", tags=["Scientific Simulations"])


# --- PK Endpoints ---
@router.post("/pk")
def run_pk_simulation(req: PKSimulateRequest):
    """Simulates 1-compartment oral pharmacokinetics."""
    try:
        res = simulate_one_compartment_oral(
            dose_mg=req.dose_mg,
            ka_per_h=req.ka_per_h,
            cl_l_per_h=req.cl_l_per_h,
            vd_l=req.vd_l,
            f_bioavail=req.f_bioavail,
            t_end_h=req.t_end_h,
        )
        return res.__dict__
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PK simulation error: {str(e)}")


# --- PBPK Endpoints ---
@router.post("/pbpk")
def run_pbpk_simulation(req: PBPKSimulateRequest):
    """Simulates 5-compartment whole-body physiological pharmacokinetics."""
    try:
        res = simulate_pbpk_5compartment(
            dose_mg=req.dose_mg,
            body_weight_kg=req.body_weight_kg,
            ka_per_h=req.ka_per_h,
            cl_hep_l_per_h=req.cl_hep_l_per_h,
            cl_renal_l_per_h=req.cl_renal_l_per_h,
            f_oral=req.f_oral,
            kp_liver=req.kp_liver,
            kp_kidney=req.kp_kidney,
            kp_tissue=req.kp_tissue,
            t_end_h=req.t_end_h,
        )
        return res.__dict__
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PBPK simulation error: {str(e)}")


# --- Dissolution Endpoints ---
@router.post("/dissolution")
def run_dissolution_simulation(req: DissolutionSimulateRequest):
    """Simulates drug release profile using selected mathematical model."""
    try:
        res = simulate_dissolution_profile(
            model_type=req.model_type,
            k_rate=req.k_rate,
            n_exponent=req.n_exponent,
            t_end_h=req.t_end_h,
        )
        return res.__dict__
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Dissolution error: {str(e)}")


@router.post("/dissolution/compare")
def compare_dissolution(req: DissolutionCompareRequest):
    """Computes regulatory f1 difference and f2 similarity metrics."""
    try:
        res = compare_dissolution_profiles(
            reference_times=req.reference_times,
            reference_curve=req.reference_curve,
            test_curve=req.test_curve,
            ref_label=req.ref_label,
            test_label=req.test_label,
        )
        return res.__dict__
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Comparison error: {str(e)}")


# --- Formulation & QbD Endpoints ---
@router.post("/formulation/analyze")
def run_formulation_analysis(req: FormulationAnalyzeRequest):
    """Calculates excipient balance, drug loading, and Noyes-Whitney dissolution coupling."""
    try:
        res = analyze_formulation(
            name=req.name,
            dosage_form=req.dosage_form,
            total_tablet_weight_mg=req.total_tablet_weight_mg,
            api_dose_mg=req.api_dose_mg,
            polymer_percentage=req.polymer_percentage,
            disintegrant_percentage=req.disintegrant_percentage,
            lubricant_percentage=req.lubricant_percentage,
            d50_particle_size_um=req.d50_particle_size_um,
            base_api_solubility_mg_ml=req.base_api_solubility_mg_ml,
            base_intrinsic_ka=req.base_intrinsic_ka,
        )
        return res.__dict__
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Formulation error: {str(e)}")


@router.get("/qbd/matrix")
def get_qbd_matrix():
    """Returns default ICH Q8(R2) QbD risk matrix elements."""
    return generate_default_qbd_matrix()


@router.post("/qbd/evaluate")
def evaluate_qbd(req: QbDEvaluateRequest):
    """Verifies operating point against Proven Acceptable Range design space."""
    try:
        res = evaluate_design_space(
            polymer_percentage=req.polymer_percentage,
            compression_force_kn=req.compression_force_kn,
            api_particle_size_d50_um=req.api_particle_size_d50_um,
            granulation_moisture_percent=req.granulation_moisture_percent,
        )
        return res.__dict__
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"QbD evaluation error: {str(e)}")


# --- Virtual Population Endpoints ---
@router.post("/population")
def run_virtual_population_simulation(req: VirtualPopSimulateRequest):
    """Generates virtual patient cohort and simulates population PK envelope."""
    try:
        cohort = generate_virtual_population(
            population_size=req.population_size,
            age_min=req.age_min,
            age_max=req.age_max,
            female_ratio=req.female_ratio,
        )
        sim = simulate_population_pk(
            population=cohort,
            dose_mg=req.dose_mg,
            ka_per_h=req.ka_per_h,
            t_end_h=req.t_end_h,
        )
        return sim.__dict__
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Population simulation error: {str(e)}")


# --- Machine Learning & Hybrid Endpoints ---
@router.post("/ml/train")
def run_ml_training(req: MLTrainRequest):
    """Trains and evaluates scientific regression model on benchmark dataset."""
    try:
        res = train_and_evaluate_model(
            model_type=req.model_type,
            test_size=req.test_size,
            seed=req.seed,
        )
        # Convert dataclass with nested dictionaries
        out = res.__dict__.copy()
        return out
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ML training error: {str(e)}")


@router.post("/hybrid")
def run_hybrid_simulation(req: HybridExperimentRequest):
    """Runs empirical benchmark of PBPK alone vs ML alone vs Hybrid PBPK+ML."""
    try:
        res = run_hybrid_pbpk_ml_experiment(
            dose_mg=req.dose_mg,
            body_weight_kg=req.body_weight_kg,
            polymer_percent=req.polymer_percent,
            particle_size_um=req.particle_size_um,
        )
        return {
            "time": res.time,
            "actual_observed": res.actual_observed,
            "pbpk_alone_predicted": res.pbpk_alone_predicted,
            "ml_alone_predicted": res.ml_alone_predicted,
            "hybrid_predicted": res.hybrid_predicted,
            "metrics_comparison": {
                k: v.__dict__ for k, v in res.metrics_comparison.items()
            },
            "scientific_interpretation": res.scientific_interpretation,
            "metadata": res.metadata,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Hybrid experiment error: {str(e)}")


# --- Explainable AI Endpoints ---
@router.post("/xai/explain")
def explain_prediction(req: XAIExplainRequest):
    """Explains an individual prediction via local feature attributions."""
    try:
        res = explain_individual_prediction(
            features=req.features,
            target_name=req.target_name,
        )
        return {
            "predicted_value": res.predicted_value,
            "baseline_value": res.baseline_value,
            "unit": res.unit,
            "attributions": [attr.__dict__ for attr in res.attributions],
            "plain_language_summary": res.plain_language_summary,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"XAI error: {str(e)}")


@router.post("/xai/partial-dependence")
def get_partial_dependence(req: PartialDependenceRequest):
    """Calculates partial dependence curve for input feature."""
    try:
        res = compute_partial_dependence(
            feature_name=req.feature_name,
            min_val=req.min_val,
            max_val=req.max_val,
        )
        return res.__dict__
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Partial dependence error: {str(e)}")


# --- Optimization Endpoints ---
@router.post("/optimize")
def run_optimization(req: OptimizationRequest):
    """Discovers computational candidate parameters to match target exposure."""
    try:
        res = optimize_formulation_for_target_pk(
            target_cmax=req.target_cmax,
            target_auc=req.target_auc,
            dose_bounds=(req.dose_min, req.dose_max),
            polymer_bounds=(req.polymer_min, req.polymer_max),
            d50_bounds=(req.d50_min, req.d50_max),
        )
        return res.__dict__
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Optimization error: {str(e)}")


# --- Validation Endpoints ---
@router.post("/validation")
def run_validation_analysis(req: ValidationRequest):
    """Executes OAT parameter sensitivity sweeps and validation diagnostic summary."""
    try:
        sensitivities = compute_parameter_sensitivity(
            base_dose_mg=req.base_dose_mg,
            base_cl_l_h=req.base_cl_l_h,
            base_vd_l=req.base_vd_l,
            base_ka_per_h=req.base_ka_per_h,
            base_f=req.base_f,
        )
        # Convert sweep points to dicts
        out_sens = []
        for s in sensitivities:
            s_dict = s.__dict__.copy()
            s_dict["sweep_points"] = [pt.__dict__ for pt in s.sweep_points]
            out_sens.append(s_dict)

        rep = generate_full_validation_report(model_name="PBPK Mechanistic Engine v1.2")
        return {
            "model_name": rep.model_name,
            "sensitivities": out_sens,
            "most_sensitive_parameter_for_auc": rep.most_sensitive_parameter_for_auc,
            "most_sensitive_parameter_for_cmax": rep.most_sensitive_parameter_for_cmax,
            "validation_status": rep.validation_status,
            "metadata": rep.metadata,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
