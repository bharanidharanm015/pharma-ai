/**
 * PHARMA AI — Documented Pharmaceutical Reference Data
 * Contains reference monographs and documented interactions with explicit provenance.
 * Sources: WHO Model List of Essential Medicines (23rd List, 2023), US FDA Drug Labels,
 * Goodman & Gilman's Pharmacological Basis of Therapeutics (14th Ed.), and PubMed.
 * Strictly NO fabricated data or fake interaction claims.
 */

import { MedicineInfo, DrugInteractionPair } from "../types";

export const DOCUMENTED_MEDICINES: MedicineInfo[] = [
  {
    id: "MED-001",
    generic_name: "Ibuprofen",
    example_brand_names: ["Advil", "Motrin", "Brufen", "Ibugesic"],
    drug_class: "Non-Steroidal Anti-Inflammatory Drug (NSAID)",
    common_uses: [
      "Relief of mild to moderate musculoskeletal and dental pain",
      "Reduction of pyrexia (fever)",
      "Management of inflammatory arthritis (osteoarthritis, rheumatoid arthritis)",
    ],
    common_side_effects: [
      "Dyspepsia and epigastric discomfort",
      "Nausea and heartburn",
      "Mild headache",
      "Fluid retention and mild peripheral edema",
    ],
    important_warnings: [
      "Gastrointestinal Risk: Potential for severe gastric mucosal ulceration, bleeding, and perforation.",
      "Cardiovascular Risk: May increase risk of serious cardiovascular thrombotic events with prolonged high doses.",
      "Renal Impairment: Inward prostaglandin inhibition can cause acute renal perfusion decline in susceptible patients.",
    ],
    drug_interactions: [
      "ACE Inhibitors / ARBs: Attenuation of antihypertensive efficacy and enhanced nephrotoxic risk.",
      "Aspirin / Anticoagulants: Increased risk of major gastrointestinal and systemic bleeding.",
      "Methotrexate: Decreased methotrexate renal clearance resulting in toxicity.",
    ],
    precautions: [
      "Avoid in patients with active peptic ulcer disease or severe renal impairment.",
      "Contraindicated in third trimester of pregnancy due to premature closure of ductus arteriosus.",
      "Use lowest effective dose for shortest necessary duration.",
    ],
    treatment_duration_notes:
      "Typically 3 to 5 days for acute pain or fever. Re-evaluate if symptoms persist beyond 7 days.",
    provenance: "WHO Model List of Essential Medicines (2023); US FDA Monograph (NDA 018985)",
  },
  {
    id: "MED-002",
    generic_name: "Metformin",
    example_brand_names: ["Glucophage", "Glycomet", "Riomet", "Fortamet"],
    drug_class: "Biguanide Antihyperglycemic",
    common_uses: [
      "First-line glycemic control in Type 2 Diabetes Mellitus",
      "Investigational adjunct in Polycystic Ovary Syndrome (PCOS) insulin resistance",
    ],
    common_side_effects: [
      "Gastrointestinal distress: diarrhea, nausea, abdominal cramping",
      "Transient metallic dysgeusia (taste disturbance)",
      "Vitamin B12 malabsorption with chronic long-term usage",
    ],
    important_warnings: [
      "Lactic Acidosis: Rare but life-threatening metabolic complication, particularly in severe renal failure, acute heart failure, or hypoxemia.",
    ],
    drug_interactions: [
      "Iodinated Radiocontrast Agents: Risk of acute renal failure and secondary metformin accumulation.",
      "Carbonic Anhydrase Inhibitors: Additive risk of metabolic acidosis.",
      "Cimetidine: Increases metformin peak plasma concentrations via renal organic cation transporter competition.",
    ],
    precautions: [
      "Regularly assess renal function (eGFR); contraindicated if eGFR < 30 mL/min/1.73m².",
      "Withhold prior to and 48 hours after intravascular iodinated contrast procedures.",
      "Caution in chronic hepatic impairment and excessive alcohol consumption.",
    ],
    treatment_duration_notes:
      "Chronic maintenance therapy under continuous endocrinological and HbA1c surveillance.",
    provenance: "WHO Essential Medicines (2023); Goodman & Gilman 14th Ed. (Ch. 48); FDA Label (NDA 020357)",
  },
  {
    id: "MED-003",
    generic_name: "Acetaminophen (Paracetamol)",
    example_brand_names: ["Tylenol", "Panadol", "Calpol", "Dolo", "Crocin"],
    drug_class: "Centrally Acting Analgesic & Antipyretic",
    common_uses: [
      "First-line treatment for mild to moderate non-inflammatory pain",
      "Fever reduction in adults and pediatric populations",
      "First-line symptomatic management for knee/hip osteoarthritis pain",
    ],
    common_side_effects: [
      "Generally very well tolerated at therapeutic doses",
      "Rare: mild nausea, pruritus, transient transaminase shifts",
    ],
    important_warnings: [
      "Severe Hepatotoxicity: Acute hepatic necrosis can occur with dosages exceeding 4,000 mg/24 hours in adults or with concomitant heavy alcohol consumption.",
      "Do not combine multiple multi-ingredient cold/pain products containing acetaminophen.",
    ],
    drug_interactions: [
      "Warfarin: High chronic doses (>2,000 mg/day) may modestly augment INR.",
      "Isoniazid: Concurrent use may heighten risk of acetaminophen hepatotoxicity.",
      "Alcohol: Chronic alcohol abuse enhances CYP2E1 conversion to NAPQI toxic metabolite.",
    ],
    precautions: [
      "Adjust downward in severe hepatic impairment, chronic alcoholism, or severe malnutrition.",
      "Check pediatric formulations carefully to prevent concentration-related dosing errors.",
    ],
    treatment_duration_notes:
      "As needed for acute symptoms. Seek medical advice if fever persists >3 days or pain >5 days.",
    provenance: "WHO Model List of Essential Medicines; US FDA Acetaminophen Safety Review",
  },
  {
    id: "MED-004",
    generic_name: "Atorvastatin",
    example_brand_names: ["Lipitor", "Atorva", "Storvas", "Atocor"],
    drug_class: "HMG-CoA Reductase Inhibitor (Statin)",
    common_uses: [
      "Primary hypercholesterolemia and mixed dyslipidemia reduction",
      "Primary and secondary prevention of major adverse cardiovascular events (MACE)",
    ],
    common_side_effects: [
      "Myalgia and musculoskeletal discomfort",
      "Mild elevation in serum hepatic transaminases",
      "Headache and dyspepsia",
    ],
    important_warnings: [
      "Myopathy / Rhabdomyolysis: Rare risk of acute skeletal muscle breakdown with myoglobinuria and acute renal failure.",
      "Contraindicated in active liver disease or unexplained persistent transaminase elevations.",
    ],
    drug_interactions: [
      "Strong CYP3A4 Inhibitors (Clarithromycin, Itraconazole, Ketoconazole): Greatly increase statin plasma concentrations and myopathy risk.",
      "Cyclosporine / Gemfibrozil: Substantially elevate rhabdomyolysis frequency.",
      "Grapefruit Juice: High daily volumes (>1 liter) inhibit intestinal CYP3A4, increasing bioavailability.",
    ],
    precautions: [
      "Monitor baseline liver enzymes prior to treatment initiation.",
      "Instruct patients to immediately report unexplained muscle pain, tenderness, or weakness.",
      "Contraindicated in pregnancy and nursing mothers.",
    ],
    treatment_duration_notes:
      "Long-term cardiovascular prevention requiring periodic lipid profile monitoring.",
    provenance: "WHO Essential Medicines (Cardiovascular Medicines); FDA NDA 020702 Monograph",
  },
  {
    id: "MED-005",
    generic_name: "Amoxicillin",
    example_brand_names: ["Amoxil", "Mox", "Novamox", "Trimox"],
    drug_class: "Moderate-Spectrum Aminopenicillin Antibiotic",
    common_uses: [
      "Susceptible bacterial infections of upper and lower respiratory tract",
      "Acute otitis media and bacterial sinusitis",
      "Streptococcal pharyngitis",
      "Component of Helicobacter pylori eradication regimens",
    ],
    common_side_effects: [
      "Diarrhea and gastrointestinal upset",
      "Maculopapular cutaneous rash",
      "Nausea and vomiting",
      "Oral or vaginal candidiasis overgrowth",
    ],
    important_warnings: [
      "Hypersensitivity: Anaphylaxis and severe allergic angioedema can occur in penicillin-allergic patients.",
      "Clostridioides difficile-associated diarrhea (CDAD) can manifest weeks after therapy.",
    ],
    drug_interactions: [
      "Allopurinol: Concomitant administration markedly increases risk of allergic skin rash.",
      "Oral Anticoagulants (Warfarin): May alter gut flora and prolong prothrombin time.",
      "Methotrexate: Inhibits renal tubular excretion of methotrexate.",
    ],
    precautions: [
      "Carefully screen for history of severe beta-lactam hypersensitivity.",
      "Dose adjustment required in severe renal impairment (eGFR < 30 mL/min).",
      "Instruct patient to complete full prescribed regimen to prevent microbial resistance.",
    ],
    treatment_duration_notes:
      "Typically 5 to 10 days depending on microbiological indication and clinical response.",
    provenance: "WHO Essential Medicines (Access Antibiotic Group); USP Reference Monograph",
  },
  {
    id: "MED-006",
    generic_name: "Lisinopril",
    example_brand_names: ["Zestril", "Prinivil", "Lipril", "Listril"],
    drug_class: "Angiotensin-Converting Enzyme (ACE) Inhibitor",
    common_uses: [
      "Management of essential and secondary hypertension",
      "Adjunctive therapy in heart failure with reduced ejection fraction (HFrEF)",
      "Hemodynamic support following acute myocardial infarction",
      "Diabetic nephropathy renal preservation",
    ],
    common_side_effects: [
      "Dry, non-productive persistent bradykinin-mediated cough",
      "Dizziness and postural lightheadedness",
      "Hyperkalemia",
      "Serum creatinine elevation during initial initiation",
    ],
    important_warnings: [
      "Boxed Warning: Fetal Toxicity. Can cause fetal harm and mortality; discontinue immediately if pregnancy is detected.",
      "Angioedema: Potentially fatal swelling of face, lips, tongue, glottis, and larynx.",
    ],
    drug_interactions: [
      "NSAIDs (Ibuprofen, Naproxen): Blunts blood pressure reduction and compounds acute renal impairment risk.",
      "Potassium-Sparing Diuretics / Potassium Supplements: Severe hyperkalemia risk.",
      "Lithium: Decreased renal lithium excretion causing toxicity.",
    ],
    precautions: [
      "Monitor serum potassium, blood urea nitrogen (BUN), and serum creatinine.",
      "Avoid in bilateral renal artery stenosis.",
    ],
    treatment_duration_notes:
      "Long-term chronic therapy with regular blood pressure and laboratory evaluation.",
    provenance: "WHO Model List of Essential Medicines; US FDA Package Insert (NDA 019777)",
  },
  {
    id: "MED-007",
    generic_name: "Omeprazole",
    example_brand_names: ["Prilosec", "Omez", "Losec", "Ocid"],
    drug_class: "Proton Pump Inhibitor (PPI)",
    common_uses: [
      "Symptomatic gastroesophageal reflux disease (GERD)",
      "Healing and prevention of gastric and duodenal peptic ulcers",
      "Eradication of Helicobacter pylori in triple-therapy regimens",
      "Zollinger-Ellison hypersecretory syndrome",
    ],
    common_side_effects: [
      "Headache",
      "Abdominal pain, flatulence, and diarrhea",
      "Constipation and mild nausea",
    ],
    important_warnings: [
      "Long-Term Risks: Prolonged administration (>1 year) associated with hypomagnesemia, vitamin B12 deficiency, and increased risk of osteoporotic fractures.",
      "Infectious Risk: Gastric acid suppression increases vulnerability to C. difficile enteritis.",
    ],
    drug_interactions: [
      "Clopidogrel: CYP2C19 competitive inhibition reduces clopidogrel bioactivation.",
      "Ketoconazole / Iron Salts: Reduced absorption due to elevated intragastric pH.",
      "Methotrexate: PPIs may elevate and prolong methotrexate serum levels.",
    ],
    precautions: [
      "Administer 30 to 60 minutes prior to a meal for optimal proton pump inhibition.",
      "Symptomatic response does not preclude presence of underlying gastric malignancy.",
    ],
    treatment_duration_notes:
      "Shortest duration necessary (typically 4 to 8 weeks for ulceration/esophagitis).",
    provenance: "WHO Essential Medicines (Gastrointestinal Medicines); FDA Label (NDA 019810)",
  },
  {
    id: "MED-008",
    generic_name: "Cetirizine",
    example_brand_names: ["Zyrtec", "Cetzine", "Alerid", "Cetriz"],
    drug_class: "Second-Generation H1-Receptor Antagonist",
    common_uses: [
      "Relief of symptoms associated with seasonal and perennial allergic rhinitis",
      "Management of chronic idiopathic urticaria and pruritus",
    ],
    common_side_effects: [
      "Mild somnolence or drowsiness (dose-related)",
      "Dry mouth (xerostomia)",
      "Fatigue and mild pharyngitis",
    ],
    important_warnings: [
      "Central Nervous System Depression: Additive somnolence with alcohol or other sedative-hypnotic agents.",
    ],
    drug_interactions: [
      "CNS Depressants / Alcohol: Increased impairment of alertness and motor performance.",
      "Theophylline: Modest reduction in cetirizine clearance.",
    ],
    precautions: [
      "Caution when driving or operating machinery if drowsiness occurs.",
      "Dose adjustment recommended in moderate to severe renal failure.",
    ],
    treatment_duration_notes:
      "Administer as needed during allergen exposure or for defined symptomatic periods.",
    provenance: "WHO Essential Medicines List; US FDA Monograph (NDA 020199)",
  },
  {
    id: "MED-009",
    generic_name: "Azithromycin",
    example_brand_names: ["Zithromax", "Azithral", "Azee", "Zady"],
    drug_class: "Azalide Macrolide Antibacterial",
    common_uses: [
      "Community-acquired respiratory tract infections (bronchitis, pneumonia)",
      "Acute bacterial sinusitis and otitis media",
      "Uncomplicated skin and soft tissue bacterial infections",
    ],
    common_side_effects: [
      "Diarrhea and loose stools",
      "Nausea and abdominal cramping",
      "Transient elevation in transaminases",
    ],
    important_warnings: [
      "Cardiovascular Safety: Risk of QT interval prolongation, torsades de pointes, and fatal cardiac dysrhythmias.",
      "Contraindicated in patients with a history of cholestatic jaundice or hepatic dysfunction associated with prior azithromycin use.",
    ],
    drug_interactions: [
      "Antiarrhythmics (Amiodarone, Sotalol): Synergistic QT interval prolongation.",
      "Atorvastatin: Potential for increased statin exposure and myopathy.",
      "Antacids containing Aluminum/Magnesium: Reduces peak serum concentrations.",
    ],
    precautions: [
      "Avoid in patients with known prolongation of the QT interval or severe hypokalemia.",
      "Caution in baseline severe hepatic disease.",
    ],
    treatment_duration_notes:
      "Short course (typically 3 to 5 days) due to sustained intracellular half-life (68 hours).",
    provenance: "WHO Essential Medicines (Watch Group); FDA Drug Safety Communication",
  },
  {
    id: "MED-010",
    generic_name: "Losartan",
    example_brand_names: ["Cozaar", "Losar", "Repace", "Alsartan"],
    drug_class: "Angiotensin II Receptor Antagonist (ARB)",
    common_uses: [
      "Treatment of essential hypertension",
      "Reduction of stroke risk in patients with hypertension and left ventricular hypertrophy",
      "Renoprotection in type 2 diabetic patients with proteinuria",
    ],
    common_side_effects: [
      "Dizziness and lightheadedness",
      "Upper respiratory tract infection-like symptoms",
      "Nasal congestion",
      "Mild hyperkalemia",
    ],
    important_warnings: [
      "Boxed Warning: Fetal Toxicity. Can cause fetal renal failure and death; discontinue when pregnancy is detected.",
    ],
    drug_interactions: [
      "NSAIDs: May decrease antihypertensive efficacy and augment renal impairment.",
      "Potassium Supplements: Risk of severe hyperkalemia.",
      "Lithium: May increase serum lithium levels.",
    ],
    precautions: [
      "Monitor serum potassium and renal function periodically.",
      "Correct volume depletion prior to therapy initiation.",
    ],
    treatment_duration_notes:
      "Long-term continuous therapy for blood pressure and renal risk management.",
    provenance: "WHO Model List of Essential Medicines; US FDA Package Insert (NDA 020386)",
  },
];

