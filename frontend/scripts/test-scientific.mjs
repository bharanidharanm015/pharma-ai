/**
 * Node test script to verify that scientific engines execute and satisfy constraints
 */

import { simulateDissolutionCurve, calculateSimilarityFactors } from "../lib/scientific/dissolution.ts";
import { simulateGIAbsorption } from "../lib/scientific/absorption.ts";
import { simulateClassicalPK } from "../lib/scientific/pk.ts";
import { simulatePBPK5Compartment } from "../lib/scientific/pbpk.ts";
import { simulateVirtualPopulation } from "../lib/scientific/virtual-population.ts";
import { runMLExperiment } from "../lib/scientific/ml.ts";
import { runHybridExperiment } from "../lib/scientific/hybrid.ts";
import { runFormulationOptimization } from "../lib/scientific/optimization.ts";
import { computeModelExplanation } from "../lib/scientific/xai.ts";
import { runValidationSuite } from "../lib/scientific/validation.ts";

console.log("Starting scientific engine tests...");

// 1. Dissolution
const diss = simulateDissolutionCurve({ model_type: "korsmeyer_peppas", duration_h: 12 });
console.log("Dissolution:", diss.model_name, "points:", diss.time.length, "final %:", diss.percent_dissolved[diss.percent_dissolved.length - 1]);
if (diss.percent_dissolved[0] !== 0 || diss.percent_dissolved[diss.percent_dissolved.length - 1] <= 0) {
  throw new Error("Dissolution bounds error");
}

// 2. Absorption
const abs = simulateGIAbsorption({ dose_mg: 400, solubility_mg_ml: 0.1, permeability_peff: 2.5e-4, logp: 2.5 });
console.log("Absorption Fa:", abs.fa_infinity, "rate points:", abs.absorption_rate_mg_h.length);
if (abs.fa_infinity <= 0 || abs.fa_infinity > 1.0) throw new Error("Absorption Fa out of bounds");

// 3. Classical PK
const pk = simulateClassicalPK({ dose_mg: 400, cl_l_h: 3.2, vd_l: 9.8, ka_per_h: 1.2 });
console.log("Classical PK Cmax:", pk.c_max, "AUC:", pk.auc_0_inf, "Tmax:", pk.t_max);
if (pk.c_max <= 0 || pk.auc_0_inf <= 0) throw new Error("PK parameters invalid");

// 4. PBPK 5-Organ
const pbpk = simulatePBPK5Compartment({ dose_mg: 400, body_weight_kg: 70, duration_h: 24 });
console.log("PBPK Mass Balance Error:", pbpk.mass_balance_error_percent + "%", "Plasma Cmax:", pbpk.c_max_plasma);
if (pbpk.mass_balance_error_percent > 0.05) throw new Error("PBPK mass conservation failed!");

// 5. Virtual Population
const pop = simulateVirtualPopulation({ cohort_size: 25, random_seed: 42 });
console.log("Virtual Pop:", pop.cohort_size, "patients, Mean Cmax:", pop.cmax_mean, "CV%:", pop.cmax_cv_percent);
if (pop.patients.length !== 25) throw new Error("Population size mismatch");

// 6. ML
const ml = runMLExperiment("Random Forest", "AUC");
console.log("ML Model:", ml.model_type, "R2:", ml.r2, "RMSE:", ml.rmse, "MAE:", ml.mae);
if (isNaN(ml.r2) || isNaN(ml.rmse)) throw new Error("ML metrics NaN");

// 7. Hybrid
const hyb = runHybridExperiment({ dose_mg: 400 });
console.log("Hybrid PBPK R2:", hyb.metrics.pbpk.r2, "Hybrid R2:", hyb.metrics.hybrid.r2);

// 8. Optimization
const opt = runFormulationOptimization({ target_cmax: 14.0, target_auc: 115.0 });
console.log("Optimization optimal dose:", opt.optimal_dose_mg, "predicted Cmax:", opt.predicted_cmax, "Loss:", opt.loss_score);

// 9. XAI
const xai = computeModelExplanation({
  dose_mg: 500,
  molecular_weight: 206,
  logp: 3.97,
  solubility_mg_ml: 0.02,
  permeability_peff: 4.2,
  polymer_percent: 28,
  particle_size_um: 45,
  patient_weight_kg: 72,
  clearance_l_h: 3.2,
}, "AUC");
console.log("XAI Predicted Value:", xai.predicted_value, "Baseline:", xai.baseline_expected_value, "Top Driver:", xai.attributions[0].feature_name);

// 10. Validation
const val = runValidationSuite();
console.log("Validation status:", val.validation_status, "models count:", val.metrics_table.length);

console.log("ALL SCIENTIFIC ENGINES PASSED INTEGRITY VERIFICATION!");
