/**
 * PHARMA AI — 5-Organ Continuous PBPK Simulation Engine
 * Transparent, Modular, Configurable Runge-Kutta 4th Order (RK4) ODE Solver
 * 
 * Model Topology:
 * - Gut Lumen: Absorption into portal vein / central plasma (ka)
 * - Central Plasma / Blood Pool: Cardiac output distribution (Q_total)
 * - Liver: Hepatic blood flow (Q_L), tissue partition (Kp_L), intrinsic clearance (CL_hep)
 * - Kidney: Renal blood flow (Q_K), tissue partition (Kp_K), renal clearance (CL_renal)
 * - Peripheral Tissues: Organ flow (Q_T), partition coefficient (Kp_T)
 * - Elimination: Cumulative metabolized and excreted drug
 * 
 * Mathematical conservation of mass:
 * Total Mass(t) = A_gut(t) + A_plasma(t) + A_liver(t) + A_kidney(t) + A_tissue(t) + A_elim(t) == Dose * F
 */

import { PBPKResult } from "../types";

export interface PBPKConfigParams {
  dose_mg: number;
  body_weight_kg?: number;
  ka_per_h?: number;
  f_oral?: number;
  cl_hep_l_h?: number;
  cl_renal_l_h?: number;
  kp_liver?: number;
  kp_kidney?: number;
  kp_tissue?: number;
  duration_h?: number;
  time_step_h?: number;
}

interface PBPKState {
  aGut: number;
  aPlasma: number;
  aLiver: number;
  aKidney: number;
  aTissue: number;
  aElim: number;
}

