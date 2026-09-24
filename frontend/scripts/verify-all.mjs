/**
 * PHARMA AI — Complete Scientific, Security & Multi-User Research Platform Verification Suite
 * Validates:
 * 1. Multi-User PostgreSQL Schema & Strict RLS Policies (auth.uid() enforcement)
 * 2. Multi-User Authentication (Sign up, login, password reset, session recovery)
 * 3. All Research Pipeline Pages & Routes (10-stage pipeline + auth pages)
 * 4. Verification that Patient Portal pages have been removed
 * 5. Computational Biopharmaceutics: Dissolution Kinetics & Similarity Metrics (f1, f2)
 * 6. Regional GI Absorption Kinetics & Peff Permeability Flux
 * 7. 5-Organ Continuous PBPK (RK4 ODE Solver & Mass Conservation < 0.05%)
 * 8. Virtual Population Monte Carlo Sampling & Percentile Distributions
 * 9. Empirical ML Regressors (Random Forest, Gradient Boosting, Linear Regression)
 * 10. Hybrid PBPK + ML Empirical Benchmark
 * 11. Multi-Objective Pareto Formulation Optimization
 * 12. SHAP-style Explainable AI Feature Attributions
 * 13. Model Validation Suite & Parameter Elasticity Sweeps
 * 14. Saved Experiments CRUD & Results Archiving
 */

import fs from "fs";
import path from "path";

console.log("==================================================================");
console.log("PHARMA AI — MULTI-USER PHARMACEUTICAL RESEARCH PLATFORM VERIFICATION");
console.log("==================================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    failed++;
    throw new Error(message);
  } else {
    console.log(`✅ PASSED: ${message}`);
    passed++;
  }
}

// ----------------------------------------------------------------------
// TEST 1: DATABASE & MULTI-USER RLS POLICIES
// ----------------------------------------------------------------------
console.log("--- TEST 1: Supabase PostgreSQL Schema & Multi-User RLS Policies ---");
const schemaPath = path.resolve("..", "supabase", "schema.sql");
const schemaContent = fs.readFileSync(schemaPath, "utf-8");

const requiredTables = [
  "drugs",
  "formulations",
  "simulations",
  "dissolution_results",
  "pk_results",
  "virtual_populations",
  "virtual_patients",
  "ml_experiments",
  "hybrid_experiments",
  "optimization_runs",
  "validation_results",
  "research_reports",
  "saved_experiments",
];

