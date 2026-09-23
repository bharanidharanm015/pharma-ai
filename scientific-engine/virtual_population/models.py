"""
PHARMA AI — Scientific Engine: Virtual Patient & Population PK Module
Generates physiologically realistic virtual patient cohorts via Monte Carlo sampling
of demographic and physiological covariates (Age, Sex, Weight, eGFR, CYP activity)
and simulates inter-individual pharmacokinetic variability with percentile bands.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
import numpy as np


@dataclass
class VirtualPatient:
    patient_id: str
    age_years: float
    biological_sex: str
    body_weight_kg: float
    height_cm: float
    bmi: float
    creatinine_clearance_ml_min: float
    cyp_activity_index: float
    scaled_cl_total_l_h: float
    scaled_vd_l: float
    provenance_tag: str = "SIMULATED VIRTUAL PATIENT"


@dataclass
class PopulationSimulationResult:
    population_size: int
    time_points: List[float]
    percentile_5: List[float]
    percentile_25: List[float]
    median_percentile_50: List[float]
    percentile_75: List[float]
    percentile_95: List[float]
    mean_profile: List[float]
    individual_samples: List[Dict[str, Any]]
    cmax_mean: float
    cmax_cv_percent: float
    auc_mean: float
    auc_cv_percent: float
    patient_demographics_summary: Dict[str, Any]
    metadata: Dict[str, Any] = field(default_factory=dict)


def generate_virtual_population(
    population_size: int = 50,
    age_min: float = 18.0,
    age_max: float = 75.0,
    female_ratio: float = 0.5,
    seed: Optional[int] = 42,
) -> List[VirtualPatient]:
    """
    Generates a cohort of simulated virtual patients with correlated physiological covariates.
    """
    if seed is not None:
        np.random.seed(seed)

    population_size = max(5, min(500, population_size))
    patients: List[VirtualPatient] = []

    for i in range(population_size):
        pid = f"VP-{i+1:04d}"
        sex = "Female" if np.random.rand() < female_ratio else "Male"
        age = float(np.random.uniform(age_min, age_max))

        # Height (cm) distribution based on sex
        if sex == "Male":
            height = float(np.random.normal(176.0, 7.0))
            weight_mean = 78.0
        else:
            height = float(np.random.normal(163.0, 6.5))
            weight_mean = 65.0

        # Log-normal body weight (kg)
        log_mean = np.log(weight_mean)
        weight = float(np.random.lognormal(log_mean, 0.16))
        weight = float(np.clip(weight, 42.0, 130.0))

        bmi = float(weight / ((height / 100.0) ** 2))

        # Serum creatinine (mg/dL): physiological normal 0.7 - 1.2
        scr = float(np.clip(np.random.normal(0.95, 0.18), 0.5, 1.8))

        # Cockcroft-Gault Creatinine Clearance (mL/min)
        crcl_male = ((140.0 - age) * weight) / (72.0 * scr)
        crcl = float(crcl_male * 0.85 if sex == "Female" else crcl_male)
        crcl = float(np.clip(crcl, 15.0, 160.0))

        # CYP enzyme activity index (log-normal, standard mean=1.0, CV=35%)
        cyp_idx = float(np.random.lognormal(-0.06, 0.32))
        cyp_idx = float(np.clip(cyp_idx, 0.2, 2.5))

        # Base clearances (standard 70kg reference: CL_hep=15 L/h, CL_renal=5 L/h, Vd=30 L)
        weight_scale_cl = (weight / 70.0) ** 0.75
        weight_scale_vd = weight / 70.0

        cl_hep = 15.0 * weight_scale_cl * cyp_idx
        cl_renal = 5.0 * (crcl / 100.0)
        scaled_cl = float(cl_hep + cl_renal)
        scaled_vd = float(30.0 * weight_scale_vd)

        patients.append(
            VirtualPatient(
                patient_id=pid,
                age_years=round(age, 1),
                biological_sex=sex,
                body_weight_kg=round(weight, 1),
                height_cm=round(height, 1),
                bmi=round(bmi, 1),
                creatinine_clearance_ml_min=round(crcl, 1),
                cyp_activity_index=round(cyp_idx, 3),
                scaled_cl_total_l_h=round(scaled_cl, 2),
                scaled_vd_l=round(scaled_vd, 2),
            )
        )

    return patients


def simulate_population_pk(
    population: List[VirtualPatient],
    dose_mg: float = 400.0,
    ka_per_h: float = 1.2,
    f_bioavail: float = 0.9,
    t_end_h: float = 24.0,
    num_points: int = 100,
    max_sample_display: int = 12,
) -> PopulationSimulationResult:
    """
    Executes PK simulation across the virtual patient population and calculates percentile envelopes.
    """
    t = np.linspace(0.0, max(1.0, t_end_h), num_points)
    n_pts = len(population)
    all_profiles = np.zeros((n_pts, num_points))
    cmax_list = []
    auc_list = []

    individual_samples = []

    for i, pt in enumerate(population):
        cl = pt.scaled_cl_total_l_h
        vd = pt.scaled_vd_l
        kel = cl / vd

        # Add modest inter-individual absorption rate variation (CV 20%)
        pt_ka = max(0.2, ka_per_h * (1.0 + 0.15 * (np.sin(i * 1.7))))

        if np.isclose(pt_ka, kel, atol=1e-4):
            c = (dose_mg * f_bioavail / vd) * pt_ka * t * np.exp(-kel * t)
        else:
            c = ((dose_mg * f_bioavail * pt_ka) / (vd * (pt_ka - kel))) * (
                np.exp(-kel * t) - np.exp(-pt_ka * t)
            )
        c = np.maximum(c, 0.0)
        all_profiles[i, :] = c

        ind_cmax = float(np.max(c))
        ind_auc = float(np.trapezoid(c, t))
        cmax_list.append(ind_cmax)
        auc_list.append(ind_auc)

        if i < max_sample_display:
            individual_samples.append({
                "patient_id": pt.patient_id,
                "weight_kg": pt.body_weight_kg,
                "sex": pt.biological_sex,
                "c_max": round(ind_cmax, 3),
                "auc": round(ind_auc, 3),
                "profile": [round(float(val), 4) for val in c],
            })

    # Statistical percentiles across columns (time points)
    p5 = np.percentile(all_profiles, 5, axis=0)
    p25 = np.percentile(all_profiles, 25, axis=0)
    p50 = np.percentile(all_profiles, 50, axis=0)
    p75 = np.percentile(all_profiles, 75, axis=0)
    p95 = np.percentile(all_profiles, 95, axis=0)
    mean_prof = np.mean(all_profiles, axis=0)

    cmax_mean = float(np.mean(cmax_list))
    cmax_cv = float((np.std(cmax_list) / cmax_mean) * 100.0) if cmax_mean > 0 else 0.0

    auc_mean = float(np.mean(auc_list))
    auc_cv = float((np.std(auc_list) / auc_mean) * 100.0) if auc_mean > 0 else 0.0

    ages = [pt.age_years for pt in population]
    weights = [pt.body_weight_kg for pt in population]
    crcls = [pt.creatinine_clearance_ml_min for pt in population]
    female_cnt = sum(1 for pt in population if pt.biological_sex == "Female")

    demographics = {
        "mean_age": round(float(np.mean(ages)), 1),
        "mean_weight": round(float(np.mean(weights)), 1),
        "mean_crcl": round(float(np.mean(crcls)), 1),
        "female_percentage": round(float(female_cnt / n_pts * 100.0), 1),
    }

    return PopulationSimulationResult(
        population_size=n_pts,
        time_points=[round(float(val), 3) for val in t],
        percentile_5=[round(float(val), 4) for val in p5],
        percentile_25=[round(float(val), 4) for val in p25],
        median_percentile_50=[round(float(val), 4) for val in p50],
        percentile_75=[round(float(val), 4) for val in p75],
        percentile_95=[round(float(val), 4) for val in p95],
        mean_profile=[round(float(val), 4) for val in mean_prof],
        individual_samples=individual_samples,
        cmax_mean=round(cmax_mean, 3),
        cmax_cv_percent=round(cmax_cv, 2),
        auc_mean=round(auc_mean, 3),
        auc_cv_percent=round(auc_cv, 2),
        patient_demographics_summary=demographics,
        metadata={
            "dose_mg": dose_mg,
            "ka": ka_per_h,
            "provenance": "SIMULATED VIRTUAL PATIENT COHORT",
        },
    )