export const DOCUMENTED_DRUG_INTERACTIONS: DrugInteractionPair[] = [
  {
    drug_a: "Ibuprofen",
    drug_b: "Lisinopril",
    severity: "Moderate",
    mechanism: "Competitive renal prostaglandin inhibition blunts vasodilatory counter-regulation.",
    explanation:
      "NSAIDs inhibit renal vasodilatory prostaglandin synthesis, reducing the antihypertensive effect of ACE inhibitors and increasing the risk of acute renal deterioration and hyperkalemia.",
    safety_recommendation:
      "Monitor blood pressure, serum creatinine, and potassium. Ensure adequate hydration. Consider acetaminophen as an alternative non-nephrotoxic analgesic if acute pain management is required.",
    consultation_notice:
      "Discuss with your prescribing physician or clinical pharmacist prior to combining for more than 48 hours.",
    provenance: "Goodman & Gilman 14th Ed. / FDA Lisinopril Drug Interaction Monograph",
  },
  {
    drug_a: "Atorvastatin",
    drug_b: "Azithromycin",
    severity: "Moderate",
    mechanism: "Weak CYP3A4 inhibition and P-glycoprotein transport modulation.",
    explanation:
      "Macrolides can inhibit hepatic and intestinal P-glycoprotein and weakly modulate CYP3A4-mediated statin clearance, increasing systemic exposure of atorvastatin.",
    safety_recommendation:
      "Monitor for unexplained muscle aches, tenderness, or unusual weakness (myopathy). If significant myalgia develops, temporarily suspend statin therapy and evaluate serum creatine kinase.",
    consultation_notice:
      "Seek immediate medical advice if dark tea-colored urine or persistent generalized muscle tenderness develops.",
    provenance: "FDA Atorvastatin Clinical Pharmacology Review / PubMed PMID 15637530",
  },
  {
    drug_a: "Ibuprofen",
    drug_b: "Omeprazole",
    severity: "Minor",
    mechanism: "Proton pump inhibition reduces gastric acid secretion without pharmacokinetic antagonism.",
    explanation:
      "Omeprazole reduces gastric acid secretion and is frequently co-prescribed intentionally to mitigate NSAID-induced gastric mucosal erosion. No adverse pharmacokinetic competition exists.",
    safety_recommendation:
      "Appropriate therapeutic combination when gastroprotection is indicated during NSAID therapy.",
    consultation_notice: "Consult doctor if severe abdominal pain or black tarry stools develop.",
    provenance: "British National Formulary (BNF) / Clinical Gastroenterology Monographs",
  },
  {
    drug_a: "Omeprazole",
    drug_b: "Atorvastatin",
    severity: "Minor",
    mechanism: "Gastric pH alteration does not clinically impair statin absorption.",
    explanation:
      "Alterations in gastric pH do not significantly alter the bioavailability or systemic exposure of atorvastatin.",
    safety_recommendation: "Generally safe to co-administer; no dosage modification routinely required.",
    consultation_notice: "Routine follow-up.",
    provenance: "Clinical Pharmacokinetics Reference Monograph / FDA Drug Safety Database",
  },
  {
    drug_a: "Lisinopril",
    drug_b: "Metformin",
    severity: "Minor",
    mechanism: "Complementary pharmacodynamic profile in metabolic-cardiovascular disease.",
    explanation:
      "Complementary therapeutic combination in diabetic patients with hypertension or proteinuria. ACE inhibitors do not impair metformin disposition.",
    safety_recommendation:
      "Standard combination with periodic monitoring of serum creatinine, eGFR, and electrolytes.",
    consultation_notice: "Routine medical follow-up.",
    provenance: "American Diabetes Association / KDOQI Clinical Guidelines",
  },
  {
    drug_a: "Acetaminophen",
    drug_b: "Ibuprofen",
    severity: "Minor",
    mechanism: "Complementary central analgesic vs peripheral COX inhibition.",
    explanation:
      "Distinct mechanisms of action (central analgesic/antipyretic vs peripheral COX inhibition).",
    safety_recommendation:
      "Can be used concurrently or staggered for acute moderate pain under directed guidelines, ensuring maximum daily doses are not exceeded (Acetaminophen ≤ 4000 mg/day, Ibuprofen ≤ 1200-2400 mg/day).",
    consultation_notice: "Confirm non-prescription dosing limits with pharmacist.",
    provenance: "Cochrane Database of Systematic Reviews (CD008659)",
  },
  {
    drug_a: "Ibuprofen",
    drug_b: "Losartan",
    severity: "Moderate",
    mechanism: "Renal prostaglandin synthesis attenuation counteracts ARB hemodynamic action.",
    explanation:
      "NSAIDs can attenuate the antihypertensive effect of ARBs and compound the risk of renal function decline, particularly in dehydrated or elderly individuals.",
    safety_recommendation:
      "Monitor blood pressure and renal function. Avoid prolonged concurrent use without medical supervision.",
    consultation_notice: "Contact physician before regular combination.",
    provenance: "US FDA Losartan Product Monograph",
  },
];
