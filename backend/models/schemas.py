"""
PHARMA AI — API Request & Response Schemas
Type-safe Pydantic models for all computational modules, drug entities, and user auth.
"""

from typing import Dict, List, Optional, Any, Literal
from pydantic import BaseModel, Field


# --- Auth Schemas ---
class UserLoginRequest(BaseModel):
    email: str
    role: Optional[str] = "RESEARCHER"


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    institution: Optional[str] = None


# --- Drug Schemas ---
class DrugCreateRequest(BaseModel):
    name: str
    molecular_weight: float
    logp: float
    pka: Optional[float] = None
    solubility_mg_ml: float
    permeability_peff: Optional[float] = None
    bioavailability_f: float = Field(..., ge=0.0, le=1.0)
    clearance_l_h: float = Field(..., gt=0.0)
    vd_l: float = Field(..., gt=0.0)
    half_life_h: float = Field(..., gt=0.0)
    protein_binding_percent: Optional[float] = None
    bcs_class: str
    route: str = "Oral"
    default_dose_mg: float = Field(..., gt=0.0)
    provenance: str = "USER ENTERED"


class DrugResponse(DrugCreateRequest):
    id: str
    created_at: str


# --- Formulation Schemas ---
class FormulationAnalyzeRequest(BaseModel):
    name: str
    dosage_form: str = "Oral Matrix Tablet"
    total_tablet_weight_mg: float = 500.0
    api_dose_mg: float = 200.0
    polymer_percentage: float = 25.0
    disintegrant_percentage: float = 4.0
    lubricant_percentage: float = 1.0
    d50_particle_size_um: float = 45.0
    base_api_solubility_mg_ml: float = 0.5
    base_intrinsic_ka: float = 1.2


# --- QbD Schemas ---
class QbDEvaluateRequest(BaseModel):
    polymer_percentage: float = 25.0
    compression_force_kn: float = 12.0
    api_particle_size_d50_um: float = 45.0
    granulation_moisture_percent: float = 2.5


# --- Dissolution Schemas ---
class DissolutionSimulateRequest(BaseModel):
    model_type: Literal["zero_order", "first_order", "higuchi", "korsmeyer_peppas"] = "first_order"
    k_rate: float = 0.45
    n_exponent: float = 0.55
    t_end_h: float = 12.0


class DissolutionCompareRequest(BaseModel):
    reference_times: List[float]
    reference_curve: List[float]
    test_curve: List[float]
    ref_label: str = "Reference (Brand Standard)"
    test_label: str = "Test Formulation A"


# --- PK & PBPK Schemas ---
class PKSimulateRequest(BaseModel):
    dose_mg: float = 400.0
    ka_per_h: float = 1.2
    cl_l_per_h: float = 3.2
    vd_l: float = 9.8
    f_bioavail: float = 0.95
    t_end_h: float = 24.0


class PBPKSimulateRequest(BaseModel):
    dose_mg: float = 400.0
    body_weight_kg: float = 70.0
    ka_per_h: float = 1.2
    cl_hep_l_per_h: float = 14.0
    cl_renal_l_per_h: float = 4.0
    f_oral: float = 0.95
    kp_liver: float = 1.8
    kp_kidney: float = 2.0
    kp_tissue: float = 1.2
    t_end_h: float = 24.0


# --- Virtual Population Schemas ---
class VirtualPopSimulateRequest(BaseModel):
    population_size: int = 50
    age_min: float = 18.0
    age_max: float = 75.0
    female_ratio: float = 0.5
    dose_mg: float = 400.0
    ka_per_h: float = 1.2
    t_end_h: float = 24.0


# --- ML & Hybrid Schemas ---
class MLTrainRequest(BaseModel):
    model_type: Literal["ridge", "random_forest", "gradient_boosting"] = "random_forest"
    test_size: float = 0.2
    seed: int = 42


class HybridExperimentRequest(BaseModel):
    dose_mg: float = 400.0
    body_weight_kg: float = 70.0
    polymer_percent: float = 25.0
    particle_size_um: float = 45.0


# --- XAI Schemas ---
class XAIExplainRequest(BaseModel):
    features: Dict[str, float]
    target_name: str = "Predicted AUC_0_24 (mg*h/L)"


class PartialDependenceRequest(BaseModel):
    feature_name: str = "Polymer Conc (%)"
    min_val: float = 10.0
    max_val: float = 50.0


# --- Optimization Schemas ---
class OptimizationRequest(BaseModel):
    target_cmax: float = 12.5
    target_auc: float = 85.0
    dose_min: float = 100.0
    dose_max: float = 800.0
    polymer_min: float = 15.0
    polymer_max: float = 45.0
    d50_min: float = 20.0
    d50_max: float = 85.0


# --- Validation Schemas ---
class ValidationRequest(BaseModel):
    base_dose_mg: float = 400.0
    base_cl_l_h: float = 14.0
    base_vd_l: float = 28.0
    base_ka_per_h: float = 1.2
    base_f: float = 0.9


# --- Experiment & Report Schemas ---
class ExperimentSaveRequest(BaseModel):
    title: str
    description: Optional[str] = None
    module: str
    drug_name: Optional[str] = None
    parameters: Dict[str, Any]
    results: Dict[str, Any]
    status: str = "COMPLETED"
    created_by: str = "researcher@pharma-ai.org"


class ReportGenerateRequest(BaseModel):
    title: str
    author: str = "Pharma AI Computational Research Group"
    institution: str = "Department of Biopharmaceutics & Pharmacometrics"
    experiment_id: Optional[str] = None
    drug_name: Optional[str] = "Ibuprofen"
    include_sections: Optional[List[int]] = None