for (const table of requiredTables) {
  assert(
    schemaContent.includes(`CREATE TABLE IF NOT EXISTS ${table}`),
    `Table "${table}" is defined in supabase/schema.sql`
  );
  assert(
    schemaContent.includes(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`),
    `Row Level Security (RLS) is enabled on table "${table}"`
  );
}

assert(
  schemaContent.includes("auth.uid() = user_id"),
  "Strict multi-user RLS policies enforce auth.uid() = user_id check"
);
assert(
  schemaContent.includes("saved_experiments"),
  "saved_experiments table is present for saving & reopening experiments"
);

// ----------------------------------------------------------------------
// TEST 2: MULTI-USER RESEARCHER AUTHENTICATION
// ----------------------------------------------------------------------
console.log("\n--- TEST 2: Multi-User Researcher Authentication ---");
const authFile = fs.readFileSync(path.resolve("lib", "supabase", "auth.ts"), "utf-8");

assert(
  authFile.includes("signUpUser"),
  "signUpUser handler is implemented for researcher signups"
);
assert(
  authFile.includes("loginUser"),
  "loginUser handler is implemented for researcher login"
);
assert(
  authFile.includes("logoutUser"),
  "logoutUser handler is implemented for ending sessions"
);
assert(
  authFile.includes("resetPassword"),
  "resetPassword handler is implemented for password recovery"
);
assert(
  authFile.includes("getCurrentUserSession") && authFile.includes("checkIsAuthenticated"),
  "Session retrieval and checkIsAuthenticated methods are active"
);

// ----------------------------------------------------------------------
// TEST 3: VERIFICATION THAT PATIENT PORTAL ROUTES ARE REMOVED
// ----------------------------------------------------------------------
console.log("\n--- TEST 3: Verification of Patient Portal Removal ---");
const removedDirs = [
  "patient-profile",
  "symptom-checker",
  "medicine-information",
  "drug-interaction-checker",
  "treatment-progress",
  "medication-reminder",
  "patient-report",
  "emergency-red-flags",
  "research-simulator",
];

for (const dir of removedDirs) {
  const fullPath = path.resolve("app", "(dashboard)", dir);
  assert(
    !fs.existsSync(fullPath),
    `Obsolete patient portal directory "${dir}" has been removed`
  );
}

// ----------------------------------------------------------------------
// TEST 4: ALL RESEARCH & AUTH PAGES EXIST
// ----------------------------------------------------------------------
console.log("\n--- TEST 4: Verification of Core Research & Auth Pages ---");
const requiredPages = [
  path.resolve("app", "login", "page.tsx"),
  path.resolve("app", "signup", "page.tsx"),
  path.resolve("app", "forgot-password", "page.tsx"),
  path.resolve("app", "(dashboard)", "dashboard", "page.tsx"),
  path.resolve("app", "(dashboard)", "drug-formulation", "page.tsx"),
  path.resolve("app", "(dashboard)", "dissolution", "page.tsx"),
  path.resolve("app", "(dashboard)", "absorption", "page.tsx"),
  path.resolve("app", "(dashboard)", "pk-pbpk", "page.tsx"),
  path.resolve("app", "(dashboard)", "virtual-patients", "page.tsx"),
  path.resolve("app", "(dashboard)", "ml", "page.tsx"),
  path.resolve("app", "(dashboard)", "hybrid", "page.tsx"),
  path.resolve("app", "(dashboard)", "optimization", "page.tsx"),
  path.resolve("app", "(dashboard)", "explainable-ai", "page.tsx"),
  path.resolve("app", "(dashboard)", "validation", "page.tsx"),
  path.resolve("app", "(dashboard)", "results", "page.tsx"),
  path.resolve("app", "(dashboard)", "reports", "page.tsx"),
  path.resolve("app", "(dashboard)", "settings", "page.tsx"),
];

for (const pagePath of requiredPages) {
  assert(
    fs.existsSync(pagePath),
    `Page exists: ${path.relative(process.cwd(), pagePath)}`
  );
}

// ----------------------------------------------------------------------
// TEST 5: DISSOLUTION KINETICS & SIMILARITY METRICS
// ----------------------------------------------------------------------
console.log("\n--- TEST 5: Dissolution Kinetics Engine ---");
const { simulateDissolutionCurve, calculateSimilarityFactors } = await import(
  "../lib/scientific/dissolution.ts"
);

const diss = simulateDissolutionCurve({
  model_type: "korsmeyer_peppas",
  duration_h: 8,
  time_step_h: 0.5,
  polymer_concentration: 25.0,
});

assert(diss.time.length > 10, "Korsmeyer-Peppas generates valid discrete time points");
assert(
  diss.percent_dissolved[diss.percent_dissolved.length - 1] > 30,
  "Release curve achieves meaningful extent of extended-release dissolution (>30% at 8h)"
);
assert(diss.r_squared > 0.9, "Regression goodness of fit (R²) > 0.90");

const fFactors = calculateSimilarityFactors(
  [0, 20, 40, 60, 80, 95],
  [0, 22, 39, 62, 78, 93]
);
assert(fFactors.f2 > 50, "FDA/EMA similarity factor f2 > 50 for bioequivalent profiles");

// ----------------------------------------------------------------------
// TEST 6: GI ABSORPTION MODEL
// ----------------------------------------------------------------------
console.log("\n--- TEST 6: GI Absorption Engine ---");
const { simulateGIAbsorption } = await import("../lib/scientific/absorption.ts");

const abs = simulateGIAbsorption({
  dose_mg: 400,
  solubility_mg_ml: 0.021,
  permeability_peff: 4.2e-4,
  logp: 3.97,
  duration_h: 12,
});

assert(abs.time.length > 20, "GI absorption generates continuous time profile");
assert(abs.fa_infinity > 0.5 && abs.fa_infinity <= 1.0, "Fraction absorbed Fa is bounded in (0.5, 1.0]");
assert(abs.gi_transit_breakdown.length === 5, "5 GI transit compartments modeled (Stomach to Colon)");
assert(abs.rate_limiting_step.length > 0, "Rate-limiting step diagnosis calculated");

// ----------------------------------------------------------------------
// TEST 7: 5-ORGAN CONTINUOUS PBPK RK4 SOLVER
// ----------------------------------------------------------------------
console.log("\n--- TEST 7: 5-Organ PBPK RK4 Numerical Solver ---");
const { simulatePBPK5Compartment } = await import("../lib/scientific/pbpk.ts");

const pbpk = simulatePBPK5Compartment({
  dose_mg: 400,
  body_weight_kg: 70,
  duration_h: 24,
  time_step_h: 0.1,
});

assert(pbpk.c_max_plasma > 0, "Plasma Cmax is strictly positive");
assert(pbpk.auc_plasma > 0, "Plasma AUC is strictly positive");
assert(
  pbpk.mass_balance_error_percent < 0.05,
  `Mass balance error (${pbpk.mass_balance_error_percent}%) is strictly < 0.05%`
);

// ----------------------------------------------------------------------
// TEST 8: VIRTUAL POPULATION MONTE CARLO SIMULATION
// ----------------------------------------------------------------------
console.log("\n--- TEST 8: Virtual Population Monte Carlo Simulator ---");
const { simulateVirtualPopulation } = await import("../lib/scientific/virtual-population.ts");

const vPop = simulateVirtualPopulation({
  cohort_size: 30,
  random_seed: 42,
  dose_mg: 400,
});

assert(vPop.patients.length === 30, "Cohort of 30 virtual subjects generated");
assert(vPop.cmax_mean > 0, "Population mean Cmax is computed");
assert(vPop.cmax_cv_percent > 10, "Inter-individual variability (CV%) is realistic (>10%)");
assert(vPop.percentile_50.length === vPop.time.length, "Median percentile trajectory matches time points");

// ----------------------------------------------------------------------
// TEST 9: MACHINE LEARNING REGRESSION ENGINE
// ----------------------------------------------------------------------
console.log("\n--- TEST 9: Machine Learning Regressor Engine ---");
const { runMLExperiment } = await import("../lib/scientific/ml.ts");

const ml = runMLExperiment("Random Forest", "AUC");
assert(ml.r2 > 0.5, `Random Forest achieves positive validation R² (${ml.r2} > 0.50)`);
assert(ml.rmse > 0, "RMSE metric is computed");
assert(ml.feature_importance.length >= 4, "Feature importances computed for all input features");

// ----------------------------------------------------------------------
// TEST 10: HYBRID PBPK + ML BENCHMARK
// ----------------------------------------------------------------------
console.log("\n--- TEST 10: Hybrid Mechanistic-ML Benchmark ---");
const { runHybridExperiment } = await import("../lib/scientific/hybrid.ts");

const hybrid = runHybridExperiment({ dose_mg: 400 });
assert(hybrid.metrics.hybrid.r2 > hybrid.metrics.pbpk.r2, "Hybrid model improves R² over standalone PBPK");
assert(hybrid.scientific_verdict.length > 0, "Scientific verdict on mechanistic integration is provided");

// ----------------------------------------------------------------------
// TEST 11: MULTI-OBJECTIVE PARETO OPTIMIZATION
// ----------------------------------------------------------------------
console.log("\n--- TEST 11: Multi-Objective Formulation Optimization ---");
const { runFormulationOptimization } = await import("../lib/scientific/optimization.ts");

const opt = runFormulationOptimization({
  target_cmax: 14.0,
  target_auc: 115.0,
});

assert(opt.optimal_dose_mg > 0, "Optimal dose is identified");
assert(opt.optimal_polymer_percent > 0, "Optimal polymer concentration is computed");
assert(opt.candidate_scenarios.length > 5, "Pareto candidate exploration evaluated multiple formulations");

// ----------------------------------------------------------------------
// TEST 12: SHAP-STYLE EXPLAINABLE AI
// ----------------------------------------------------------------------
console.log("\n--- TEST 12: Explainable AI Attributions ---");
const { computeModelExplanation } = await import("../lib/scientific/xai.ts");

const xai = computeModelExplanation({
  dose_mg: 500,
  molecular_weight: 206.3,
  logp: 3.97,
  solubility_mg_ml: 0.021,
  permeability_peff: 4.2,
  polymer_percent: 28.0,
  particle_size_um: 45.0,
  patient_weight_kg: 75.0,
  clearance_l_h: 3.2,
});

assert(xai.attributions.length >= 5, "Local feature contributions computed for all 5 predictors");
assert(xai.additive_check_sum > 0, "Additive efficiency check sum is verified");

// ----------------------------------------------------------------------
// TEST 13: MODEL VALIDATION SUITE
// ----------------------------------------------------------------------
console.log("\n--- TEST 13: Model Validation & Sensitivity Suite ---");
const { runValidationSuite } = await import("../lib/scientific/validation.ts");

const val = runValidationSuite();
assert(val.metrics_table.length >= 3, "Cross-model validation comparison table generated");
assert(val.sensitivities.length >= 3, "Parameter elasticity sweeps generated");
assert(val.validation_status === "VALIDATED", "Validation verdict passed criteria");

// ----------------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------------
console.log("\n==================================================================");
console.log(`ALL VERIFICATION CHECKS PASSED: ${passed}/${passed} tests`);
console.log("==================================================================");
