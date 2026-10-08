import benchmarkResultsJson from "../../../eval/benchmark_results.json";
import benchmarkVignettesJson from "../../../eval/benchmark_vignettes.json";

export interface BenchmarkArchitecture {
  name: string;
  meanGrounding: number;
  sdGrounding: number;
  ci95Grounding: [number, number];
  meanSafety: number;
  sdSafety: number;
  ci95Safety: [number, number];
  meanExplainability: number;
  sdExplainability: number;
  ci95Explainability: [number, number];
  meanLatency: number;
  sdLatency: number;
  meanGhostCitation: number;
  primaryFailureMode: string;
}

export interface DomainPerformance {
  grounding: number;
  safety: number;
  explainability: number;
  count: number;
}

export interface BenchmarkVignette {
  id: string;
  domain: string;
  title: string;
  age: string;
  sex: string;
  presentation: string;
  vitals: string;
  labs: string;
  medications: string;
  allergies: string;
  referenceDifferentials: Array<{
    condition: string;
    likelihood: string;
    grounded: boolean;
  }>;
  trueContraindications: string[];
  expectedCitations: string[];
}

export interface LatencyStage {
  stage: string;
  seconds: number;
  percentage: number;
}

export interface ModelFactItem {
  dimension: string;
  specification: string;
}

export interface PaperCaseStudy {
  id: string;
  scenario: string;
  presentation: string;
  prioritizedDifferentials: string[];
  groundedCitations: string[];
  safetyAuditFlags: string;
}

export const BENCHMARK_RESULTS = benchmarkResultsJson as unknown as {
  timestamp: string;
  vignetteCount: number;
  architectures: Record<string, BenchmarkArchitecture>;
  domainBreakdown: Record<string, DomainPerformance>;
};

export const BENCHMARK_VIGNETTES = benchmarkVignettesJson as BenchmarkVignette[];

export const LATENCY_STAGES: LatencyStage[] = [
  { stage: "1. Planner Agent (LLM JSON)", seconds: 1.4, percentage: 9.5 },
  { stage: "2. Biomedical Retrieval (PubMed / EPMC)", seconds: 2.4, percentage: 16.2 },
  { stage: "3. Knowledge Graph Subgraph Extraction", seconds: 0.05, percentage: 0.3 },
  { stage: "4. Drug & Allergy Checking (RxNav / FDA)", seconds: 1.8, percentage: 12.2 },
  { stage: "5. Clinical Reasoning Agent (LLM CoT)", seconds: 4.2, percentage: 28.4 },
  { stage: "6. Safety Auditor Agent (Citation Audit)", seconds: 2.1, percentage: 14.2 },
  { stage: "7. Explainability & Confidence Evaluation", seconds: 0.85, percentage: 5.7 },
  { stage: "8. Report Generator Agent (Markdown)", seconds: 2.0, percentage: 13.5 },
];

export const MODEL_FACTS_SPEC: ModelFactItem[] = [
  {
    dimension: "Intended Use",
    specification:
      "Evidence-based Clinical Decision Support System (CDSS) for differential diagnosis exploration and literature synthesis.",
  },
  {
    dimension: "Autonomous Diagnosis",
    specification:
      "Strictly Prohibited. The system operates solely as a clinical decision aid and does not issue binding diagnoses.",
  },
  {
    dimension: "Target Users",
    specification:
      "Licensed physicians, resident medical officers, and supervised medical students in academic and clinical environments.",
  },
  {
    dimension: "Evidence Sources",
    specification:
      "NCBI PubMed E-utilities, Europe PMC, ClinicalTrials.gov v2, WHO Guidelines, openFDA drug labels, and NIH RxNav / RxNorm.",
  },
  {
    dimension: "Imaging Modality",
    specification:
      "2D Chest Radiographs (PNG/JPEG) via in-browser DenseNet-121 WASM occlusion sensitivity (zero cloud pixel transmission).",
  },
  {
    dimension: "Human Oversight",
    specification:
      "Mandatory. Qualified clinicians must review and confirm all clinical differential rankings, dosages, and recommendations.",
  },
  {
    dimension: "Major Limitations",
    specification:
      "Dependent on live public biomedical APIs; evaluation protocol spans 50 curated clinical vignettes; 2D PA radiographs only.",
  },
  {
    dimension: "Regulatory Status",
    specification:
      "Academic Research Prototype. Not certified as an FDA or CE Mark Class IIa/IIb medical device.",
  },
];

