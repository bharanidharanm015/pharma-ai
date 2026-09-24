-- ==============================================================================
-- PHARMA AI — PostgreSQL Database Schema with Row Level Security (RLS)
-- Professional Pharmaceutical AI Research Platform
-- Strict User Ownership & Data Isolation using auth.uid()
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. DRUGS TABLE (Pharmaceutical Reference & Research Compounds)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS drugs (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    dose_mg REAL NOT NULL DEFAULT 400.0,
    molecular_weight REAL NOT NULL,
    solubility_mg_ml REAL NOT NULL,
    permeability_peff REAL NOT NULL DEFAULT 1.0e-4,
    half_life_h REAL NOT NULL,
    clearance_l_h REAL NOT NULL,
    vd_l REAL NOT NULL,
    bioavailability_f REAL NOT NULL DEFAULT 1.0,
    pka REAL,
    logp REAL NOT NULL,
    bcs_class TEXT,
    route TEXT DEFAULT 'Oral',
    provenance TEXT DEFAULT 'RESEARCH COMPOUND',
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. FORMULATIONS TABLE (Polymer Matrices & QbD Specifications)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS formulations (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    drug_id TEXT REFERENCES drugs(id) ON DELETE SET NULL,
    drug_name TEXT NOT NULL,
    dosage_form TEXT NOT NULL DEFAULT 'Matrix Tablet',
    type TEXT NOT NULL DEFAULT 'Extended Release',
    api_amount_mg REAL NOT NULL DEFAULT 400.0,
    polymer_concentration REAL NOT NULL DEFAULT 25.0,
    particle_size_d50_um REAL NOT NULL DEFAULT 45.0,
    release_characteristics TEXT NOT NULL DEFAULT 'Diffusion and Erosion (Korsmeyer-Peppas)',
    components_json JSONB DEFAULT '[]'::jsonb,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. SIMULATIONS TABLE (Simulation Runs & Execution Logs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS simulations (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    title TEXT NOT NULL,
    module TEXT NOT NULL, -- 'dissolution', 'absorption', 'pk', 'pbpk', 'virtual_population', 'ml', 'hybrid', 'optimization', 'validation'
    drug_name TEXT NOT NULL,
    model_type TEXT NOT NULL,
    parameters_json JSONB NOT NULL,
    results_summary_json JSONB NOT NULL,
    notes TEXT,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. DISSOLUTION RESULTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS dissolution_results (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    simulation_id TEXT REFERENCES simulations(id) ON DELETE CASCADE,
    time_points JSONB NOT NULL,
    dissolved_percent JSONB NOT NULL,
    model_name TEXT NOT NULL,
    k_rate REAL NOT NULL,
    n_exponent REAL,
    r2_fit REAL,
    f1_difference REAL,
    f2_similarity REAL,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. PK RESULTS TABLE (Classical PK & 5-Organ PBPK)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS pk_results (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    simulation_id TEXT REFERENCES simulations(id) ON DELETE CASCADE,
    model_type TEXT NOT NULL, -- '1-compartment', '2-compartment', '5-organ-pbpk'
    cmax REAL NOT NULL,
    tmax REAL NOT NULL,
    auc_0_t REAL NOT NULL,
    auc_0_inf REAL,
    clearance REAL NOT NULL,
    half_life REAL NOT NULL,
    time_series JSONB NOT NULL,
    concentrations JSONB NOT NULL,
    mass_balance_error_percent REAL DEFAULT 0.0,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. VIRTUAL POPULATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS virtual_populations (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    simulation_id TEXT REFERENCES simulations(id) ON DELETE CASCADE,
    drug_name TEXT NOT NULL,
    cohort_size INT NOT NULL,
    percentiles_json JSONB NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. VIRTUAL PATIENTS TABLE (Monte Carlo Cohort Members)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS virtual_patients (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    population_id TEXT REFERENCES virtual_populations(id) ON DELETE CASCADE,
    subject_index INT NOT NULL,
    body_weight_kg REAL NOT NULL,
    cmax REAL NOT NULL,
    auc REAL NOT NULL,
    tmax REAL NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. ML EXPERIMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ml_experiments (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    simulation_id TEXT REFERENCES simulations(id) ON DELETE CASCADE,
    model_type TEXT NOT NULL,
    target_metric TEXT NOT NULL,
    train_size INT NOT NULL,
    test_size INT NOT NULL,
    mae REAL NOT NULL,
    rmse REAL NOT NULL,
    r2 REAL NOT NULL,
    feature_importance JSONB NOT NULL,
    test_predictions JSONB NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. HYBRID EXPERIMENTS TABLE (PBPK + ML Benchmarks)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS hybrid_experiments (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    simulation_id TEXT REFERENCES simulations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    drug_name TEXT NOT NULL,
    pbpk_r2 REAL NOT NULL,
    pbpk_rmse REAL NOT NULL,
    pbpk_mae REAL NOT NULL,
    ml_r2 REAL NOT NULL,
    ml_rmse REAL NOT NULL,
    ml_mae REAL NOT NULL,
    hybrid_r2 REAL NOT NULL,
    hybrid_rmse REAL NOT NULL,
    hybrid_mae REAL NOT NULL,
    time_points JSONB NOT NULL,
    observed_curve JSONB NOT NULL,
    pbpk_curve JSONB NOT NULL,
    ml_curve JSONB NOT NULL,
    hybrid_curve JSONB NOT NULL,
    scientific_conclusion TEXT NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 10. OPTIMIZATION RUNS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS optimization_runs (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    drug_name TEXT NOT NULL,
    target_cmax REAL NOT NULL,
    target_auc REAL NOT NULL,
    constraints_json JSONB NOT NULL,
    candidate_scenarios JSONB NOT NULL,
    optimal_dose_mg REAL NOT NULL,
    optimal_polymer_percent REAL NOT NULL,
    optimal_particle_size_um REAL NOT NULL,
    predicted_cmax REAL NOT NULL,
    predicted_auc REAL NOT NULL,
    predicted_tmax REAL NOT NULL,
    loss_score REAL NOT NULL,
    convergence_status TEXT NOT NULL DEFAULT 'CONVERGED',
    provenance TEXT DEFAULT 'RESEARCH SIMULATION — NOT CLINICALLY VALIDATED',
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 11. VALIDATION RESULTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS validation_results (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    model_evaluated TEXT NOT NULL,
    dataset_name TEXT NOT NULL,
    mae REAL NOT NULL,
    rmse REAL NOT NULL,
    r2 REAL NOT NULL,
    mape REAL NOT NULL,
    residuals JSONB NOT NULL,
    error_distribution JSONB NOT NULL,
    sensitivity_results JSONB NOT NULL,
    validation_status TEXT NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 12. RESEARCH REPORTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS research_reports (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    title TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'Pharmacometrics Researcher',
    drug_name TEXT NOT NULL,
    report_date DATE DEFAULT CURRENT_DATE,
    disclaimer TEXT DEFAULT 'SIMULATED DATA — Computational Research Simulation — Not Clinically Validated',
    sections_json JSONB NOT NULL,
    report_metadata JSONB DEFAULT '{}'::jsonb,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 13. SAVED EXPERIMENTS TABLE (Save & Reopen Workflows)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS saved_experiments (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    experiment_id TEXT NOT NULL,
    title TEXT NOT NULL,
    drug_name TEXT NOT NULL,
    formulation_name TEXT NOT NULL,
    model TEXT NOT NULL,
    parameters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    results_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    validation_status TEXT NOT NULL DEFAULT 'Validated', -- 'Validated', 'Conditional', 'Pending', 'Exploratory'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict User Ownership & Data Isolation using auth.uid()
-- ==============================================================================

-- Enable RLS on all research tables
ALTER TABLE drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dissolution_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE pk_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_populations ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hybrid_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_experiments ENABLE ROW LEVEL SECURITY;

-- 1. Drugs: users can read global benchmark drugs (user_id IS NULL) or their own private drugs; users can only insert/modify their own
CREATE POLICY "Users can view reference drugs and own drugs" ON drugs FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own drugs" ON drugs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drugs" ON drugs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own drugs" ON drugs FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Formulations: user-private
CREATE POLICY "Users can manage own formulations" ON formulations FOR ALL
    USING (user_id IS NULL OR auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Simulations: user-private
CREATE POLICY "Users can manage own simulations" ON simulations FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Dissolution Results: user-private
CREATE POLICY "Users can manage own dissolution_results" ON dissolution_results FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. PK Results: user-private
CREATE POLICY "Users can manage own pk_results" ON pk_results FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. Virtual Populations: user-private
CREATE POLICY "Users can manage own virtual_populations" ON virtual_populations FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 7. Virtual Patients: user-private
CREATE POLICY "Users can manage own virtual_patients" ON virtual_patients FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 8. ML Experiments: user-private
CREATE POLICY "Users can manage own ml_experiments" ON ml_experiments FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 9. Hybrid Experiments: user-private
CREATE POLICY "Users can manage own hybrid_experiments" ON hybrid_experiments FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 10. Optimization Runs: user-private
CREATE POLICY "Users can manage own optimization_runs" ON optimization_runs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 11. Validation Results: user-private
CREATE POLICY "Users can manage own validation_results" ON validation_results FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 12. Research Reports: user-private
CREATE POLICY "Users can manage own research_reports" ON research_reports FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 13. Saved Experiments: user-private
CREATE POLICY "Users can manage own saved_experiments" ON saved_experiments FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Indexes for rapid lookups and join performance
CREATE INDEX IF NOT EXISTS idx_drugs_user ON drugs(user_id);
CREATE INDEX IF NOT EXISTS idx_formulations_user ON formulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_user ON simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_module ON simulations(module);
CREATE INDEX IF NOT EXISTS idx_pk_results_user ON pk_results(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_populations_user ON virtual_populations(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_experiments_user ON ml_experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_experiments_user ON saved_experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_research_reports_user ON research_reports(user_id);
