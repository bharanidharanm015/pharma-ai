/**
 * PHARMA AI — Virtual Population & Patient Simulator
 * Monte Carlo sampling of virtual human cohorts parameterized by:
 * - Demographics (Age, Sex, Body Weight, Height, BMI)
 * - Allometric physiological scaling (Weight^0.75 for clearance, Weight^1.0 for volume)
 * - Inter-Individual Variability (IIV, log-normal omega distributions)
 * - Random Seed for exact scientific reproducibility
 * 
 * NOTICE:
 * SIMULATED VIRTUAL POPULATION — NOT REAL PATIENT DATA
 */

import { VirtualPatient, VirtualPopulationResult } from "../types";

export interface PopulationSimulationParams {
  cohort_size?: number;
  random_seed?: number;
  dose_mg?: number;
  ka_per_h?: number;
  base_clearance_l_h?: number;
  base_vd_l?: number;
  weight_mean_kg?: number;
  weight_cv_percent?: number;
  clearance_cv_percent?: number;
  volume_cv_percent?: number;
  duration_h?: number;
}

// Reproducible Mulberry32 PRNG
function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform for Gaussian N(0,1)
function boxMuller(rand: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function simulateVirtualPopulation(params: PopulationSimulationParams): VirtualPopulationResult {
  const cohortSize = Math.max(5, Math.min(500, params.cohort_size || 50));
  const seed = params.random_seed ?? 42;
  const rand = createPRNG(seed);

  const dose = Math.max(1.0, params.dose_mg || 400.0);
  const ka = Math.max(0.1, params.ka_per_h || 1.2);
  const baseCl = Math.max(0.2, params.base_clearance_l_h || 3.2);
  const baseVd = Math.max(1.0, params.base_vd_l || 9.8);

  const meanWt = Math.max(40, params.weight_mean_kg || 72.0);
  const cvWt = Math.max(5, params.weight_cv_percent || 16.0) / 100.0;
  const cvCl = Math.max(5, params.clearance_cv_percent || 24.0) / 100.0;
  const cvVd = Math.max(5, params.volume_cv_percent || 18.0) / 100.0;

  const duration = Math.max(6, params.duration_h || 24.0);
  const nPoints = 50;
  const time: number[] = [];
  for (let i = 0; i < nPoints; i++) {
    time.push(Number(((i / (nPoints - 1)) * duration).toFixed(2)));
  }

  const patients: VirtualPatient[] = [];
  const allTrajectories: number[][] = [];

  for (let i = 0; i < cohortSize; i++) {
    const isFemale = rand() > 0.48;
    const sex = isFemale ? "Female" : "Male";

    // Age distribution: 20 - 75 years
    const age = Math.floor(22 + rand() * 52);

    // Body weight: Log-normal distribution
    const zWt = boxMuller(rand);
    const weight = meanWt * Math.exp(cvWt * zWt - 0.5 * cvWt * cvWt);

    // Height based on sex and weight
    const heightMean = isFemale ? 163 : 176;
    const height = heightMean + boxMuller(rand) * 7.0;
    const bmi = weight / Math.pow(height / 100.0, 2);

    // Allometric scaling: CL proportional to WT^0.75, Vd proportional to WT^1.0
    const allometricCl = baseCl * Math.pow(weight / 70.0, 0.75);
    const allometricVd = baseVd * Math.pow(weight / 70.0, 1.0);

    // CYP enzyme activity variation (0.6 to 1.4)
    const cypFactor = Math.max(0.4, 1.0 + boxMuller(rand) * 0.18);

    // Inter-individual random effects eta
    const zCl = boxMuller(rand);
    const zVd = boxMuller(rand);
    const scaledCl = allometricCl * cypFactor * Math.exp(cvCl * zCl);
    const scaledVd = allometricVd * Math.exp(cvVd * zVd);

    const kel = scaledCl / scaledVd;

    // Simulate individual PK trajectory
    const trajectory: number[] = [];
    let patientCmax = 0;

    for (const t of time) {
      let c = 0;
      if (Math.abs(ka - kel) < 1e-4) {
        c = (dose / scaledVd) * ka * t * Math.exp(-kel * t);
      } else {
        c = (dose * ka) / (scaledVd * (ka - kel)) * (Math.exp(-kel * t) - Math.exp(-ka * t));
      }
      const safeC = Math.max(0, c);
      trajectory.push(Number(safeC.toFixed(4)));
      if (safeC > patientCmax) {
        patientCmax = safeC;
      }
    }

    const patientAuc = dose / scaledCl;

    patients.push({
      id: `VP-${seed}-${(i + 1).toString().padStart(4, "0")}`,
      patient_code: `SUBJ-${(i + 1).toString().padStart(3, "0")}`,
      age_years: age,
      sex,
      weight_kg: Number(weight.toFixed(1)),
      height_cm: Number(height.toFixed(1)),
      bmi: Number(bmi.toFixed(1)),
      cyp_activity_index: Number(cypFactor.toFixed(2)),
      scaled_clearance_l_h: Number(scaledCl.toFixed(2)),
      scaled_vd_l: Number(scaledVd.toFixed(2)),
      c_max: Number(patientCmax.toFixed(3)),
      auc: Number(patientAuc.toFixed(2)),
      trajectory,
      provenance_tag: "SIMULATED VIRTUAL POPULATION — NOT REAL PATIENT DATA",
    });

    allTrajectories.push(trajectory);
  }

  // Calculate Population Percentile Envelopes across Time Points
  const p5: number[] = [];
  const p25: number[] = [];
  const p50: number[] = [];
  const p75: number[] = [];
  const p95: number[] = [];
  const mean: number[] = [];

  for (let ptIdx = 0; ptIdx < nPoints; ptIdx++) {
    const valuesAtT = allTrajectories.map((traj) => traj[ptIdx]).sort((a, b) => a - b);
    const count = valuesAtT.length;

    p5.push(Number(valuesAtT[Math.floor(count * 0.05)].toFixed(3)));
    p25.push(Number(valuesAtT[Math.floor(count * 0.25)].toFixed(3)));
    p50.push(Number(valuesAtT[Math.floor(count * 0.50)].toFixed(3)));
    p75.push(Number(valuesAtT[Math.floor(count * 0.75)].toFixed(3)));
    p95.push(Number(valuesAtT[Math.min(count - 1, Math.floor(count * 0.95))].toFixed(3)));

    const sum = valuesAtT.reduce((acc, v) => acc + v, 0);
    mean.push(Number((sum / count).toFixed(3)));
  }

  // Mean and CV for Cmax and AUC
  const cmaxList = patients.map((p) => p.c_max);
  const aucList = patients.map((p) => p.auc);

  const meanCmax = cmaxList.reduce((acc, v) => acc + v, 0) / cmaxList.length;
  const stdCmax = Math.sqrt(cmaxList.reduce((acc, v) => acc + Math.pow(v - meanCmax, 2), 0) / cmaxList.length);
  const cvCmax = (stdCmax / meanCmax) * 100.0;

  const meanAuc = aucList.reduce((acc, v) => acc + v, 0) / aucList.length;
  const stdAuc = Math.sqrt(aucList.reduce((acc, v) => acc + Math.pow(v - meanAuc, 2), 0) / aucList.length);
  const cvAuc = (stdAuc / meanAuc) * 100.0;

  return {
    cohort_size: cohortSize,
    random_seed: seed,
    time,
    percentile_5: p5,
    percentile_25: p25,
    percentile_50: p50,
    percentile_75: p75,
    percentile_95: p95,
    mean_profile: mean,
    cmax_mean: Number(meanCmax.toFixed(2)),
    cmax_cv_percent: Number(cvCmax.toFixed(1)),
    auc_mean: Number(meanAuc.toFixed(2)),
    auc_cv_percent: Number(cvAuc.toFixed(1)),
    patients,
    provenance: "SIMULATED VIRTUAL POPULATION — NOT REAL PATIENT DATA",
  };
}
