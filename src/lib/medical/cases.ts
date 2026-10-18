import type { SimilarCase } from "@/lib/agents/types";

/** Educational, de-identified reference cases used by the Case Similarity Agent. */
export const CASE_LIBRARY: SimilarCase[] = [
  {
    id: "case-001",
    title: "Elderly man with productive cough and fever",
    age: 72,
    sex: "M",
    presentation:
      "4 days of productive cough, fever 38.9C, right basal crackles, RR 26, SpO2 91% on air.",
    diagnosis: "Community-acquired pneumonia, CURB-65 score 3",
    treatment: "IV co-amoxiclav plus clarithromycin, controlled oxygen, fluid resuscitation",
    outcome: "Discharged day 6, CRP normalised, follow-up chest X-ray at 6 weeks clear",
    tags: ["pneumonia", "cough", "fever", "hypoxia", "elderly"],
  },
  {
    id: "case-002",
    title: "Middle-aged man with crushing central chest pain",
    age: 58,
    sex: "M",
    presentation:
      "45 minutes of central crushing chest pain radiating to jaw, diaphoresis, ST elevation V2-V4.",
    diagnosis: "Anterior STEMI",
    treatment: "Aspirin, ticagrelor, heparin, primary PCI to LAD within 70 minutes",
    outcome: "EF 45% at discharge, enrolled in cardiac rehabilitation, symptom-free at 3 months",
    tags: ["chest pain", "acs", "stemi", "ecg", "pci"],
  },
  {
    id: "case-003",
    title: "Young woman with sudden pleuritic pain post-flight",
    age: 34,
    sex: "F",
    presentation:
      "Sudden pleuritic chest pain and dyspnoea 2 days after long-haul flight, HR 118, on combined oral contraceptive.",
    diagnosis: "Segmental pulmonary embolism",
    treatment: "Apixaban 10mg BD for 7 days then 5mg BD, contraceptive stopped",
    outcome: "Full recovery, 3-month anticoagulation, thrombophilia screen negative",
    tags: ["pulmonary embolism", "dyspnoea", "pleuritic", "travel", "contraceptive"],
  },
  {
    id: "case-004",
    title: "Obese adult with polyuria and fatigue",
    age: 49,
    sex: "F",
    presentation: "3 months of polyuria, polydipsia, fatigue, BMI 34, HbA1c 78 mmol/mol.",
    diagnosis: "Type 2 diabetes mellitus",
    treatment: "Metformin titrated to 1g BD, empagliflozin added at 3 months, structured education",
    outcome: "HbA1c 52 mmol/mol at 6 months, 7kg weight loss",
    tags: ["diabetes", "polyuria", "fatigue", "hba1c", "metformin"],
  },
  {
    id: "case-005",
    title: "Asthmatic teenager with night-time wheeze",
    age: 17,
    sex: "M",
    presentation: "Nocturnal wheeze 4 nights per week, PEF 62% predicted, reliever used daily.",
    diagnosis: "Poorly controlled asthma with exacerbation",
    treatment: "Prednisolone 40mg for 5 days, switched to MART regimen, inhaler technique review",
    outcome: "PEF 92% predicted at 4 weeks, reliever use down to twice monthly",
    tags: ["asthma", "wheeze", "peak flow", "inhaler", "steroid"],
  },
  {
    id: "case-006",
    title: "Diabetic man with declining renal function",
    age: 66,
    sex: "M",
    presentation: "eGFR fell 52 to 38 over 12 months, urine ACR 42 mg/mmol, BP 156/92.",
    diagnosis: "Diabetic kidney disease, CKD stage 3b",
    treatment: "Ramipril uptitrated, empagliflozin started, NSAIDs stopped, BP target < 130/80",
    outcome: "eGFR stabilised at 36, ACR halved at 9 months",
    tags: ["ckd", "diabetes", "proteinuria", "hypertension", "egfr"],
  },
  {
    id: "case-007",
    title: "Post-operative patient with hypoxia on day 3",
    age: 61,
    sex: "F",
    presentation:
      "Day 3 after hip arthroplasty, sudden desaturation to 88%, tachycardia, calf tenderness.",
    diagnosis: "Pulmonary embolism with proximal DVT",
    treatment: "Therapeutic enoxaparin then apixaban, early mobilisation",
    outcome: "Recovered, anticoagulated 6 months, no recurrence at 1 year",
    tags: ["pulmonary embolism", "post-operative", "dvt", "hypoxia"],
  },
  {
    id: "case-008",
    title: "Smoker with chronic cough and weight loss",
    age: 68,
    sex: "M",
    presentation:
      "8 weeks of cough, 6kg weight loss, 40 pack-year history, right hilar opacity on chest X-ray.",
    diagnosis: "Suspected bronchogenic carcinoma: referred on 2-week pathway",
    treatment: "CT thorax, bronchoscopy with biopsy, MDT referral",
    outcome: "Stage IIB NSCLC, treated with lobectomy and adjuvant chemotherapy",
    tags: ["cough", "weight loss", "smoking", "chest x-ray", "malignancy"],
  },
  {
    id: "case-009",
    title: "Hypertensive woman with orthopnoea and bilateral leg swelling",
    age: 74,
    sex: "F",
    presentation:
      "Progressive exertional breathlessness, waking gasping for breath, 3-pillow orthopnoea, elevated JVP 5cm, bilateral pitting pedal oedema to mid-calf.",
    diagnosis: "Acute decompensated heart failure (HFrEF, EF 32%), NT-proBNP 4,800 pg/mL",
    treatment: "IV furosemide bolus followed by infusion, fluid restriction, titration onto guideline-directed 4-pillar medical therapy (Sacubitril/valsartan, Dapagliflozin, Bisoprolol, Spironolactone)",
    outcome: "Euvolic at discharge with 5.5kg fluid loss, ambulatory NYHA Class II at 6-week review",
    tags: ["heart failure", "orthopnoea", "edema", "bnp", "cardiomyopathy"],
  },
  {
    id: "case-010",
    title: "Retired engineer with palpitations and irregular pulse",
    age: 67,
    sex: "M",
    presentation:
      "Sudden onset fluttering in chest, dizziness, BP 138/84, irregular pulse at 134 bpm. ECG confirms absent P waves with irregular ventricular rate.",
    diagnosis: "New-onset Atrial Fibrillation with rapid ventricular response, CHA2DS2-VASc 3",
    treatment: "Rate control with oral Bisoprolol 2.5mg BD, therapeutic oral anticoagulation started with Apixaban 5mg BD, outpatient cardiology referral for rhythm strategy",
    outcome: "Resting HR controlled at 76 bpm, elective DCCV performed at 4 weeks with sinus rhythm restoration",
    tags: ["atrial fibrillation", "palpitations", "arrhythmia", "anticoagulation", "ecg"],
  },
  {
    id: "case-011",
    title: "Middle-aged man with sudden interscapular tearing pain",
    age: 54,
    sex: "M",
    presentation:
      "Sudden catastrophic tearing pain between shoulder blades, BP right arm 188/104, left arm 152/88. Diaphoretic and pale.",
    diagnosis: "Acute Stanford Type A Aortic Dissection involving ascending aorta",
    treatment: "Immediate IV Labetalol infusion targeting systolic BP < 120 mmHg and HR < 60 bpm, emergency cardiothoracic surgical consultation, urgent hemiarch replacement",
    outcome: "Successful surgical repair, uncomplicated ICU stay, recovered well with lifelong strict blood pressure surveillance",
    tags: ["aortic dissection", "tearing pain", "hypertension", "emergency", "surgery"],
  },
  {
    id: "case-012",
    title: "Young male with persistent night sweats and new murmur",
    age: 29,
    sex: "M",
    presentation:
      "6 weeks of lethargy, low-grade fevers to 38.2C, night sweats, splinter hemorrhages on fingernails, new pan-systolic murmur at apex.",
    diagnosis: "Subacute Bacterial Endocarditis (Streptococcus viridans) on mitral valve",
    treatment: "Six-week course of IV Benzylpenicillin plus Gentamicin synergistic therapy, echocardiographic vegetation monitoring",
    outcome: "Blood cultures cleared by day 3, complete resolution of systemic symptoms without need for acute valve surgery",
    tags: ["endocarditis", "fever", "murmur", "bacteremia", "echocardiogram"],
  },
  {
    id: "case-013",
    title: "Long-standing smoker with acute wheeze and purulent sputum",
    age: 69,
    sex: "M",
    presentation:
      "Severe dyspnoea, green sputum, RR 28, SpO2 86% on air, ABG: pH 7.31, PaCO2 7.1 kPa, PaO2 7.6 kPa (acute respiratory acidosis).",
    diagnosis: "Acute severe COPD exacerbation with hypercapnic respiratory failure",
    treatment: "Controlled 28% Venturi oxygen targeting SpO2 88-92%, nebulised Salbutamol + Ipratropium, oral Prednisolone 30mg, Amoxicillin, non-invasive ventilation (NIV BiPAP) for 24 hours",
    outcome: "Respiratory acidosis resolved by hour 6, weaned from BiPAP on day 3, discharged with pulmonary rehabilitation plan",
    tags: ["copd", "hypercapnia", "wheeze", "respiratory acidosis", "bipap"],
  },
  {
    id: "case-014",
    title: "Tall young male with sudden dyspnoea and tracheal deviation",
    age: 22,
    sex: "M",
    presentation:
      "Sudden sharp right-sided chest pain while sitting, extreme breathlessness, cyanosis, absent right breath sounds, trachea shifted to left, BP 84/52.",
    diagnosis: "Right-sided Tension Pneumothorax",
    treatment: "Immediate life-saving needle decompression at 2nd intercostal space mid-clavicular line, rapid rush of air, followed immediately by 24Fr chest tube insertion with underwater seal",
    outcome: "Immediate hemodynamic recovery (BP 124/78), lung fully reinflated on post-procedure X-ray, drain removed on day 4",
    tags: ["pneumothorax", "emergency", "decompression", "chest tube", "shock"],
  },
  {
    id: "case-015",
    title: "Teenager with nausea, vomiting and fruity breath odour",
    age: 18,
    sex: "F",
    presentation:
      "2 days of severe nausea, vomiting, abdominal pain, deep rapid sighing respirations, acetone breath, capillary glucose 28 mmol/L, capillary ketones 5.2 mmol/L, venous pH 7.18.",
    diagnosis: "Severe Diabetic Ketoacidosis (DKA) presenting as first manifestation of Type 1 Diabetes",
    treatment: "Intravenous 0.9% saline fluid resuscitation protocol, fixed-rate IV insulin infusion (0.1 units/kg/hr), potassium chloride infusion to maintain K+ > 4.5, transitioned to basal-bolus subcutaneous regimen after ketoacidosis cleared",
    outcome: "Full metabolic recovery within 24 hours (pH 7.38, ketones 0.3), intensive diabetes nurse education completed",
    tags: ["dka", "diabetes", "acidosis", "ketones", "insulin"],
  },
  {
    id: "case-016",
    title: "Elderly woman with profound lethargy and hyperosmolality",
    age: 81,
    sex: "F",
    presentation:
      "Brought from care facility with marked confusion, dry mucous membranes, glucose 44 mmol/L, serum osmolality 348 mOsm/kg, trace urinary ketones, venous pH 7.36.",
    diagnosis: "Hyperosmolar Hyperglycemic State (HHS) triggered by urinary tract infection",
    treatment: "Careful slow IV 0.9% saline resuscitation over 48 hours, low-dose insulin infusion initiated once glucose stopped falling with fluids, therapeutic LMWH thromboprophylaxis, IV Ceftriaxone for UTI",
    outcome: "Gradual cognitive clearance, osmolality normalized without neurological deficit, discharged on oral hypoglycemics",
    tags: ["hhs", "hyperosmolar", "dehydration", "elderly", "hyperglycemia"],
  },
  {
    id: "case-017",
    title: "Accountant with sudden right-sided hemiplegia and expressive aphasia",
    age: 63,
    sex: "M",
    presentation:
      "Sudden right facial weakness, right arm and leg paralysis, inability to speak, onset witnessed 55 minutes prior. Non-contrast CT brain negative for hemorrhage. CTA demonstrates left M1 MCA occlusion.",
    diagnosis: "Acute Ischemic Stroke (Left MCA territory, NIHSS 18)",
    treatment: "Intravenous Tenecteplase bolus administered at door-to-needle time of 28 minutes, transferred immediately to catheterisation suite for emergency endovascular mechanical thrombectomy (TICI 3 revascularisation achieved)",
    outcome: "Dramatic neurological improvement: NIHSS 2 at 24 hours, discharged walking independently at day 5 with minimal speech impairment",
    tags: ["stroke", "thrombectomy", "thrombolysis", "aphasia", "neurology"],
  },
  {
    id: "case-018",
    title: "Woman with thunderclap occipital headache and photophobia",
    age: 46,
    sex: "F",
    presentation:
      "Instantaneous explosive headache 'like being struck on the back of head', peak severity within 5 seconds, vomiting, neck stiffness, Kernig sign positive.",
    diagnosis: "Subarachnoid Hemorrhage (Hunt & Hess Grade II) secondary to ruptured anterior communicating artery aneurysm",
    treatment: "Oral Nimodipine 60mg started immediately, urgent cerebral angiography, successful endovascular platinum coil embolization within 18 hours of admission",
    outcome: "Zero re-bleeding, no delayed cerebral ischemia, discharged on day 16 neurologically intact",
    tags: ["subarachnoid hemorrhage", "aneurysm", "headache", "thunderclap", "nimodipine"],
  },
  {
    id: "case-019",
    title: "College student with fever, neck rigidity and purpuric rash",
    age: 20,
    sex: "M",
    presentation:
      "Fever 39.4C, severe throbbing headache, photophobia, inability to touch chin to chest, non-blanching petechial and purpuric rash on lower limbs. Deteriorating GCS 12.",
    diagnosis: "Acute Meningococcal Meningitis and Septicaemia (Neisseria meningitidis)",
    treatment: "Immediate IV Ceftriaxone 2g and IV Dexamethasone 10mg started before imaging, intensive care monitoring, public health contact tracing with Ciprofloxacin prophylaxis for hallmates",
    outcome: "Rapid fever defervescence, rash resolved without tissue necrosis, hearing test normal on follow-up, made full recovery",
    tags: ["meningitis", "purpura", "fever", "infection", "ceftriaxone"],
  },
  {
    id: "case-020",
    title: "Female with acute boring epigastric pain radiating to back",
    age: 47,
    sex: "F",
    presentation:
      "Severe epigastric pain after fatty meal radiating through to lumbar spine, relieved somewhat by leaning forward, persistent bilious vomiting, serum lipase 1,940 U/L (normal < 60).",
    diagnosis: "Acute Gallstone Pancreatitis (Modified Glasgow score 1)",
    treatment: "Targeted IV crystalloid fluid therapy (Ringer's lactate 250 mL/hr), multimodal analgesia with IV fentanyl, ultrasound confirmed multiple cholelithiasis with common bile duct dilatation, early oral feeding resumed day 2",
    outcome: "Index-admission laparoscopic cholecystectomy performed on day 5, uneventful recovery with no recurrence",
    tags: ["pancreatitis", "lipase", "gallstones", "epigastric pain", "cholecystectomy"],
  },
  {
    id: "case-021",
    title: "Chronic arthritic patient with black tarry stools and dizziness",
    age: 62,
    sex: "F",
    presentation:
      "Taking high-dose Naproxen for knee osteoarthritis without gastroprotection. Presents with 2 days of dark black tarry offensive stool (melaena), postural syncope, resting HR 112, BP 94/58, Hb 72 g/L.",
    diagnosis: "Acute Upper Gastrointestinal Bleed secondary to Bleeding Duodenal Peptic Ulcer (Forrest IIa)",
    treatment: "IV resuscitation with packed red blood cells (target Hb > 80 g/L), high-dose IV Pantoprazole bolus + infusion, urgent gastroscopy within 12 hours with dual endoscopic hemostasis (adrenaline injection + through-the-scope clips)",
    outcome: "No re-bleeding, H. pylori stool antigen positive treated with 14-day triple eradication therapy, complete healing on repeat OGD at 8 weeks",
    tags: ["gi bleed", "melena", "peptic ulcer", "endoscopy", "nsaid"],
  },
  {
    id: "case-022",
    title: "Cirrhotic patient with sudden abdominal distension and confusion",
    age: 56,
    sex: "M",
    presentation:
      "Known alcoholic liver cirrhosis. Presents with worsening abdominal swelling, mild abdominal tenderness, low-grade fever 38.0C, and coarse flapping hand tremor (asterixis). Ascitic tap neutrophils 420/mm3.",
    diagnosis: "Decompensated Liver Cirrhosis with Spontaneous Bacterial Peritonitis (SBP) and Grade 2 Hepatic Encephalopathy",
    treatment: "IV Ceftriaxone 2g daily for 5 days, IV 20% Human Albumin Solution (1.5g/kg day 1, 1.0g/kg day 3 to prevent hepatorenal syndrome), oral Lactulose titrated to 3 soft stools/day plus Rifaximin 550mg BD",
    outcome: "Ascitic neutrophil count dropped to 80/mm3 by 48 hours, encephalopathy cleared, discharged on long-term Ciprofloxacin secondary SBP prophylaxis and liver transplant waitlist",
    tags: ["cirrhosis", "ascites", "sbp", "hepatic encephalopathy", "hepatology"],
  },
  {
    id: "case-023",
    title: "Dehydrated patient with anuria following gastroenteritis",
    age: 70,
    sex: "M",
    presentation:
      "4 days of severe profuse diarrhea and vomiting, unable to retain oral fluids, urine output < 100 mL in last 18 hours. Blood tests show serum creatinine 460 umol/L (baseline 82 umol/L), urea 28 mmol/L, K+ 5.8 mmol/L.",
    diagnosis: "Severe Acute Kidney Injury (KDIGO Stage 3) secondary to volume depletion / pre-renal azotemia and acute tubular necrosis",
    treatment: "Withheld all ACE inhibitors and NSAIDs, administered 3 litres IV balanced crystalloid in first 24 hours, tracked fluid balance with urinary catheter, insulin-dextrose for mild hyperkalaemia",
    outcome: "Brisk diuresis on day 2 (urine output 2.2 L/day), serum creatinine improved to 110 umol/L on discharge, normal renal ultrasound",
    tags: ["aki", "creatinine", "oliguria", "dehydration", "nephrology"],
  },
  {
    id: "case-024",
    title: "Post-chemotherapy patient with rigor, hypotension and fever",
    age: 53,
    sex: "F",
    presentation:
      "Receiving adjuvant chemotherapy for breast cancer. Presents with violent rigors, temperature 39.8C, BP 76/44, HR 130, RR 26, blood lactate 4.6 mmol/L, absolute neutrophil count 0.3 x 10^9/L.",
    diagnosis: "Septic Shock secondary to Neutropenic Enterocolitis / Bacteremia",
    treatment: "Surviving Sepsis Hour-1 bundle executed: immediate peripheral blood cultures, IV Meropenem 1g stat within 30 minutes, 30 mL/kg IV crystalloid fluid bolus, continuous Noradrenaline infusion titrated to MAP >= 65 mmHg, G-CSF support",
    outcome: "Lactate cleared to 1.4 mmol/L by hour 8, weaned off noradrenaline by day 3, ANC recovered to > 1.5, discharged home on day 9 in good health",
    tags: ["sepsis", "shock", "neutropenia", "noradrenaline", "lactate"],
  },
];