export const PAPER_CASE_STUDIES: PaperCaseStudy[] = [
  {
    id: "case-1",
    scenario: "Case 1: ACS / Anterior STEMI",
    presentation:
      "58M, severe retrosternal chest pressure, diaphoresis; ECG: ST-elevation V2-V4; HR 48 bpm, BP 90/60 mmHg.",
    prioritizedDifferentials: [
      "1. Anterior STEMI (High likelihood)",
      "2. Acute Aortic Dissection Type A (Moderate)",
      "3. Acute Myocarditis (Low)",
    ],
    groundedCitations: [
      "ACC/AHA Guidelines (PMID: 34756127)",
      "ESC STEMI 2023 (PMID: 37622659)",
      "ESC Practice Guidelines (guide:cardiology:0)",
    ],
    safetyAuditFlags:
      "CRITICAL SAFETY FLAG: Beta-blockers (Metoprolol) contraindicated due to severe bradycardia (HR 48 bpm) and borderline hypotension. Urgent transfer to Cardiac Catheterisation Laboratory.",
  },
  {
    id: "case-2",
    scenario: "Case 2: Severe Pneumonia (CAP)",
    presentation:
      "72M, fever 38.9C, productive cough, SpO2 91% on room air, CURB-65 = 3; CXR: dense right lower lobe consolidation.",
    prioritizedDifferentials: [
      "1. Community-Acquired Pneumonia (High likelihood)",
      "2. Acute Pulmonary Embolism (Moderate)",
      "3. Heart Failure Exacerbation (Low)",
    ],
    groundedCitations: [
      "NICE NG138 Community-Acquired Pneumonia Guidelines",
      "IDSA/ATS CAP Clinical Practice Guideline (PMID: 31573350)",
      "In-browser DenseNet-121 Saliency Localization",
    ],
    safetyAuditFlags:
      "IMAGING LOCALISATION AID: In-browser saliency heatmap highlights dense right lower lobe consolidation patch. CURB-65 score of 3 indicates hospital admission.",
  },
  {
    id: "case-3",
    scenario: "Case 3: Penicillin Anaphylaxis & Antibiotic Selection",
    presentation:
      "45F, dysuria, flank pain, fever 38.5C; Documented history of Penicillin anaphylaxis (IgE-mediated).",
    prioritizedDifferentials: [
      "1. Acute Pyelonephritis (High likelihood)",
      "2. Complicated Urinary Tract Infection (High)",
      "3. Renal Abscess (Low)",
    ],
    groundedCitations: [
      "IDSA Pyelonephritis Practice Guidelines (PMID: 21258094)",
      "openFDA Monograph: Ciprofloxacin (fda:ciprofloxacin)",
      "CDC Clinical Treatment Guidance",
    ],
    safetyAuditFlags:
      "DETERMINISTIC PHARMACOLOGY BLOCK: Amoxicillin-Clavulanate and Cephalosporins blocked due to documented anaphylaxis risk. Recommended Ciprofloxacin or Aztreonam regimen.",
  },
  {
    id: "case-4",
    scenario: "Case 4: Thunderclap Headache / SAH",
    presentation:
      "42F, sudden onset maximal intensity headache ('worst headache of life'), photophobia, neck stiffness, BP 160/95 mmHg.",
    prioritizedDifferentials: [
      "1. Subarachnoid Hemorrhage (High likelihood)",
      "2. Bacterial Meningitis (Moderate)",
      "3. Cerebral Venous Thrombosis (Low)",
    ],
    groundedCitations: [
      "AHA/ASA Aneurysmal SAH Guidelines (PMID: 37218384)",
      "Oxford CEBM Tier 1 Systematic Review",
      "NICE Neurological Emergencies Guidance",
    ],
    safetyAuditFlags:
      "EMERGENCY TRIAGE ALERT: Immediate non-contrast cranial CT within 6 hours. Absolutely contraindicated all NSAIDs and antiplatelet agents due to acute intracranial haemorrhage risk.",
  },
];
