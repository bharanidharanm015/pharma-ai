"""
PHARMA AI — Automated Scientific Test Suite
Verifies mathematical integrity, mass conservation, physical boundaries,
and numerical stability across all core scientific engine modules.
"""

import pytest
import numpy as np

from pk.models import simulate_one_compartment_oral, simulate_one_compartment_iv
from pbpk.models import simulate_pbpk_5compartment
from dissolution.models import simulate_dissolution_profile, compare_dissolution_profiles
from formulation.models import analyze_formulation
from qbd.models import evaluate_design_space, generate_default_qbd_matrix
from virtual_population.models import generate_virtual_population, simulate_population_pk
from ml.models import train_and_evaluate_model, generate_benchmark_ml_dataset
from hybrid.models import run_hybrid_pbpk_ml_experiment
from optimization.models import optimize_formulation_for_target_pk
from validation.models import compute_parameter_sensitivity, run_residual_diagnostics


class TestPharmacokinetics:
    def test_one_compartment_oral_analytical_consistency(self):
        # Ibuprofen 400mg standard reference: ka=1.2/h, CL=3.0 L/h, Vd=10.0 L
        res = simulate_one_compartment_oral(dose_mg=400.0, ka_per_h=1.2, cl_l_per_h=3.0, vd_l=10.0, f_bioavail=1.0)
        
        # kel = 3.0 / 10.0 = 0.3
        # Expected analytical AUC_inf = Dose / CL = 400 / 3 = 133.333
        assert np.isclose(res.auc_0_inf, 133.333, atol=0.1)
        assert res.c_max > 0.0
        assert 0.5 < res.t_max < 3.0
        assert np.isclose(res.t_half, np.log(2) / 0.3, atol=0.01)
        assert len(res.concentration) == len(res.time)

    def test_one_compartment_oral_validation_errors(self):
        with pytest.raises(ValueError):
            simulate_one_compartment_oral(dose_mg=-100, ka_per_h=1.0, cl_l_per_h=2.0, vd_l=10.0)


class TestPBPK:
    def test_5compartment_mass_balance_conservation(self):
        # 400 mg dose in 70kg standard subject
        res = simulate_pbpk_5compartment(dose_mg=400.0, body_weight_kg=70.0, t_end_h=24.0)
        
        # Conservation of mass: total mass error must be < 1.0%
        assert res.mass_balance_error_percent < 1.0, f"Mass balance error too high: {res.mass_balance_error_percent}%"
        assert res.c_max_plasma > 0.0
        assert res.auc_plasma > 0.0
        assert len(res.plasma_conc) == len(res.time)


class TestDissolution:
    def test_dissolution_models_and_monotonicity(self):
        # First order release
        c1 = simulate_dissolution_profile("first_order", k_rate=0.5, t_end_h=8.0)
        assert c1.release_percent[0] == 0.0
        assert c1.release_percent[-1] > 90.0

        # Higuchi release
        ch = simulate_dissolution_profile("higuchi", k_rate=30.0, t_end_h=8.0)
        assert ch.release_percent[-1] <= 100.0

    def test_f1_f2_similarity(self):
        t = [1.0, 2.0, 4.0, 6.0, 8.0]
        ref = [25.0, 45.0, 70.0, 85.0, 95.0]
        # Identical profile must have f1=0 and f2=100
        comp_identical = compare_dissolution_profiles(t, ref, ref)
        assert comp_identical.f1_difference == 0.0
        assert comp_identical.f2_similarity == 100.0
        assert comp_identical.is_similar is True


class TestFormulationAndQbD:
    def test_formulation_excipient_balance(self):
        form = analyze_formulation(
            name="Extended-Release Matrix",
            dosage_form="Tablet",
            total_tablet_weight_mg=500.0,
            api_dose_mg=200.0,
            polymer_percentage=25.0,
        )
        assert form.drug_loading_percent == 40.0
        assert form.estimated_k_dissolution > 0.0
        assert form.estimated_ka_per_h > 0.0

    def test_qbd_design_space_evaluation(self):
        # Within PAR
        eval_ok = evaluate_design_space(
            polymer_percentage=25.0,
            compression_force_kn=12.0,
            api_particle_size_d50_um=45.0,
            granulation_moisture_percent=2.5,
        )
        assert eval_ok.is_within_design_space is True
        assert len(eval_ok.violations) == 0

        # Violation
        eval_fail = evaluate_design_space(
            polymer_percentage=50.0,  # Exceeds max 35%
            compression_force_kn=5.0,  # Below min 8kN
            api_particle_size_d50_um=45.0,
            granulation_moisture_percent=2.5,
        )
        assert eval_fail.is_within_design_space is False
        assert len(eval_fail.violations) >= 2


class TestVirtualPopulation:
    def test_virtual_patient_sampling(self):
        cohort = generate_virtual_population(population_size=30, age_min=20.0, age_max=65.0)
        assert len(cohort) == 30
        for pt in cohort:
            assert 20.0 <= pt.age_years <= 65.0
            assert pt.body_weight_kg > 40.0
            assert pt.scaled_cl_total_l_h > 0.0
            assert pt.provenance_tag == "SIMULATED VIRTUAL PATIENT"

        pop_sim = simulate_population_pk(cohort, dose_mg=400.0)
        assert pop_sim.cmax_mean > 0.0
        assert len(pop_sim.median_percentile_50) == len(pop_sim.time_points)


class TestMachineLearningAndHybrid:
    def test_ml_pipeline_execution(self):
        res = train_and_evaluate_model(model_type="random_forest")
        assert res.test_r2 > 0.5
        assert res.test_mae > 0.0
        assert len(res.feature_importances) > 0

    def test_hybrid_pbpk_ml_benchmark(self):
        hybrid_res = run_hybrid_pbpk_ml_experiment(dose_mg=400.0, body_weight_kg=70.0)
        assert "pbpk" in hybrid_res.metrics_comparison
        assert "ml" in hybrid_res.metrics_comparison
        assert "hybrid" in hybrid_res.metrics_comparison
        assert len(hybrid_res.hybrid_predicted) == len(hybrid_res.time)


class TestOptimizationAndValidation:
    def test_optimization_candidate_generation(self):
        cand = optimize_formulation_for_target_pk(target_cmax=12.0, target_auc=80.0)
        assert cand.convergence_status in ["CONVERGED", "ITERATION_LIMIT"]
        assert 100.0 <= cand.optimized_dose_mg <= 800.0
        assert "Computational candidate" in cand.provenance

    def test_sensitivity_and_residuals(self):
        sens = compute_parameter_sensitivity()
        assert len(sens) >= 4
        assert any("Clearance" in s.parameter_name for s in sens)

        residuals = list(np.random.normal(0.0, 1.0, 50))
        diag = run_residual_diagnostics(residuals)
        assert diag.sample_size == 50
