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
    diagnosis: "Suspected bronchogenic carcinoma — referred on 2-week pathway",
    treatment: "CT thorax, bronchoscopy with biopsy, MDT referral",
    outcome: "Stage IIB NSCLC, treated with lobectomy and adjuvant chemotherapy",
    tags: ["cough", "weight loss", "smoking", "chest x-ray", "malignancy"],
  },
];

/**
 * Lightweight lexical similarity — no server round trip needed.
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