export function simulatePBPK5Compartment(params: PBPKConfigParams): PBPKResult {
  const dose = Math.max(1.0, params.dose_mg || 400.0);
  const wt = Math.max(30.0, params.body_weight_kg || 70.0);
  const f = Math.min(1.0, Math.max(0.1, params.f_oral ?? 0.95));
  const ka = Math.max(0.1, params.ka_per_h || 1.2);
  const duration = Math.max(6.0, params.duration_h || 24.0);
  const dt = Math.max(0.01, params.time_step_h || 0.1);

  // Scaled physiological blood flows (L/h) based on reference human 70kg
  // Cardiac output ~ 360 L/h (6 L/min)
  const coScale = wt / 70.0;
  const qCardiac = 360.0 * coScale;
  const qLiver = qCardiac * 0.25; // 25% of cardiac output
  const qKidney = qCardiac * 0.20; // 20%
  const qTissue = qCardiac * 0.55; // 55%

  // Organ physiological volumes (L)
  const vPlasma = 5.0 * coScale;
  const vLiver = 1.8 * coScale;
  const vKidney = 0.3 * coScale;
  const vTissue = 28.0 * coScale;

  // Organ partition coefficients (Kp = C_tissue / C_plasma)
  const kpLiver = Math.max(0.2, params.kp_liver || 1.85);
  const kpKidney = Math.max(0.2, params.kp_kidney || 2.10);
  const kpTissue = Math.max(0.2, params.kp_tissue || 1.25);

  // Clearances (L/h)
  const clHep = Math.max(0.1, params.cl_hep_l_h || 3.0 * coScale);
  const clRenal = Math.max(0.05, params.cl_renal_l_h || 0.5 * coScale);

  // Initial conditions
  let state: PBPKState = {
    aGut: dose * f,
    aPlasma: 0.0,
    aLiver: 0.0,
    aKidney: 0.0,
    aTissue: 0.0,
    aElim: 0.0,
  };

  const time: number[] = [];
  const plasmaConc: number[] = [];
  const liverConc: number[] = [];
  const kidneyConc: number[] = [];
  const tissueConc: number[] = [];
  const gutAmount: number[] = [];
  const elimAmount: number[] = [];

  // ODE derivative function: dState/dt
  const computeDerivatives = (s: PBPKState): PBPKState => {
    const cPlasma = s.aPlasma / vPlasma;
    const cLiverFree = s.aLiver / (vLiver * kpLiver);
    const cKidneyFree = s.aKidney / (vKidney * kpKidney);
    const cTissueFree = s.aTissue / (vTissue * kpTissue);

    // 1. Gut lumen
    const dGut = -ka * s.aGut;

    // 2. Plasma pool
    const dPlasma =
      ka * s.aGut +
      qLiver * cLiverFree +
      qKidney * cKidneyFree +
      qTissue * cTissueFree -
      (qLiver + qKidney + qTissue) * cPlasma;

    // 3. Liver
    const dLiver = qLiver * (cPlasma - cLiverFree) - clHep * cLiverFree;

    // 4. Kidney
    const dKidney = qKidney * (cPlasma - cKidneyFree) - clRenal * cKidneyFree;

    // 5. Peripheral tissue
    const dTissue = qTissue * (cPlasma - cTissueFree);

    // 6. Eliminated mass
    const dElim = clHep * cLiverFree + clRenal * cKidneyFree;

    return {
      aGut: dGut,
      aPlasma: dPlasma,
      aLiver: dLiver,
      aKidney: dKidney,
      aTissue: dTissue,
      aElim: dElim,
    };
  };

  // Helper for vector addition in RK4
  const stepState = (s: PBPKState, ds: PBPKState, factor: number): PBPKState => ({
    aGut: Math.max(0, s.aGut + ds.aGut * factor),
    aPlasma: Math.max(0, s.aPlasma + ds.aPlasma * factor),
    aLiver: Math.max(0, s.aLiver + ds.aLiver * factor),
    aKidney: Math.max(0, s.aKidney + ds.aKidney * factor),
    aTissue: Math.max(0, s.aTissue + ds.aTissue * factor),
    aElim: Math.max(0, s.aElim + ds.aElim * factor),
  });

  const nSteps = Math.floor(duration / dt) + 1;
  let maxMassError = 0.0;
  const initialMass = dose * f;

  for (let step = 0; step < nSteps; step++) {
    const t = Number((step * dt).toFixed(2));
    time.push(t);

    const cp = state.aPlasma / vPlasma;
    const cliv = state.aLiver / vLiver;
    const ckid = state.aKidney / vKidney;
    const ctis = state.aTissue / vTissue;

    plasmaConc.push(Number(cp.toFixed(4)));
    liverConc.push(Number(cliv.toFixed(4)));
    kidneyConc.push(Number(ckid.toFixed(4)));
    tissueConc.push(Number(ctis.toFixed(4)));
    gutAmount.push(Number(state.aGut.toFixed(3)));
    elimAmount.push(Number(state.aElim.toFixed(3)));

    // Mass balance check
    const totalMass = state.aGut + state.aPlasma + state.aLiver + state.aKidney + state.aTissue + state.aElim;
    const currentError = Math.abs(totalMass - initialMass) / initialMass * 100.0;
    if (currentError > maxMassError) {
      maxMassError = currentError;
    }

    // Runge-Kutta 4th Order (RK4) integration
    const k1 = computeDerivatives(state);
    const s1 = stepState(state, k1, dt * 0.5);

    const k2 = computeDerivatives(s1);
    const s2 = stepState(state, k2, dt * 0.5);

    const k3 = computeDerivatives(s2);
    const s3 = stepState(state, k3, dt);

    const k4 = computeDerivatives(s3);

    state = {
      aGut: Math.max(0, state.aGut + (dt / 6.0) * (k1.aGut + 2 * k2.aGut + 2 * k3.aGut + k4.aGut)),
      aPlasma: Math.max(0, state.aPlasma + (dt / 6.0) * (k1.aPlasma + 2 * k2.aPlasma + 2 * k3.aPlasma + k4.aPlasma)),
      aLiver: Math.max(0, state.aLiver + (dt / 6.0) * (k1.aLiver + 2 * k2.aLiver + 2 * k3.aLiver + k4.aLiver)),
      aKidney: Math.max(0, state.aKidney + (dt / 6.0) * (k1.aKidney + 2 * k2.aKidney + 2 * k3.aKidney + k4.aKidney)),
      aTissue: Math.max(0, state.aTissue + (dt / 6.0) * (k1.aTissue + 2 * k2.aTissue + 2 * k3.aTissue + k4.aTissue)),
      aElim: Math.max(0, state.aElim + (dt / 6.0) * (k1.aElim + 2 * k2.aElim + 2 * k3.aElim + k4.aElim)),
    };
  }

  // Calculate Summary Metrics
  let cMaxPlasma = 0;
  let tMaxPlasma = 0;
  for (let i = 0; i < plasmaConc.length; i++) {
    if (plasmaConc[i] > cMaxPlasma) {
      cMaxPlasma = plasmaConc[i];
      tMaxPlasma = time[i];
    }
  }

  // Trapezoidal AUC
  let aucPlasma = 0;
  for (let i = 1; i < time.length; i++) {
    aucPlasma += ((plasmaConc[i - 1] + plasmaConc[i]) / 2) * (time[i] - time[i - 1]);
  }

  return {
    time,
    plasma_conc: plasmaConc,
    liver_conc: liverConc,
    kidney_conc: kidneyConc,
    tissue_conc: tissueConc,
    gut_amount: gutAmount,
    eliminated_amount: elimAmount,
    c_max_plasma: Number(cMaxPlasma.toFixed(3)),
    t_max_plasma: Number(tMaxPlasma.toFixed(2)),
    auc_plasma: Number(aucPlasma.toFixed(2)),
    mass_balance_error_percent: Number(maxMassError.toFixed(4)),
    organ_kps: {
      liver: kpLiver,
      kidney: kpKidney,
      tissue: kpTissue,
    },
    physiological_parameters: {
      cardiac_output_l_h: Number(qCardiac.toFixed(1)),
      body_weight_kg: wt,
      hematocrit: 0.45,
    },
  };
}
