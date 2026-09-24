/**
 * PHARMA AI — Symptom Correlation & Research Assessment Engine
 * Mechanistic & Algorithmic Correlation for Researcher-Entered Symptoms.
 * Strictly adheres to safety constraints:
 * 1. Never claims definitive medical diagnosis.
 * 2. Never provides guaranteed cure timelines.
 * 3. Highlights red-flag symptoms and explicit criteria for professional care.
 */

import { PossibleCondition, SymptomAssessment } from "../types";

export interface ClinicalConditionDefinition {
  name: string;
  primary_symptoms: string[];
  secondary_symptoms: string[];
  reasoning_template: string;
  red_flags: string[];
  general_guidance: string;
  when_to_seek_care: string;
}

export const CLINICAL_CONDITIONS_CATALOG: ClinicalConditionDefinition[] = [
  {
    name: "Acute Upper Respiratory Tract Presentation (Viral Rhinopharyngitis)",
    primary_symptoms: ["Cough", "Sore Throat", "Runny Nose", "Sneezing", "Nasal Congestion"],
    secondary_symptoms: ["Mild Fever", "Fatigue", "Headache", "Mild Body Aches"],
    reasoning_template:
      "Symptom cluster (rhinorrhea, nasal congestion, pharyngeal irritation, and cough) aligns with classical acute upper airway viral mucosal inflammation.",
    red_flags: [
      "Stridor or audible wheezing on inspiration",
      "Inability to swallow liquids or saliva",
      "High persistent fever (>39°C / 102.2°F) unresponsive to antipyretics",
    ],
    general_guidance:
      "Maintain abundant oral hydration, saline nasal irrigation, adequate sleep, and humidified air. Non-pharmacological throat lozenges may soothe irritation.",
    when_to_seek_care:
      "Consider professional medical evaluation if symptoms worsen after 7 days, if breathing becomes difficult, or if severe unilateral throat pain develops.",
  },
  {
    name: "Allergic Rhinitis / Upper Airway Hypersensitivity",
    primary_symptoms: ["Sneezing", "Runny Nose", "Itchy Eyes", "Nasal Congestion"],
    secondary_symptoms: ["Fatigue", "Clear Nasal Discharge", "Headache"],
    reasoning_template:
      "Prominent paroxysmal sneezing, clear rhinorrhea, and ocular/nasal pruritus without high fever strongly correspond to IgE-mediated environmental allergen exposure.",
    red_flags: [
      "Associated facial swelling (angioedema) or lip/tongue edema",
      "Sudden shortness of breath or audible chest wheeze",
    ],
    general_guidance:
      "Identify and minimize exposure to known environmental triggers (pollen, dust mites, pet dander). Use HEPA air filtration and saline nasal rinses.",
    when_to_seek_care:
      "Seek medical consultation if symptoms severely impair sleep or quality of life, or if wheezing or respiratory distress emerges.",
  },
  {
    name: "Acute Bronchial Irritation / Lower Airway Presentation",
    primary_symptoms: ["Persistent Cough", "Chest Discomfort", "Sputum Production"],
    secondary_symptoms: ["Fatigue", "Low-Grade Fever", "Mild Shortness of Breath", "Muscle Aches"],
    reasoning_template:
      "Dominant productive or dry cough accompanied by retrosternal chest discomfort and constitutional malaise suggests inflammatory tracheobronchial involvement.",
    red_flags: [
      "Hemoptysis (coughing up blood or blood-streaked sputum)",
      "Severe resting dyspnea or oxygen desaturation",
      "Resting tachypnea (>24 breaths/min) or confusion",
    ],
    general_guidance:
      "Avoid smoke, fumes, and cold dry air. Ensure elevated head position during sleep and warm steam inhalation.",
    when_to_seek_care:
      "Prompt medical evaluation is indicated if cough persists beyond 3 weeks, if fever exceeds 38.5°C, or if chest pain is pleuritic and sharp.",
  },
  {
    name: "Tension-Type / Stress-Related Cephalea",
    primary_symptoms: ["Headache", "Neck Stiffness / Soreness", "Scalp Tenderness"],
    secondary_symptoms: ["Fatigue", "Difficulty Concentrating", "Mild Light Sensitivity"],
    reasoning_template:
      "Bilateral, pressing, band-like dull headache without focal neurological deficits corresponds to myofascial pericranial muscle contraction.",
    red_flags: [
      "'Thunderclap' headache with sudden maximal intensity within seconds",
      "Headache with fever, neck rigidity, and altered mental state (meningeal signs)",
      "New focal neurological deficit (limb weakness, speech impairment, vision loss)",
    ],
    general_guidance:
      "Practice ergonomic posture, periodic screen breaks, hydration, gentle neck muscle stretching, and relaxation techniques.",
    when_to_seek_care:
      "Immediate urgent medical evaluation required for sudden explosive headache, headache following head trauma, or headache with neurological changes.",
  },
  {
    name: "Acute Gastrointestinal Irritation / Enteric Presentation",
    primary_symptoms: ["Nausea", "Vomiting", "Diarrhea", "Abdominal Cramping"],
    secondary_symptoms: ["Low-Grade Fever", "Loss of Appetite", "Fatigue", "Dizziness"],
    reasoning_template:
      "Combination of acute nausea, vomiting, watery bowel movements, and diffuse abdominal cramping reflects acute gastrointestinal mucosal inflammation.",
    red_flags: [
      "Hematemesis (coffee-ground emesis or bright red blood)",
      "Melena (black tarry stools) or hematochezia",
      "Inability to retain liquids for >24 hours with signs of severe dehydration",
      "Severe, rigid, localized abdominal tenderness with guarding",
    ],
    general_guidance:
      "Prioritize oral rehydration solutions (ORS) with balanced electrolytes taken in small, frequent sips. Avoid fatty, spicy, or high-sugar foods.",
    when_to_seek_care:
      "Seek urgent clinical evaluation if signs of severe dehydration emerge (postural dizziness, dry mucus membranes, low urine output) or if severe localized abdominal pain develops.",
  },
  {
    name: "Musculoskeletal Strain / Overuse Presentation",
    primary_symptoms: ["Joint Pain", "Muscle Aches", "Localized Soreness", "Stiffness"],
    secondary_symptoms: ["Mild Swelling", "Reduced Range of Motion", "Fatigue"],
    reasoning_template:
      "Localized musculoskeletal pain exacerbated by movement without systemic inflammatory symptoms suggests mechanical muscle strain or ligamentous stress.",
    red_flags: [
      "Hot, swollen, erythematous single joint with systemic fever (septic arthritis suspicion)",
      "Inability to bear any weight on the affected limb",
      "Associated numbness, tingling, or radiating motor weakness",
    ],
    general_guidance:
      "Employ relative rest, ice application for acute swelling, gentle range-of-motion stretching, and appropriate ergonomic modifications.",
    when_to_seek_care:
      "Medical assessment is warranted if joint swelling is severe, if pain does not improve after 7 days, or if accompanied by unexplained fever.",
  },
];

