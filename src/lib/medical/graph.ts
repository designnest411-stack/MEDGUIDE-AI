import type { GraphEdge, GraphNode } from "@/lib/agents/types";

/**
 * Seeded clinical knowledge graph.
 * Disease -> symptoms -> risk factors -> labs -> drugs -> contraindications
 * -> treatments -> complications.
 */

interface DiseaseSpec {
  id: string;
  label: string;
  symptoms: string[];
  risks: string[];
  labs: string[];
  drugs: string[];
  contraindications: string[];
  treatments: string[];
  complications: string[];
}

export const DISEASES: DiseaseSpec[] = [
  {
    id: "community-acquired-pneumonia",
    label: "Community-Acquired Pneumonia",
    symptoms: ["Productive cough", "Fever", "Pleuritic chest pain", "Dyspnoea", "Tachypnoea"],
    risks: ["Age > 65", "Smoking", "COPD", "Immunosuppression", "Alcohol use"],
    labs: ["CRP", "White cell count", "Blood cultures", "Chest X-ray", "Sputum culture"],
    drugs: ["Amoxicillin", "Doxycycline", "Azithromycin", "Ceftriaxone"],
    contraindications: ["Penicillin allergy", "QT prolongation (macrolides)"],
    treatments: [
      "Oral antibiotics (CURB-65 0-1)",
      "IV antibiotics + admission (CURB-65 >= 2)",
      "Oxygen therapy",
    ],
    complications: ["Parapneumonic effusion", "Empyema", "Sepsis", "Respiratory failure"],
  },
  {
    id: "acute-coronary-syndrome",
    label: "Acute Coronary Syndrome",
    symptoms: [
      "Crushing chest pain",
      "Radiation to jaw or left arm",
      "Diaphoresis",
      "Nausea",
      "Dyspnoea",
    ],
    risks: ["Hypertension", "Diabetes mellitus", "Smoking", "Hyperlipidaemia", "Family history"],
    labs: ["High-sensitivity troponin", "12-lead ECG", "Lipid profile", "HbA1c"],
    drugs: ["Aspirin", "Ticagrelor", "Atorvastatin", "Metoprolol", "Heparin"],
    contraindications: [
      "Active bleeding",
      "Recent haemorrhagic stroke",
      "Severe bradycardia (beta blockers)",
    ],
    treatments: [
      "Dual antiplatelet therapy",
      "Primary PCI",
      "Fibrinolysis if PCI unavailable",
      "Cardiac rehabilitation",
    ],
    complications: ["Cardiogenic shock", "Arrhythmia", "Heart failure", "Mechanical rupture"],
  },
  {
    id: "type-2-diabetes",
    label: "Type 2 Diabetes Mellitus",
    symptoms: ["Polyuria", "Polydipsia", "Fatigue", "Blurred vision", "Slow wound healing"],
    risks: ["Obesity", "Sedentary lifestyle", "Family history", "Gestational diabetes"],
    labs: ["HbA1c", "Fasting glucose", "eGFR", "Urine ACR", "Lipid profile"],
    drugs: ["Metformin", "Empagliflozin", "Semaglutide", "Gliclazide", "Insulin glargine"],
    contraindications: [
      "eGFR < 30 (metformin)",
      "History of DKA (SGLT2)",
      "Personal MTC history (GLP-1)",
    ],
    treatments: [
      "Lifestyle modification",
      "Metformin first line",
      "SGLT2 inhibitor if CV/renal disease",
      "Structured education",
    ],
    complications: ["Diabetic retinopathy", "Nephropathy", "Neuropathy", "Cardiovascular disease"],
  },
  {
    id: "pulmonary-embolism",
    label: "Pulmonary Embolism",
    symptoms: ["Sudden dyspnoea", "Pleuritic chest pain", "Haemoptysis", "Tachycardia", "Syncope"],
    risks: ["Recent surgery", "Immobility", "Malignancy", "Oestrogen therapy", "Prior VTE"],
    labs: ["D-dimer", "CTPA", "Arterial blood gas", "ECG", "Troponin"],
    drugs: ["Apixaban", "Rivaroxaban", "Enoxaparin", "Warfarin", "Alteplase"],
    contraindications: ["Active major bleeding", "Severe thrombocytopenia", "Pregnancy (DOACs)"],
    treatments: [
      "Anticoagulation",
      "Thrombolysis if haemodynamically unstable",
      "IVC filter if anticoagulation contraindicated",
    ],
    complications: [
      "Right heart strain",
      "Chronic thromboembolic pulmonary hypertension",
      "Sudden death",
    ],
  },
  {
    id: "asthma-exacerbation",
    label: "Asthma Exacerbation",
    symptoms: ["Wheeze", "Chest tightness", "Nocturnal cough", "Breathlessness"],
    risks: ["Atopy", "Allergen exposure", "Viral infection", "Poor inhaler adherence"],
    labs: ["Peak expiratory flow", "Spirometry", "FeNO", "Oxygen saturation"],
    drugs: [
      "Salbutamol",
      "Prednisolone",
      "Ipratropium",
      "Budesonide/formoterol",
      "Magnesium sulfate",
    ],
    contraindications: ["Non-selective beta blockers", "NSAID sensitivity subgroup"],
    treatments: [
      "Inhaled bronchodilators",
      "Systemic corticosteroids",
      "Controlled oxygen",
      "Escalation to HDU if life-threatening",
    ],
    complications: ["Respiratory failure", "Pneumothorax", "Status asthmaticus"],
  },
  {
    id: "chronic-kidney-disease",
    label: "Chronic Kidney Disease",
    symptoms: ["Fatigue", "Peripheral oedema", "Nocturia", "Pruritus", "Anorexia"],
    risks: ["Diabetes", "Hypertension", "NSAID use", "Glomerulonephritis"],
    labs: ["eGFR", "Urine ACR", "Serum potassium", "Parathyroid hormone", "Haemoglobin"],
    drugs: ["Ramipril", "Empagliflozin", "Furosemide", "Sevelamer", "Erythropoietin"],
    contraindications: [
      "Bilateral renal artery stenosis (ACEi)",
      "Hyperkalaemia",
      "Contrast nephrotoxicity",
    ],
    treatments: [
      "Blood pressure control",
      "RAAS blockade",
      "SGLT2 inhibitor",
      "Dialysis planning in stage 5",
    ],
    complications: ["Anaemia", "Renal bone disease", "Hyperkalaemia", "End-stage renal failure"],
  },
];

