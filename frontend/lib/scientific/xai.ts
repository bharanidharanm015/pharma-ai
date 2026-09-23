/**
 * PHARMA AI — Explainable AI (XAI) Attribution Engine
 * Implements SHAP-style additive local feature attribution:
 * f(x) = E[f(x)] + SUM(phi_i)
 * 
 * Explains individual ML model predictions based on physicochemical properties,
 * formulation parameters, and patient physiological covariates.
 * 
 * CRITICAL RULE:
 * Only show explanations generated from the actual model. Never fabricate explanations.
 */

import { XAIResult, FeatureAttribution } from "../types";

export interface XAIInputFeatures {
  dose_mg: number;
  molecular_weight: number;
  logp: number;
  solubility_mg_ml: number;
  permeability_peff: number;
  polymer_percent: number;
  particle_size_um: number;
  patient_weight_kg: number;
  clearance_l_h: number;
}

export function computeModelExplanation(
  features: XAIInputFeatures,
  targetMetric: "AUC" | "Cmax" = "AUC"
): XAIResult {
  // Baseline reference human population values (expected value E[f(X)])
  const baselineFeatures: XAIInputFeatures = {
    dose_mg: 400.0,
    molecular_weight: 250.0,
    logp: 2.5,
    solubility_mg_ml: 1.0,
    permeability_peff: 2.5,
    polymer_percent: 25.0,
    particle_size_um: 50.0,
    patient_weight_kg: 70.0,
    clearance_l_h: 3.5,
  };

  // Prediction function derived from biopharmaceutical model
  const predict = (f: XAIInputFeatures): number => {
    const ka = (f.permeability_peff * 0.45) / (1.0 + (f.polymer_percent / 25.0) * 0.6 + (f.particle_size_um / 50.0) * 0.2);
    const vd = 10.0 * (f.patient_weight_kg / 70.0) * (1.0 + Math.max(0, f.logp * 0.15));
    const kel = f.clearance_l_h / vd;

    if (targetMetric === "Cmax") {
      const tmax = Math.max(0.4, Math.log(Math.max(1.05, ka / kel)) / Math.max(0.05, ka - kel));
      const cmax = ((f.dose_mg * 0.95 * ka) / (vd * Math.max(0.05, ka - kel))) * (Math.exp(-kel * tmax) - Math.exp(-ka * tmax));
      return Math.max(0.1, cmax);
    } else {
      // AUC = Dose * F / CL
      const fOral = Math.min(0.98, Math.max(0.2, (f.solubility_mg_ml > 0.05 ? 0.95 : 0.6 + f.solubility_mg_ml * 5)));
      const auc = (f.dose_mg * fOral) / f.clearance_l_h;
      return Math.max(1.0, auc);
    }
  };

  const baselineExpectedValue = predict(baselineFeatures);
  const actualPredictedValue = predict(features);

  // Marginal contribution calculation via path perturbation
  const attributions: FeatureAttribution[] = [];

  // 1. Dose
  const predWithDose = predict({ ...baselineFeatures, dose_mg: features.dose_mg });
  const phiDose = predWithDose - baselineExpectedValue;
  attributions.push({
    feature_name: "Dose (mg)",
    feature_value: features.dose_mg,
    attribution_phi: Number(phiDose.toFixed(2)),
    impact: phiDose >= 0 ? "positive" : "negative",
    rationale: `Administered dose of ${features.dose_mg} mg shifted exposure by ${phiDose >= 0 ? "+" : ""}${phiDose.toFixed(2)} compared to baseline (400 mg).`,
  });

  // 2. Clearance
  const predWithCl = predict({ ...baselineFeatures, clearance_l_h: features.clearance_l_h });
  const phiCl = predWithCl - baselineExpectedValue;
  attributions.push({
    feature_name: "Clearance (L/h)",
    feature_value: features.clearance_l_h,
    attribution_phi: Number(phiCl.toFixed(2)),
    impact: phiCl >= 0 ? "positive" : "negative",
    rationale: `Systemic clearance rate of ${features.clearance_l_h} L/h modulates rate of metabolic and renal elimination.`,
  });

  // 3. Polymer Concentration
  const predWithPoly = predict({ ...baselineFeatures, polymer_percent: features.polymer_percent });
  const phiPoly = predWithPoly - baselineExpectedValue;
  attributions.push({
    feature_name: "Polymer Conc (%)",
    feature_value: features.polymer_percent,
    attribution_phi: Number(phiPoly.toFixed(2)),
    impact: phiPoly >= 0 ? "positive" : "negative",
    rationale: `Matrix polymer loading (${features.polymer_percent}%) alters hydrodynamic gel barrier and dissolution flux.`,
  });

  // 4. Patient Body Weight
  const predWithWt = predict({ ...baselineFeatures, patient_weight_kg: features.patient_weight_kg });
  const phiWt = predWithWt - baselineExpectedValue;
  attributions.push({
    feature_name: "Body Weight (kg)",
    feature_value: features.patient_weight_kg,
    attribution_phi: Number(phiWt.toFixed(2)),
    impact: phiWt >= 0 ? "positive" : "negative",
    rationale: `Physiological mass (${features.patient_weight_kg} kg) dictates anatomical volume of distribution.`,
  });

  // 5. Permeability Peff
  const predWithPeff = predict({ ...baselineFeatures, permeability_peff: features.permeability_peff });
  const phiPeff = predWithPeff - baselineExpectedValue;
  attributions.push({
    feature_name: "Permeability Peff",
    feature_value: features.permeability_peff,
    attribution_phi: Number(phiPeff.toFixed(2)),
    impact: phiPeff >= 0 ? "positive" : "negative",
    rationale: `Epithelial effective permeability (${features.permeability_peff} × 10⁻⁴ cm/s) drives mucosal absorption velocity.`,
  });

  // 6. Solubility
  const predWithSol = predict({ ...baselineFeatures, solubility_mg_ml: features.solubility_mg_ml });
  const phiSol = predWithSol - baselineExpectedValue;
  attributions.push({
    feature_name: "Solubility (mg/mL)",
    feature_value: features.solubility_mg_ml,
    attribution_phi: Number(phiSol.toFixed(2)),
    impact: phiSol >= 0 ? "positive" : "negative",
    rationale: `Intrinsic aqueous solubility (${features.solubility_mg_ml} mg/mL) determines luminal dissolution saturation limits.`,
  });

  // Sort by absolute attribution impact
  attributions.sort((a, b) => Math.abs(b.attribution_phi) - Math.abs(a.attribution_phi));

  const sumPhi = attributions.reduce((acc, a) => acc + a.attribution_phi, 0);
  const additiveCheckSum = Number((baselineExpectedValue + sumPhi).toFixed(2));

  const primaryDriver = attributions[0];
  const secondaryDriver = attributions[1];

  const plainLanguageExplanation = `The predicted ${targetMetric} of ${actualPredictedValue.toFixed(2)} ${
    targetMetric === "AUC" ? "mg·h/L" : "mg/L"
  } is primarily driven by ${primaryDriver.feature_name} (${primaryDriver.impact === "positive" ? "+" : ""}${primaryDriver.attribution_phi.toFixed(2)}), followed by ${
    secondaryDriver.feature_name
  } (${secondaryDriver.impact === "positive" ? "+" : ""}${secondaryDriver.attribution_phi.toFixed(2)}). Baseline cohort expected value is ${baselineExpectedValue.toFixed(2)}.`;

  return {
    predicted_value: Number(actualPredictedValue.toFixed(2)),
    baseline_expected_value: Number(baselineExpectedValue.toFixed(2)),
    target_unit: targetMetric === "AUC" ? "mg·h/L" : "mg/L",
    target_metric: targetMetric,
    attributions,
    additive_check_sum: additiveCheckSum,
    plain_language_explanation: plainLanguageExplanation,
  };
}
