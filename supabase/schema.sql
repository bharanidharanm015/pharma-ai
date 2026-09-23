-- ==============================================================================
-- PHARMA AI — PostgreSQL Database Schema with Row Level Security (RLS)
-- Single-Admin Private Pharmaceutical Research & Drug-Delivery Simulation Platform
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. DRUGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS drugs (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
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
    provenance TEXT DEFAULT 'RESEARCH SCENARIO',
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. FORMULATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS formulations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    drug_id TEXT REFERENCES drugs(id) ON DELETE CASCADE,
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
-- 3. SIMULATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS simulations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    module TEXT NOT NULL, -- 'dissolution', 'absorption', 'pk', 'pbpk', 'virtual_population', 'ml', 'hybrid', 'optimization', 'validation'
    drug_name TEXT NOT NULL,
    formulation_name TEXT,
    parameters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    summary_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. DISSOLUTION RESULTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS dissolution_results (
    id TEXT PRIMARY KEY,
    simulation_id TEXT REFERENCES simulations(id) ON DELETE CASCADE,
    drug_name TEXT NOT NULL,
    model_name TEXT NOT NULL, -- 'Noyes-Whitney', 'Korsmeyer-Peppas', 'Higuchi', 'First-Order', 'Zero-Order'
    duration_h REAL NOT NULL,
    time_step_h REAL NOT NULL,
    time_points JSONB NOT NULL, -- Array of numbers
    percent_dissolved JSONB NOT NULL, -- Array of numbers
    rate_constant_k REAL,
    release_exponent_n REAL,
    r_squared REAL,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. PK RESULTS TABLE (1C, 2C & PBPK 5-Organ)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS pk_results (
    id TEXT PRIMARY KEY,
    simulation_id TEXT REFERENCES simulations(id) ON DELETE CASCADE,
    drug_name TEXT NOT NULL,
    model_type TEXT NOT NULL, -- '1-Compartment Oral', '2-Compartment Oral', '5-Organ PBPK'
    dose_mg REAL NOT NULL,
    c_max REAL NOT NULL,
    t_max REAL NOT NULL,
    auc_0_last REAL NOT NULL,
    auc_0_inf REAL NOT NULL,
    half_life_h REAL NOT NULL,
    clearance_l_h REAL NOT NULL,
    volume_of_distribution_l REAL NOT NULL,
    mass_balance_error_percent REAL DEFAULT 0.0,
    time_points JSONB NOT NULL,
    concentration_curve JSONB NOT NULL,
    organ_curves JSONB DEFAULT '{}'::jsonb, -- For PBPK (plasma, liver, kidney, tissue, gut)
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. VIRTUAL POPULATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS virtual_populations (
    id TEXT PRIMARY KEY,
    simulation_id TEXT REFERENCES simulations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    cohort_size INT NOT NULL DEFAULT 50,
    random_seed INT NOT NULL DEFAULT 42,
    weight_mean_kg REAL NOT NULL DEFAULT 70.0,
    weight_cv_percent REAL NOT NULL DEFAULT 15.0,
    clearance_cv_percent REAL NOT NULL DEFAULT 25.0,
    volume_cv_percent REAL NOT NULL DEFAULT 20.0,
    cmax_mean REAL NOT NULL,
    cmax_cv_percent REAL NOT NULL,
    auc_mean REAL NOT NULL,
    auc_cv_percent REAL NOT NULL,
    time_points JSONB NOT NULL,
    percentile_5 JSONB NOT NULL,
    percentile_25 JSONB NOT NULL,
    percentile_50 JSONB NOT NULL,
    percentile_75 JSONB NOT NULL,
    percentile_95 JSONB NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. VIRTUAL PATIENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS virtual_patients (
    id TEXT PRIMARY KEY,
    population_id TEXT REFERENCES virtual_populations(id) ON DELETE CASCADE,
    patient_code TEXT NOT NULL,
    age_years REAL NOT NULL,
    sex TEXT NOT NULL,
    weight_kg REAL NOT NULL,
    height_cm REAL NOT NULL,
    bmi REAL NOT NULL,
    clearance_l_h REAL NOT NULL,
    volume_l REAL NOT NULL,
    c_max REAL NOT NULL,
    auc REAL NOT NULL,
    profile_json JSONB,
    provenance_tag TEXT DEFAULT 'SIMULATED VIRTUAL POPULATION — NOT REAL PATIENT DATA',
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. ML EXPERIMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ml_experiments (
    id TEXT PRIMARY KEY,
    simulation_id TEXT REFERENCES simulations(id) ON DELETE CASCADE,
    model_type TEXT NOT NULL, -- 'Linear Regression', 'Random Forest', 'Gradient Boosting'
    target_metric TEXT NOT NULL, -- 'Cmax', 'AUC', 'Tmax'
    train_size INT NOT NULL,
    test_size INT NOT NULL,
    mae REAL NOT NULL,
    rmse REAL NOT NULL,
    r2 REAL NOT NULL,
    feature_importance JSONB NOT NULL, -- Array of {feature: string, importance: number}
    test_predictions JSONB NOT NULL, -- Array of {actual: number, predicted: number, residual: number}
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. HYBRID EXPERIMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS hybrid_experiments (
    id TEXT PRIMARY KEY,
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
    drug_name TEXT NOT NULL,
    target_cmax REAL NOT NULL,
    target_auc REAL NOT NULL,
    constraints_json JSONB NOT NULL,
    candidate_scenarios JSONB NOT NULL, -- Array of evaluated candidate scenarios
    optimal_dose_mg REAL NOT NULL,
    optimal_polymer_percent REAL NOT NULL,
    optimal_particle_size_um REAL NOT NULL,
    predicted_cmax REAL NOT NULL,
    predicted_auc REAL NOT NULL,
    predicted_tmax REAL NOT NULL,
    loss_score REAL NOT NULL,
    convergence_status TEXT NOT NULL DEFAULT 'CONVERGED',
    provenance TEXT DEFAULT 'COMPUTATIONAL RESEARCH — NOT CLINICAL DOSING ADVICE',
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 11. VALIDATION RESULTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS validation_results (
    id TEXT PRIMARY KEY,
    model_evaluated TEXT NOT NULL,
    dataset_name TEXT NOT NULL,
    mae REAL NOT NULL,
    rmse REAL NOT NULL,
    r2 REAL NOT NULL,
    mape REAL NOT NULL,
    residuals JSONB NOT NULL,
    error_distribution JSONB NOT NULL,
    sensitivity_results JSONB NOT NULL, -- OAT parameter elasticity
    validation_status TEXT NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 12. RESEARCH REPORTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS research_reports (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    drug_name TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'Admin (Pharma AI Private Research Environment)',
    date TEXT NOT NULL,
    provenance_disclaimer TEXT NOT NULL DEFAULT 'RESEARCH SIMULATION — NOT CLINICALLY VALIDATED',
    sections_json JSONB NOT NULL,
    report_metadata JSONB DEFAULT '{}'::jsonb,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 13. PRIVATE ADMIN PROFILE TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS admin_profile (
    id TEXT PRIMARY KEY DEFAULT 'admin_primary_profile',
    admin_email TEXT UNIQUE NOT NULL DEFAULT 'admin@pharma.ai',
    full_name TEXT NOT NULL DEFAULT 'Lead Pharmacometrics Administrator',
    date_of_birth DATE NOT NULL DEFAULT '1984-06-15',
    gender TEXT NOT NULL DEFAULT 'Prefer not to say',
    blood_group TEXT NOT NULL DEFAULT 'O+',
    weight_kg REAL NOT NULL DEFAULT 70.0,
    height_cm REAL NOT NULL DEFAULT 175.0,
    contact_number TEXT NOT NULL DEFAULT '+1 (555) 019-2834',
    email_address TEXT NOT NULL DEFAULT 'admin@pharma.ai',
    address TEXT NOT NULL DEFAULT 'Department of Pharmacometrics & Biopharmaceutics, Bio-Innovation Quarter, Suite 400',
    emergency_contact_name TEXT NOT NULL DEFAULT 'Dr. Marcus Vance',
    emergency_contact_number TEXT NOT NULL DEFAULT '+1 (555) 019-2835',
    emergency_contact_relationship TEXT NOT NULL DEFAULT 'Colleague / Laboratory Deputy',
    profile_photo_url TEXT,
    additional_notes TEXT DEFAULT 'Principal Investigator with primary clearance for digital twin pharmacokinetic models.',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Single-Admin Private Environment
-- ==============================================================================

-- Enable RLS on all tables including admin_profile
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
ALTER TABLE admin_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on admin_profile" ON admin_profile FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Helper condition: only authenticated users can access
-- In single-admin mode, only the authenticated Admin session is granted access.
CREATE POLICY "Admin full access on drugs" ON drugs FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin full access on formulations" ON formulations FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin full access on simulations" ON simulations FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin full access on dissolution_results" ON dissolution_results FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin full access on pk_results" ON pk_results FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin full access on virtual_populations" ON virtual_populations FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin full access on virtual_patients" ON virtual_patients FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin full access on ml_experiments" ON ml_experiments FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin full access on hybrid_experiments" ON hybrid_experiments FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin full access on optimization_runs" ON optimization_runs FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin full access on validation_results" ON validation_results FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin full access on research_reports" ON research_reports FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Indexes for rapid lookups and join performance
CREATE INDEX IF NOT EXISTS idx_drugs_name ON drugs(name);
CREATE INDEX IF NOT EXISTS idx_formulations_drug ON formulations(drug_id);
CREATE INDEX IF NOT EXISTS idx_simulations_module ON simulations(module);
CREATE INDEX IF NOT EXISTS idx_simulations_drug ON simulations(drug_name);
CREATE INDEX IF NOT EXISTS idx_pk_results_sim ON pk_results(simulation_id);
CREATE INDEX IF NOT EXISTS idx_virtual_patients_pop ON virtual_patients(population_id);
CREATE INDEX IF NOT EXISTS idx_ml_experiments_sim ON ml_experiments(simulation_id);
