/**
 * PHARMA AI — Modular Pharmacokinetics (PK) Simulation Engine
 * Implements 1-Compartment and 2-Compartment models with oral and IV routes.
 * Mathematical derivation:
 * dC/dt = (ka * F * Dose / Vd) * exp(-ka * t) - kel * C
 * Analytical solution for 1C Oral:
 * C(t) = [Dose * F * ka / (Vd * (ka - kel))] * (exp(-kel * t) - exp(-ka * t))
 * Tmax = ln(ka / kel) / (ka - kel)
 * Cmax = C(Tmax)
 * AUC_inf = (Dose * F) / CL
 */

import { ClassicalPKResult } from "../types";

export interface PKSimulationParams {
  model_type?: "1-Compartment Oral" | "1-Compartment IV" | "2-Compartment Oral";
  dose_mg: number;
  ka_per_h?: number;
  cl_l_h: number;
  vd_l: number;
  bioavailability_f?: number;
  duration_h?: number;
  time_step_h?: number;
  q_inter_l_h?: number; // Inter-compartmental clearance for 2C
  v2_l?: number; // Peripheral volume for 2C
}

export function simulateClassicalPK(params: PKSimulationParams): ClassicalPKResult {
  const modelType = params.model_type || "1-Compartment Oral";
  const dose = Math.max(1.0, params.dose_mg || 400.0);
  const cl = Math.max(0.1, params.cl_l_h || 3.2);
  const vd = Math.max(1.0, params.vd_l || 9.8);
  const f = Math.min(1.0, Math.max(0.01, params.bioavailability_f ?? 0.95));
  const ka = Math.max(0.05, params.ka_per_h || 1.2);
  const duration = Math.max(6.0, params.duration_h || 24.0);
  const dt = Math.max(0.05, params.time_step_h || 0.15);
  const nPoints = Math.floor(duration / dt) + 1;

  const kel = cl / vd;
  const tHalf = Math.LN2 / kel;
  const aucInf = (dose * f) / cl;

  const time: number[] = [];
  const concentration: number[] = [];

  let tMax = 0;
  let cMax = 0;

  if (modelType === "1-Compartment IV") {
    // IV Bolus: C(t) = (Dose / Vd) * exp(-kel * t)
    for (let i = 0; i < nPoints; i++) {
      const t = Number((i * dt).toFixed(2));
      time.push(t);
      const c = (dose / vd) * Math.exp(-kel * t);
      concentration.push(Number(Math.max(0, c).toFixed(4)));
    }
    tMax = 0;
    cMax = dose / vd;
  } else if (modelType === "2-Compartment Oral") {
    // 2-Compartment Oral (Central V1 and Peripheral V2 with inter-compartmental clearance Q)
    const v1 = vd;
    const v2 = params.v2_l || vd * 1.5;
    const q = params.q_inter_l_h || cl * 0.8;
    const k10 = cl / v1;
    const k12 = q / v1;
    const k21 = q / v2;

    const b = k10 + k12 + k21;
    const cVal = k10 * k21;
    const alpha = (b + Math.sqrt(Math.max(0, b * b - 4 * cVal))) / 2;
    const beta = (b - Math.sqrt(Math.max(0, b * b - 4 * cVal))) / 2;

    const aConst = (dose * f * ka * (k21 - alpha)) / (v1 * (ka - alpha) * (beta - alpha));
    const bConst = (dose * f * ka * (k21 - beta)) / (v1 * (ka - beta) * (alpha - beta));
    const cConst = -(aConst + bConst);

    for (let i = 0; i < nPoints; i++) {
      const t = Number((i * dt).toFixed(2));
      time.push(t);
      const c = aConst * Math.exp(-alpha * t) + bConst * Math.exp(-beta * t) + cConst * Math.exp(-ka * t);
      const safeC = Math.max(0, c);
      concentration.push(Number(safeC.toFixed(4)));
      if (safeC > cMax) {
        cMax = safeC;
        tMax = t;
      }
    }
  } else {
    // Standard 1-Compartment Oral with Bateman Function
    if (Math.abs(ka - kel) < 1e-4) {
      // Flip-flop degenerate case ka == kel
      for (let i = 0; i < nPoints; i++) {
        const t = Number((i * dt).toFixed(2));
        time.push(t);
        const c = ((dose * f) / vd) * ka * t * Math.exp(-kel * t);
        concentration.push(Number(Math.max(0, c).toFixed(4)));
      }
      tMax = 1 / kel;
      cMax = ((dose * f) / vd) * Math.exp(-1);
    } else {
      const coeff = (dose * f * ka) / (vd * (ka - kel));
      tMax = Math.log(ka / kel) / (ka - kel);
      for (let i = 0; i < nPoints; i++) {
        const t = Number((i * dt).toFixed(2));
        time.push(t);
        const c = coeff * (Math.exp(-kel * t) - Math.exp(-ka * t));
        const safeC = Math.max(0, c);
        concentration.push(Number(safeC.toFixed(4)));
        if (safeC > cMax) {
          cMax = safeC;
        }
      }
    }
  }

  // Trapezoidal numerical integration for AUC_0_last
  let auc0Last = 0;
  for (let i = 1; i < time.length; i++) {
    const dtStep = time[i] - time[i - 1];
    auc0Last += ((concentration[i - 1] + concentration[i]) / 2) * dtStep;
  }

  return {
    model_type: modelType,
    time,
    concentration,
    c_max: Number(cMax.toFixed(3)),
    t_max: Number(tMax.toFixed(2)),
    auc_0_last: Number(auc0Last.toFixed(2)),
    auc_0_inf: Number(aucInf.toFixed(2)),
    half_life_h: Number(tHalf.toFixed(2)),
    clearance_l_h: Number(cl.toFixed(2)),
    vd_l: Number(vd.toFixed(2)),
    kel: Number(kel.toFixed(4)),
    equations: {
      ode: "dC/dt = (ka * F * Dose / Vd)*exp(-ka*t) - (CL / Vd)*C",
      analytical: "C(t) = [D*F*ka / (Vd*(ka - kel))] * (exp(-kel*t) - exp(-ka*t))",
    },
  };
}