/**
 * Lightweight lexical similarity: no server round trip needed.
 *
 * Generic clinical filler ("disease", "patient", "treatment"…) is dropped so a
 * vague query cannot score an unrelated case at 100%. Tags and the diagnosis
 * carry more weight than free text, and the score is scaled by how much
 * usable signal the query actually contained.
 */
const STOPWORDS = new Set([
  "disease",
  "diseases",
  "patient",
  "patients",
  "case",
  "cases",
  "with",
  "what",
  "which",
  "should",
  "would",
  "could",
  "have",
  "this",
  "that",
  "there",
  "their",
  "about",
  "from",
  "into",
  "does",
  "doing",
  "been",
  "being",
  "most",
  "likely",
  "management",
  "treatment",
  "diagnosis",
  "differential",
  "clinical",
  "question",
  "please",
  "help",
  "need",
  "evidence",
  "give",
  "tell",
  "best",
  "next",
  "step",
  "steps",
  "consider",
  "considering",
  "risk",
  "risks",
  "history",
  "presents",
  "presenting",
  "year",
  "years",
  "male",
  "female",
  "adult",
]);

function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 3 && !STOPWORDS.has(w)),
    ),
  );
}

export function rankCases(query: string, limit = 4): SimilarCase[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return CASE_LIBRARY.map((c) => ({ ...c, score: 0 }));

  // A one-word query is weak evidence; damp the score so it never reads 100%.
  const confidence = Math.min(1, tokens.length / 4);

  return CASE_LIBRARY.map((c) => {
    const strong = `${c.diagnosis} ${c.tags.join(" ")} ${c.title}`.toLowerCase();
    const weak = `${c.presentation} ${c.treatment} ${c.outcome}`.toLowerCase();
    let hits = 0;
    for (const t of tokens) {
      if (strong.includes(t)) hits += 1;
      else if (weak.includes(t)) hits += 0.5;
    }
    return { ...c, score: Math.min(1, (hits / tokens.length) * confidence) };
  })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit);
}
