/**
 * PHARMA AI — TypeScript Type Definitions
 * Strict Single-Admin Private Pharmaceutical Research & Simulation Platform
 */

// ==============================================================================
// 1. ADMIN AUTH & SESSION
// ==============================================================================
export interface AdminSession {
  isAuthenticated: boolean;
  email: string;
  adminName: string;
  token?: string;
  sessionStartedAt: string;
}

// ==============================================================================
// 2. DRUGS & RESEARCH SCENARIOS
// ==============================================================================
export interface Drug {
  id: string;
  name: string;
  dose_mg: number;
  molecular_weight: number;
  solubility_mg_ml: number;
  permeability_peff: number; // 10^-4 cm/s
  half_life_h: number;
  clearance_l_h: number;
  vd_l: number;
  bioavailability_f: number;
  pka?: number;
  logp: number;
  bcs_class?: string;
  route?: string;
  provenance?: string;
  is_demo?: boolean;
  created_at?: string;
}

// ==============================================================================
// 3. FORMULATIONS
// ==============================================================================
export interface FormulationComponent {
  name: string;
  role: "API" | "Polymer" | "Filler" | "Disintegrant" | "Lubricant" | "Surfactant";
  percentage_w_w: number;
}

export interface Formulation {
  id: string;
  name: string;
  drug_id?: string;
  drug_name: string;
  dosage_form: "Matrix Tablet" | "Capsule" | "Multiparticulate" | "Osmotic Pump" | "Suspension";
  type: "Immediate Release" | "Extended Release" | "Delayed / Enteric" | "Sustained Release";
  api_amount_mg: number;
  polymer_concentration: number; // % w/w
  particle_size_d50_um: number; // D50 in microns
  release_characteristics: "Diffusion-controlled" | "Polymer Erosion" | "Anomalous Transport" | "Zero-Order Osmotic";
  components: FormulationComponent[];
  is_demo?: boolean;
  created_at?: string;
}

// ==============================================================================
// 4. DISSOLUTION KINETICS & ABSORPTION
// ==============================================================================
export type DissolutionModelType = "zero_order" | "first_order" | "higuchi" | "korsmeyer_peppas" | "hixson_crowell";

export interface DissolutionCurveResult {
  model_name: string;
  duration_h: number;
  time_step_h: number;
  time: number[];
  percent_dissolved: number[];
  rate_constant_k: number;
  release_exponent_n?: number;
  r_squared: number;
  assumptions: string;
  is_demo?: boolean;
}

export interface GICompartmentState {
  segment: "Stomach" | "Duodenum" | "Jejunum" | "Ileum" | "Colon";
  ph: number;
  transit_time_h: number;
  dissolved_amount_mg: number;
  undissolved_amount_mg: number;
  absorbed_flux_rate_mg_h: number;
}

export interface AbsorptionResult {
  time: number[];
  absorption_rate_mg_h: number[];
  fraction_absorbed: number[]; // 0 to 1
  cumulative_absorbed_mg: number[];
  fa_infinity: number;
  t_lag_h: number;
  rate_limiting_step: "Solubility / Dissolution Limited" | "Permeability Limited" | "Well Absorbed (Class I)";
  gi_transit_breakdown: GICompartmentState[];
  is_demo?: boolean;
}

// ==============================================================================
// 5. PHARMACOKINETICS (1C/2C) & PBPK (5-ORGAN)
// ==============================================================================
export interface ClassicalPKResult {
  model_type: "1-Compartment Oral" | "1-Compartment IV" | "2-Compartment Oral";
  time: number[];
  concentration: number[];
  c_max: number;
  t_max: number;
  auc_0_last: number;
  auc_0_inf: number;
  half_life_h: number;
  clearance_l_h: number;
  vd_l: number;
  kel: number;
  equations: {
    ode: string;
    analytical: string;
  };
  is_demo?: boolean;
}

export interface PBPKOrganCurve {
  name: string;
  concentrations: number[];
  volume_l: number;
  kp: number;
  flow_l_h: number;
}

export interface PBPKResult {
  time: number[];
  plasma_conc: number[];
  liver_conc: number[];
  kidney_conc: number[];
  tissue_conc: number[];
  gut_amount: number[];
  eliminated_amount: number[];
  c_max_plasma: number;
  t_max_plasma: number;
  auc_plasma: number;
  mass_balance_error_percent: number; // Guaranteed < 0.05%
  organ_kps: {
    liver: number;
    kidney: number;
    tissue: number;
  };
  physiological_parameters: {
    cardiac_output_l_h: number;
    body_weight_kg: number;
    hematocrit: number;
  };
  is_demo?: boolean;
}

// ==============================================================================
// 6. VIRTUAL POPULATIONS & PATIENTS
// ==============================================================================
export interface VirtualPatient {
  id: string;
  patient_code: string;
  age_years: number;
  sex: "Male" | "Female";
  weight_kg: number;
  height_cm: number;
  bmi: number;
  cyp_activity_index: number;
  scaled_clearance_l_h: number;
  scaled_vd_l: number;
  c_max: number;
  auc: number;
  trajectory?: number[];
  provenance_tag: string;
  is_demo?: boolean;
}

