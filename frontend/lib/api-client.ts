/**
 * PHARMA AI — Unified Scientific & Data Client
 * Bridges the UI components to:
 * 1. The modular in-engine TypeScript scientific solvers (100% Vercel-ready, zero external daemon crash)
 * 2. The Supabase PostgreSQL database layer with RLS and offline fallback
 */

import {
  Drug,
  Formulation,
  ClassicalPKResult,
  PBPKResult,
  DissolutionCurveResult,
  AbsorptionResult,
  VirtualPopulationResult,
  MLResult,
  HybridResult,
  OptimizationResult,
  XAIResult,
  ValidationReport,
  ResearchReport,
  SavedExperiment,
  AdminProfile,
  PatientProfile,
  MedicineInfo,
  DrugInteractionPair,
  TreatmentMilestone,
  MedicationReminderItem,
  PatientReportDocument,
  SymptomAssessment,
  DissolutionModelType,
  MLModelType,
} from "./types";

import { simulateDissolutionCurve, calculateSimilarityFactors } from "./scientific/dissolution";
import { simulateGIAbsorption } from "./scientific/absorption";
import { simulateClassicalPK } from "./scientific/pk";
import { simulatePBPK5Compartment } from "./scientific/pbpk";
import { simulateVirtualPopulation } from "./scientific/virtual-population";
import { runMLExperiment } from "./scientific/ml";
import { runHybridExperiment } from "./scientific/hybrid";
import { runFormulationOptimization } from "./scientific/optimization";
import { computeModelExplanation, XAIInputFeatures } from "./scientific/xai";
import { runValidationSuite } from "./scientific/validation";
import { pharmaDb } from "./supabase/db";