export function analyzeSymptoms(symptoms: string[]): SymptomAssessment {
  const normalizedUserSymptoms = symptoms.map((s) => s.trim().toLowerCase());

  const matchedConditions: PossibleCondition[] = [];
  const detectedRedFlags: string[] = [];

  for (const cat of CLINICAL_CONDITIONS_CATALOG) {
    let matchScore = 0;
    const totalPotential = cat.primary_symptoms.length * 2 + cat.secondary_symptoms.length;

    // Check primary symptoms
    for (const ps of cat.primary_symptoms) {
      if (normalizedUserSymptoms.some((us) => us.includes(ps.toLowerCase()) || ps.toLowerCase().includes(us))) {
        matchScore += 2;
      }
    }

    // Check secondary symptoms
    for (const ss of cat.secondary_symptoms) {
      if (normalizedUserSymptoms.some((us) => us.includes(ss.toLowerCase()) || ss.toLowerCase().includes(us))) {
        matchScore += 1;
      }
    }

    if (matchScore > 0) {
      const percentage = Math.min(95, Math.round((matchScore / totalPotential) * 100));
      let match_level: "High Correlation" | "Moderate Correlation" | "Possible" = "Possible";
      if (percentage >= 60) match_level = "High Correlation";
      else if (percentage >= 35) match_level = "Moderate Correlation";

      matchedConditions.push({
        condition: cat.name,
        match_level,
        match_percentage: percentage,
        reasoning: cat.reasoning_template,
        red_flag_warnings: cat.red_flags,
        supportive_guidance: cat.general_guidance,
        when_to_seek_care: cat.when_to_seek_care,
      });

      // Add red flags for warning overview
      for (const rf of cat.red_flags) {
        if (!detectedRedFlags.includes(rf)) {
          detectedRedFlags.push(rf);
        }
      }
    }
  }

  // Sort matched conditions by match percentage descending
  matchedConditions.sort((a, b) => b.match_percentage - a.match_percentage);

  // If no specific match was found, return a general supportive assessment
  if (matchedConditions.length === 0) {
    matchedConditions.push({
      condition: "Undifferentiated Symptom Presentation",
      match_level: "Possible",
      match_percentage: 20,
      reasoning:
        "The entered symptoms do not correspond cleanly to a single standard outpatient presentation. Symptoms may represent multiple concurrent factors.",
      red_flag_warnings: [
        "Sudden severe chest pain, shortness of breath, or loss of consciousness",
        "Persistent high fever (>38.5°C) or severe dehydration",
      ],
      supportive_guidance:
        "Rest, maintain fluid balance, monitor temperature and symptom progression, and avoid strenuous exertion.",
      when_to_seek_care:
        "Consult a qualified healthcare practitioner for an individualized clinical history, physical examination, and diagnostic investigation.",
    });
  }

  return {
    symptoms_analyzed: symptoms,
    matched_conditions: matchedConditions,
    red_flags_present: detectedRedFlags,
    general_precautions: [
      "This analysis is a computational research simulation and does not establish a clinical diagnosis.",
      "Never alter prescribed medications or treatment regimens without direct medical consultation.",
      "If severe acute symptoms occur, seek emergency medical care immediately (Dial 112).",
    ],
    disclaimer:
      "Research simulation — not clinically validated. Does not constitute medical diagnosis or guarantee cure timelines.",
  };
}