export interface VirtualPopulationResult {
  cohort_size: number;
  random_seed: number;
  time: number[];
  percentile_5: number[];
  percentile_25: number[];
  percentile_50: number[]; // Median
  percentile_75: number[];
  percentile_95: number[];
  mean_profile: number[];
  cmax_mean: number;
  cmax_cv_percent: number;
  auc_mean: number;
  auc_cv_percent: number;
  patients: VirtualPatient[];
  provenance: string;
  is_demo?: boolean;
}

// ==============================================================================
// 7. MACHINE LEARNING & PREDICTIONS
// ==============================================================================
export type MLModelType = "Linear Regression" | "Random Forest" | "Gradient Boosting";

export interface MLPredictionPoint {
  actual: number;
  predicted: number;
  residual: number;
}

export interface MLFeatureImportance {
  feature: string;
  importance: number;
}

export interface MLResult {
  model_type: MLModelType;
  target_metric: "Cmax" | "AUC" | "Tmax";
  train_size: number;
  test_size: number;
  mae: number;
  rmse: number;
  r2: number;
  feature_importance: MLFeatureImportance[];
  test_predictions: MLPredictionPoint[];
  status: "TRAINED_EVALUATED";
  is_demo?: boolean;
}

// ==============================================================================
// 8. HYBRID MODELING (PBPK + ML)
// ==============================================================================
export interface HybridModelMetrics {
  mae: number;
  rmse: number;
  r2: number;
}

export interface HybridResult {
  time: number[];
  observed_actual: number[];
  pbpk_predicted: number[];
  ml_predicted: number[];
  hybrid_predicted: number[];
  metrics: {
    pbpk: HybridModelMetrics;
    ml: HybridModelMetrics;
    hybrid: HybridModelMetrics;
  };
  scientific_verdict: string;
  is_demo?: boolean;
}

// ==============================================================================
// 9. OPTIMIZATION
// ==============================================================================
export interface CandidateScenario {
  candidate_id: string;
  dose_mg: number;
  polymer_percent: number;
  particle_size_um: number;
  predicted_cmax: number;
  predicted_auc: number;
  predicted_tmax: number;
  loss: number;
  is_pareto_optimal?: boolean;
}

export interface OptimizationResult {
  target_cmax: number;
  target_auc: number;
  optimal_dose_mg: number;
  optimal_polymer_percent: number;
  optimal_particle_size_um: number;
  predicted_cmax: number;
  predicted_auc: number;
  predicted_tmax: number;
  loss_score: number;
  candidate_scenarios: CandidateScenario[];
  convergence_status: "CONVERGED" | "LOCAL_MINIMUM";
  provenance: string;
  is_demo?: boolean;
}

// ==============================================================================
// 10. EXPLAINABLE AI (XAI)
// ==============================================================================
export interface FeatureAttribution {
  feature_name: string;
  feature_value: number;
  attribution_phi: number; // SHAP-style local marginal impact
  impact: "positive" | "negative";
  rationale: string;
}

export interface XAIResult {
  predicted_value: number;
  baseline_expected_value: number;
  target_unit: string;
  target_metric: string;
  attributions: FeatureAttribution[];
  additive_check_sum: number;
  plain_language_explanation: string;
  is_demo?: boolean;
}

// ==============================================================================
// 11. VALIDATION & SENSITIVITY
// ==============================================================================
export interface SensitivitySweepPoint {
  perturbation_percent: number;
  parameter_value: number;
  resulting_cmax: number;
  resulting_auc: number;
}

export interface ParameterSensitivity {
  parameter: string;
  baseline: number;
  unit: string;
  elasticity_auc: number;
  elasticity_cmax: number;
  sweep: SensitivitySweepPoint[];
}

export interface ValidationReport {
  evaluated_models: string[];
  test_sample_size: number;
  metrics_table: Array<{
    model: string;
    mae: number;
    rmse: number;
    r2: number;
    mape: number;
  }>;
  residuals: Array<{
    predicted: number;
    residual: number;
  }>;
  error_histogram: Array<{
    bin: string;
    count: number;
  }>;
  sensitivities: ParameterSensitivity[];
  validation_status: "VALIDATED" | "CONDITIONAL" | "REJECTED";
  is_demo?: boolean;
}

// ==============================================================================
// 12. RESEARCH RESULTS & REPORTS
// ==============================================================================
export interface ResearchSummary {
  drug: Drug;
  formulation: Formulation;
  dissolution: DissolutionCurveResult;
  absorption: AbsorptionResult;
  pk: ClassicalPKResult;
  pbpk: PBPKResult;
  virtual_population: VirtualPopulationResult;
  ml: MLResult;
  hybrid: HybridResult;
  optimization: OptimizationResult;
  validation: ValidationReport;
  admin_notes: string;
  updated_at: string;
}

export interface ReportSection {
  num: number;
  heading: string;
  content: string;
}

export interface ResearchReport {
  id: string;
  title: string;
  author: string;
  drug_name: string;
  date: string;
  disclaimer: string;
  sections: ReportSection[];
  metrics_summary: Record<string, any>;
  is_demo?: boolean;
}

// ==============================================================================
// 13. PRIVATE ADMIN PROFILE
// ==============================================================================
export interface AdminProfile {
  id: string;
  admin_email: string;
  full_name: string;
  date_of_birth: string;
  gender: "Male" | "Female" | "Other" | "Prefer not to say";
  blood_group: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  weight_kg: number;
  height_cm: number;
  contact_number: string;
  email_address: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_number: string;
  emergency_contact_relationship: string;
  profile_photo_url?: string;
  additional_notes?: string;
  updated_at?: string;
}