export const pharmaApi = {
  // ============================================================================
  // DRUGS & SCENARIOS
  // ============================================================================
  async getDrugs(): Promise<Drug[]> {
    return await pharmaDb.getDrugs();
  },

  async saveDrug(drug: Drug): Promise<Drug> {
    return await pharmaDb.saveDrug(drug);
  },

  async deleteDrug(id: string): Promise<boolean> {
    return await pharmaDb.deleteDrug(id);
  },

  // ============================================================================
  // FORMULATIONS
  // ============================================================================
  async getFormulations(): Promise<Formulation[]> {
    return await pharmaDb.getFormulations();
  },

  async saveFormulation(formulation: Formulation): Promise<Formulation> {
    return await pharmaDb.saveFormulation(formulation);
  },

  async deleteFormulation(id: string): Promise<boolean> {
    return await pharmaDb.deleteFormulation(id);
  },

  // ============================================================================
  // DISSOLUTION
  // ============================================================================
  async simulateDissolution(params: {
    model_type: DissolutionModelType;
    duration_h?: number;
    time_step_h?: number;
    rate_constant_k?: number;
    release_exponent_n?: number;
    solubility_mg_ml?: number;
    polymer_concentration?: number;
    particle_size_d50_um?: number;
  }): Promise<DissolutionCurveResult> {
    return simulateDissolutionCurve(params);
  },

  compareDissolution(reference: number[], test: number[]) {
    return calculateSimilarityFactors(reference, test);
  },

  // ============================================================================
  // ABSORPTION
  // ============================================================================
  async simulateAbsorption(params: {
    dose_mg: number;
    solubility_mg_ml: number;
    permeability_peff: number;
    pka?: number;
    logp: number;
    duration_h?: number;
    time_step_h?: number;
  }): Promise<AbsorptionResult> {
    return simulateGIAbsorption(params);
  },

  // ============================================================================
  // PHARMACOKINETICS (1C/2C)
  // ============================================================================
  async simulatePK(params: {
    model_type?: "1-Compartment Oral" | "1-Compartment IV" | "2-Compartment Oral";
    dose_mg: number;
    ka_per_h?: number;
    cl_l_h: number;
    vd_l: number;
    bioavailability_f?: number;
    duration_h?: number;
  }): Promise<ClassicalPKResult> {
    return simulateClassicalPK(params);
  },

  // ============================================================================
  // PBPK (5-ORGAN RK4)
  // ============================================================================
  async simulatePBPK(params: {
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
  }): Promise<PBPKResult> {
    return simulatePBPK5Compartment(params);
  },

  // ============================================================================
  // VIRTUAL POPULATIONS
  // ============================================================================
  async simulatePopulation(params: {
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
  }): Promise<VirtualPopulationResult> {
    return simulateVirtualPopulation(params);
  },

  // ============================================================================
  // MACHINE LEARNING
  // ============================================================================
  async trainML(params: {
    model_type: MLModelType;
    target_metric: "Cmax" | "AUC" | "Tmax";
  }): Promise<MLResult> {
    return runMLExperiment(params.model_type, params.target_metric);
  },

  // ============================================================================
  // HYBRID MODELING
  // ============================================================================
  async simulateHybrid(params: {
    dose_mg?: number;
    body_weight_kg?: number;
    ka_per_h?: number;
    has_enterohepatic_recirculation?: boolean;
  }): Promise<HybridResult> {
    return runHybridExperiment(params);
  },

  // ============================================================================
  // OPTIMIZATION
  // ============================================================================
  async runOptimization(params: {
    target_cmax: number;
    target_auc: number;
    dose_min_mg?: number;
    dose_max_mg?: number;
    polymer_min_percent?: number;
    polymer_max_percent?: number;
    particle_size_min_um?: number;
    particle_size_max_um?: number;
  }): Promise<OptimizationResult> {
    return runFormulationOptimization(params);
  },

  // ============================================================================
  // EXPLAINABLE AI (XAI)
  // ============================================================================
  async explainPrediction(features: XAIInputFeatures, targetMetric: "AUC" | "Cmax" = "AUC"): Promise<XAIResult> {
    return computeModelExplanation(features, targetMetric);
  },

  // ============================================================================
  // VALIDATION & SENSITIVITY
  // ============================================================================
  async runValidation(): Promise<ValidationReport> {
    return runValidationSuite();
  },

  // ============================================================================
  // REPORTS & AUDITS
  // ============================================================================
  async getReports(): Promise<ResearchReport[]> {
    return await pharmaDb.getReports();
  },

  async saveReport(report: ResearchReport): Promise<ResearchReport> {
    return await pharmaDb.saveReport(report);
  },

  async getResearchNotes(): Promise<string> {
    return await pharmaDb.getResearchNotes();
  },

  async saveResearchNotes(notes: string): Promise<void> {
    return await pharmaDb.saveResearchNotes(notes);
  },

  // ============================================================================
  // SAVED EXPERIMENTS (SAVE & REOPEN PIPELINE)
  // ============================================================================
  async getSavedExperiments(): Promise<SavedExperiment[]> {
    return await pharmaDb.getSavedExperiments();
  },

  async saveExperiment(experiment: SavedExperiment): Promise<SavedExperiment> {
    return await pharmaDb.saveExperiment(experiment);
  },

  async deleteExperiment(id: string): Promise<boolean> {
    return await pharmaDb.deleteExperiment(id);
  },

  async getTableStats(): Promise<Record<string, number>> {
    return await pharmaDb.getTableStats();
  },

  async getRecentSimulations(): Promise<any[]> {
    return await pharmaDb.getRecentSimulations();
  },

  async purgeDemoData() {
    return await pharmaDb.purgeAllDemoData();
  },

  async loadDemoData() {
    return await pharmaDb.loadDemoData();
  },

  // ============================================================================
  // PATIENT PROFILE (RESEARCH & SIMULATION ONLY)
  // ============================================================================
  async getPatientProfile(): Promise<PatientProfile> {
    return await pharmaDb.getPatientProfile();
  },

  async savePatientProfile(profile: PatientProfile): Promise<PatientProfile> {
    return await pharmaDb.savePatientProfile(profile);
  },

  // ============================================================================
  // TREATMENT PROGRESS
  // ============================================================================
  async getTreatmentProgress(): Promise<TreatmentMilestone[]> {
    return await pharmaDb.getTreatmentProgress();
  },

  async saveTreatmentMilestone(milestone: TreatmentMilestone): Promise<TreatmentMilestone> {
    return await pharmaDb.saveTreatmentMilestone(milestone);
  },

  // ============================================================================
  // MEDICATION REMINDERS
  // ============================================================================
  async getMedicationReminders(): Promise<MedicationReminderItem[]> {
    return await pharmaDb.getMedicationReminders();
  },

  async saveMedicationReminder(item: MedicationReminderItem): Promise<MedicationReminderItem> {
    return await pharmaDb.saveMedicationReminder(item);
  },

  async deleteMedicationReminder(id: string): Promise<boolean> {
    return await pharmaDb.deleteMedicationReminder(id);
  },

  // ============================================================================
  // PATIENT REPORTS
  // ============================================================================
  async getPatientReports(): Promise<PatientReportDocument[]> {
    return await pharmaDb.getPatientReports();
  },

  async savePatientReport(report: PatientReportDocument): Promise<PatientReportDocument> {
    return await pharmaDb.savePatientReport(report);
  },

  // ============================================================================
  // DOCUMENTED MEDICINES & INTERACTIONS (NO FABRICATED DATA)
  // ============================================================================
  getDocumentedMedicines(): MedicineInfo[] {
    return pharmaDb.getDocumentedMedicines();
  },

  checkDrugInteractions(medicines: string[]): DrugInteractionPair[] {
    return pharmaDb.checkDrugInteractions(medicines);
  },

  analyzeSymptoms(symptoms: string[]): SymptomAssessment {
    return pharmaDb.analyzeSymptoms(symptoms);
  },

  // ============================================================================
  // COMPATIBILITY ALIASES
  // ============================================================================
  async getAdminProfile(): Promise<AdminProfile> {
    return await pharmaDb.getAdminProfile();
  },

  async saveAdminProfile(profile: AdminProfile): Promise<AdminProfile> {
    return await pharmaDb.saveAdminProfile(profile);
  },
};