const TYPE_OF: Record<string, GraphNode["type"]> = {
  symptoms: "symptom",
  risks: "risk",
  labs: "lab",
  drugs: "drug",
  contraindications: "contraindication",
  treatments: "treatment",
  complications: "complication",
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function buildGraph(
  diseaseIds?: string[],
  /** Cap branches per relation type so the canvas stays readable. */
  maxPerRelation = Infinity,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const list = diseaseIds?.length ? DISEASES.filter((d) => diseaseIds.includes(d.id)) : DISEASES;
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  for (const d of list) {
    nodes.set(d.id, { id: d.id, label: d.label, type: "disease" });
    for (const key of Object.keys(TYPE_OF) as (keyof typeof TYPE_OF)[]) {
      const values = (d[key as keyof DiseaseSpec] as string[]).slice(0, maxPerRelation);
      for (const v of values) {
        const id = `${TYPE_OF[key]}:${slug(v)}`;
        if (!nodes.has(id)) nodes.set(id, { id, label: v, type: TYPE_OF[key]! });
        edges.push({ id: `${d.id}->${id}`, source: d.id, target: id, label: key });
      }
    }
  }
  return { nodes: [...nodes.values()], edges };
}

/** Naive keyword match of free text against the disease library. */
export function matchDiseases(text: string, limit = 3): DiseaseSpec[] {
  const t = text.toLowerCase();
  const scored = DISEASES.map((d) => {
    const terms = [d.label, ...d.symptoms, ...d.risks, ...d.drugs, ...d.complications];
    const score = terms.reduce((acc, term) => {
      const words = term
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter((w) => w.length > 4);
      return acc + words.filter((w) => t.includes(w)).length;
    }, 0);
    return { d, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return (scored.length ? scored : DISEASES.map((d) => ({ d, score: 0 })))
    .slice(0, limit)
    .map((s) => s.d);
}

export const NODE_COLORS: Record<GraphNode["type"], string> = {
  disease: "var(--color-primary)",
  symptom: "var(--color-info)",
  risk: "var(--color-warning)",
  lab: "var(--color-evidence)",
  drug: "var(--color-agent)",
  contraindication: "var(--color-destructive)",
  treatment: "var(--color-success)",
  complication: "var(--color-chart-5)",
};
