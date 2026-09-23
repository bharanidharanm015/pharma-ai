"""
PHARMA AI — Scientific Engine: Quality by Design (QbD) Module
Implements ICH Q8(R2) Quality by Design workflow: QTPP, CQAs, CMAs, CPPs,
risk matrix evaluation (RPN = S x O x D), and multidimensional design space verification.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any


@dataclass
class QBDElement:
    id: str
    category: str  # "QTPP", "CQA", "CMA", "CPP"
    name: str
    target_spec: str
    current_value: Optional[float] = None
    tolerance_min: Optional[float] = None
    tolerance_max: Optional[float] = None
    unit: Optional[str] = None
    criticality: str = "High"  # "Low", "Medium", "High", "Critical"


@dataclass
class RiskMatrixItem:
    parameter: str
    cqa_impacted: str
    severity: int     # 1-5
    occurrence: int   # 1-5
    detectability: int  # 1-5
    rpn: int          # S * O * D
    risk_level: str   # "Low" (<30), "Medium" (30-60), "High" (>60)
    mitigation_strategy: str


@dataclass
class DesignSpaceEvaluation:
    is_within_design_space: bool
    risk_score: float
    violations: List[str]
    parameters_checked: Dict[str, Any]
    design_space_summary: str


def evaluate_design_space(
    polymer_percentage: float,
    compression_force_kn: float,
    api_particle_size_d50_um: float,
    granulation_moisture_percent: float,
) -> DesignSpaceEvaluation:
    """
    Evaluates whether formulation and process parameters fall within the
    proven acceptable ranges (PAR) of the validated design space.
    """
    violations = []

    # 1. Polymer fraction: Proven range [15.0%, 35.0%]
    if polymer_percentage < 15.0:
        violations.append(f"Polymer concentration ({polymer_percentage}%) below minimum PAR (15.0%). Risk of burst release.")
    elif polymer_percentage > 35.0:
        violations.append(f"Polymer concentration ({polymer_percentage}%) exceeds maximum PAR (35.0%). Risk of incomplete dissolution.")

    # 2. Compression force: Proven range [8.0 kN, 18.0 kN]
    if compression_force_kn < 8.0:
        violations.append(f"Compression force ({compression_force_kn} kN) too low (<8.0 kN). Risk of high friability / tablet breakage.")
    elif compression_force_kn > 18.0:
        violations.append(f"Compression force ({compression_force_kn} kN) too high (>18.0 kN). Risk of tablet capping and retarded disintegration.")

    # 3. Particle size D50: Proven range [20.0 um, 80.0 um]
    if api_particle_size_d50_um < 20.0:
        violations.append(f"API D50 ({api_particle_size_d50_um} um) below 20 um. Electrostatic clumping and poor powder flow risk.")
    elif api_particle_size_d50_um > 80.0:
        violations.append(f"API D50 ({api_particle_size_d50_um} um) exceeds 80 um. Risk of slow dissolution rate failure.")

    # 4. Moisture content: Proven range [1.5%, 3.5%]
    if granulation_moisture_percent < 1.5:
        violations.append(f"Moisture ({granulation_moisture_percent}%) below 1.5%. Risk of friability and poor compressibility.")
    elif granulation_moisture_percent > 3.5:
        violations.append(f"Moisture ({granulation_moisture_percent}%) exceeds 3.5%. Risk of hydrolysis, sticking, and microbial instability.")

    is_within = len(violations) == 0
    # Normalized risk score: 0 (optimal) to 100 (high risk)
    base_risk = len(violations) * 25.0
    risk_score = min(100.0, max(5.0, base_risk))

    if is_within:
        summary = "All critical material attributes and process parameters are strictly within the Proven Acceptable Range (PAR) design space."
    else:
        summary = f"Design space boundary violation: {len(violations)} parameter(s) out of specification. Formulation adjustments required."

    return DesignSpaceEvaluation(
        is_within_design_space=is_within,
        risk_score=risk_score,
        violations=violations,
        parameters_checked={
            "polymer_percentage": polymer_percentage,
            "compression_force_kn": compression_force_kn,
            "api_particle_size_d50_um": api_particle_size_d50_um,
            "granulation_moisture_percent": granulation_moisture_percent,
        },
        design_space_summary=summary,
    )


def generate_default_qbd_matrix() -> Dict[str, Any]:
    """
    Returns standard ICH Q8 QbD matrix elements and risk assessment items.
    """
    qtpp = [
        {"id": "QTPP-1", "name": "Dosage Form & Route", "target": "Oral Extended-Release Matrix Tablet", "criticality": "Critical"},
        {"id": "QTPP-2", "name": "Target In-Vivo Release", "target": "12-hour sustained release (80% released at 10-12h)", "criticality": "Critical"},
        {"id": "QTPP-3", "name": "Bioavailability Target", "target": "AUC within 80-125% of reference standard", "criticality": "Critical"},
        {"id": "QTPP-4", "name": "Stability / Shelf-Life", "target": ">= 24 months at 25C / 60% RH", "criticality": "High"},
    ]

    cqas = [
        {"id": "CQA-1", "name": "Dissolution at 2h", "target_spec": "20 - 40%", "criticality": "Critical"},
        {"id": "CQA-2", "name": "Dissolution at 8h", "target_spec": ">= 75%", "criticality": "Critical"},
        {"id": "CQA-3", "name": "Content Uniformity", "target_spec": "95.0% - 105.0% (AV < 15.0)", "criticality": "Critical"},
        {"id": "CQA-4", "name": "Tablet Friability", "target_spec": "< 0.8% weight loss", "criticality": "High"},
        {"id": "CQA-5", "name": "Hardness / Breaking Force", "target_spec": "80 - 130 N", "criticality": "Medium"},
    ]

    cmas = [
        {"id": "CMA-1", "name": "API Particle Size D50", "target_spec": "35 - 55 um", "criticality": "High"},
        {"id": "CMA-2", "name": "Polymer Concentration (HPMC)", "target_spec": "20.0 - 30.0% w/w", "criticality": "Critical"},
        {"id": "CMA-3", "name": "Binder Viscosity Grade", "target_spec": "3000 - 5000 mPa.s", "criticality": "Medium"},
        {"id": "CMA-4", "name": "Lubricant Fraction", "target_spec": "0.5 - 1.5% w/w", "criticality": "Medium"},
    ]

    cpps = [
        {"id": "CPP-1", "name": "Main Compression Force", "target_spec": "10.0 - 15.0 kN", "criticality": "Critical"},
        {"id": "CPP-2", "name": "Turret Rotation Speed", "target_spec": "25 - 45 RPM", "criticality": "Medium"},
        {"id": "CPP-3", "name": "Fluid Bed Granulation Moisture", "target_spec": "2.0 - 3.0% w/w", "criticality": "High"},
    ]

    risks = [
        RiskMatrixItem("Polymer Concentration", "Dissolution at 8h", 5, 3, 2, 30, "Medium", "Tight weight tolerance on polymer addition").__dict__,
        RiskMatrixItem("API Particle Size D50", "Dissolution at 2h", 4, 4, 3, 48, "Medium", "Laser diffraction screening of incoming API lots").__dict__,
        RiskMatrixItem("Compression Force", "Tablet Friability", 4, 2, 2, 16, "Low", "In-line automatic compression force monitoring").__dict__,
        RiskMatrixItem("Granulation Moisture", "Content Uniformity", 4, 3, 3, 36, "Medium", "NIR moisture sensor during drying cycle").__dict__,
    ]

    return {
        "qtpp": qtpp,
        "cqas": cqas,
        "cmas": cmas,
        "cpps": cpps,
        "risk_matrix": risks,
    }
