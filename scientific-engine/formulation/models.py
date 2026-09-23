"""
PHARMA AI — Scientific Engine: Formulation Science Module
Models excipient fractions, drug loading, particle size distributions (D10, D50, D90),
and computes mechanistic dissolution and absorption rate constants based on Noyes-Whitney principles.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
import numpy as np


@dataclass
class ExcipientComponent:
    name: str
    role: str  # "API", "Polymer", "Binder", "Disintegrant", "Lubricant", "Filler"
    percentage_w_w: float
    grade: Optional[str] = None


@dataclass
class FormulationProfile:
    formulation_id: str
    name: str
    dosage_form: str
    total_tablet_weight_mg: float
    api_dose_mg: float
    drug_loading_percent: float
    components: List[Dict[str, Any]]
    d50_um: float
    polymer_percentage: float
    estimated_k_dissolution: float
    estimated_ka_per_h: float
    percolation_threshold_status: str
    metadata: Dict[str, Any] = field(default_factory=dict)


def analyze_formulation(
    name: str,
    dosage_form: str,
    total_tablet_weight_mg: float,
    api_dose_mg: float,
    polymer_percentage: float = 25.0,
    disintegrant_percentage: float = 4.0,
    lubricant_percentage: float = 1.0,
    binder_filler_percentage: Optional[float] = None,
    d50_particle_size_um: float = 45.0,
    base_api_solubility_mg_ml: float = 0.5,
    base_intrinsic_ka: float = 1.2,
) -> FormulationProfile:
    """
    Validates excipient balance and computes mechanistic kinetic parameters.
    """
    if total_tablet_weight_mg <= 0 or api_dose_mg <= 0:
        raise ValueError("Tablet weight and API dose must be strictly positive.")

    drug_loading = (api_dose_mg / total_tablet_weight_mg) * 100.0
    if drug_loading > 90.0:
        raise ValueError(f"Drug loading {drug_loading:.1f}% exceeds practical compression limit (90%).")

    other_excipients = polymer_percentage + disintegrant_percentage + lubricant_percentage
    if binder_filler_percentage is None:
        binder_filler_percentage = max(0.0, 100.0 - (drug_loading + other_excipients))

    total_pct = drug_loading + polymer_percentage + disintegrant_percentage + lubricant_percentage + binder_filler_percentage
    if not np.isclose(total_pct, 100.0, atol=0.5):
        # Normalize filler
        binder_filler_percentage = max(0.0, 100.0 - (drug_loading + polymer_percentage + disintegrant_percentage + lubricant_percentage))

    # Percolation threshold for hydrophilic matrix tablets (typically ~20-25% v/v or w/w for HPMC)
    if polymer_percentage >= 22.0:
        percolation = "Above Gel Percolation Threshold: Coherent gel layer forms, sustaining drug release."
    elif polymer_percentage >= 10.0:
        percolation = "Near Percolation Threshold: Partial gel network with erosion-assisted release."
    else:
        percolation = "Below Percolation Threshold: Rapid disintegration / immediate release behavior."

    # Noyes-Whitney dissolution constant estimation:
    # k_diss ~ (Solubility / D50) * exp(-alpha * polymer_ratio) * (1 + beta * disintegrant)
    size_factor = 45.0 / max(5.0, d50_particle_size_um)  # normalized to 45um
    polymer_retardation = np.exp(-0.06 * polymer_percentage)
    disintegrant_boost = 1.0 + (0.05 * disintegrant_percentage)

    estimated_k_diss = float(0.8 * size_factor * polymer_retardation * disintegrant_boost * max(0.2, base_api_solubility_mg_ml))
    # Bound estimated k
    estimated_k_diss = max(0.02, min(5.0, estimated_k_diss))

    # Effective in-vivo absorption rate constant (ka) is modulated by dissolution limitation
    estimated_ka = float(base_intrinsic_ka * (estimated_k_diss / (estimated_k_diss + 0.4)))
    estimated_ka = max(0.05, min(3.5, estimated_ka))

    components_list = [
        {"name": "Active Pharmaceutical Ingredient (API)", "role": "API", "percentage_w_w": round(drug_loading, 2)},
        {"name": "Controlled-Release Polymer (HPMC)", "role": "Polymer", "percentage_w_w": round(polymer_percentage, 2)},
        {"name": "Superdisintegrant (Croscarmellose)", "role": "Disintegrant", "percentage_w_w": round(disintegrant_percentage, 2)},
        {"name": "Lubricant (Magnesium Stearate)", "role": "Lubricant", "percentage_w_w": round(lubricant_percentage, 2)},
        {"name": "Microcrystalline Cellulose / Filler", "role": "Filler", "percentage_w_w": round(binder_filler_percentage, 2)},
    ]

    return FormulationProfile(
        formulation_id=f"FORM-{abs(hash(name)) % 100000:05d}",
        name=name,
        dosage_form=dosage_form,
        total_tablet_weight_mg=round(total_tablet_weight_mg, 1),
        api_dose_mg=round(api_dose_mg, 1),
        drug_loading_percent=round(drug_loading, 2),
        components=components_list,
        d50_um=round(d50_particle_size_um, 2),
        polymer_percentage=round(polymer_percentage, 2),
        estimated_k_dissolution=round(estimated_k_diss, 4),
        estimated_ka_per_h=round(estimated_ka, 4),
        percolation_threshold_status=percolation,
        metadata={"provenance": "SIMULATED FORMULATION", "model": "Noyes-Whitney & Percolation Theory"},
    )
